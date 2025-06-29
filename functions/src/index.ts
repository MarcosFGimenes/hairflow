import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import axios from "axios"; // Usaremos axios para a requisição HTTP

// --- INÍCIO DA SOLUÇÃO DEFINITIVA ---

/**
 * Função para calcular o CRC16-CCITT-FALSE, necessário no final do código Pix.
 * Esta é uma implementação padrão.
 */
const crc16ccitt = (data: string): string => {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) > 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return ("0000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
};

/**
 * Monta um campo no formato ID-Tamanho-Valor.
 * @param id O identificador do campo (ex: "00").
 * @param value O valor do campo (ex: "01").
 * @returns A string formatada (ex: "000201").
 */
const formatField = (id: string, value: string): string => {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
};

/**
 * Gera o payload completo do Pix "Copia e Cola" manualmente.
 */
const generateManualPix = (
  pixKey: string,
  amount: number,
  merchantName: string,
  merchantCity: string,
  txid: string,
): string => {
  // Limpa e formata os nomes e a cidade para o padrão Pix
  const formattedName = merchantName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .substring(0, 25).trim();

  const formattedCity = merchantCity
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .substring(0, 15).trim();

  // Garante que o TXID seja alfanumérico e com o limite de 25 caracteres
  const formattedTxid = txid.replace(/[^a-zA-Z0-9]/g, "").substring(0, 25);

  // Monta os campos principais
  const payloadFormat = formatField("00", "01");
  const merchantAccount = formatField(
    "26",
    formatField("00", "BR.GOV.BCB.PIX") + formatField("01", pixKey),
  );
  const merchantCategory = formatField("52", "0000");
  const transactionCurrency = formatField("53", "986"); // BRL
  const transactionAmount = formatField("54", amount.toFixed(2));
  const countryCode = formatField("58", "BR");
  const merchantNameField = formatField("59", formattedName);
  const merchantCityField = formatField("60", formattedCity);
  
  // Monta o campo de dados adicionais (TXID)
  const additionalData = formatField(
    "62",
    formatField("05", formattedTxid),
  );

  // Concatena todos os campos para o cálculo do CRC
  const payloadWithoutCrc =
    `${payloadFormat}${merchantAccount}${merchantCategory}` +
    `${transactionCurrency}${transactionAmount}${countryCode}` +
    `${merchantNameField}${merchantCityField}${additionalData}` +
    "6304"; // ID e Tamanho do CRC

  // Calcula o CRC e gera o payload final
  const crc = crc16ccitt(payloadWithoutCrc);
  return `${payloadWithoutCrc}${crc}`;
};

// --- FIM DA SOLUÇÃO DEFINITIVA ---

const corsHandler = cors({origin: true});

admin.initializeApp();

interface GeneratePixData {
  salonId: string;
  amount: number;
  reference?: string;
}

export const generatePix = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    const data = request.body.data as GeneratePixData;
    functions.logger.info("Iniciando geração de PIX com os dados:", data);

    if (!data || !data.salonId || !data.amount || data.amount <= 0) {
      return response.status(400).send({error: "Dados inválidos."});
    }

    try {
      const salonRef = admin.firestore().collection("salons").doc(data.salonId);
      const salonDoc = await salonRef.get();
      const salonData = salonDoc.data();

      if (
        !salonDoc.exists || !salonData || !salonData.pixKey ||
        !salonData.name || !salonData.pixCity
      ) {
        return response.status(404).send({
          error: "Configurações de Pix do salão estão incompletas.",
        });
      }

      const pixCode = generateManualPix(
        salonData.pixKey,
        data.amount,
        salonData.name, // Nome do beneficiário (salão)
        salonData.pixCity, // Cidade do beneficiário
        data.reference || `hairflow${Date.now()}`, // TXID
      );
      
      return response.status(200).send({data: {pixCode}});
    } catch (error: any) {
      functions.logger.error("Erro CRÍTICO ao gerar PIX:", error);
      return response.status(500).send({
        error: `Não foi possível gerar o código Pix: ${error.message}`,
      });
    }
  });
});

export const createAbacatePayBilling = functions.https.onCall(async (data: any) => {
    // Agora recebemos também o 'paymentMethod'
    const { salonId, serviceId, customerInfo, paymentMethod } = data;

    if (!salonId || !serviceId || !customerInfo || !paymentMethod) {
        throw new functions.https.HttpsError("invalid-argument", "Dados da cobrança incompletos.");
    }

    // Validação simples do método de pagamento
    const supportedMethods = ["PIX", "CREDIT_CARD"];
    if (!supportedMethods.includes(paymentMethod)) {
        throw new functions.https.HttpsError("invalid-argument", `Método de pagamento '${paymentMethod}' não suportado.`);
    }

    try {
        const salonDoc = await admin.firestore().collection("salons").doc(salonId).get();
        if (!salonDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Salão não encontrado.");
        }
        
        const salonData = salonDoc.data();
        if (!salonData?.abacatepayApiKey) {
            throw new functions.https.HttpsError("not-found", "Chave da API AbacatePay não configurada para este salão.");
        }

        const serviceDoc = await admin.firestore()
            .collection("salons").doc(salonId)
            .collection("services").doc(serviceId)
            .get();

        if (!serviceDoc.exists) {
            throw new functions.https.HttpsError("not-found", "O serviço selecionado não foi encontrado.");
        }
        const serviceData = serviceDoc.data();
        if (!serviceData || !serviceData.price || !serviceData.name) {
             throw new functions.https.HttpsError("internal", "Os dados do serviço estão incompletos.");
        }

        const apiKey = salonData.abacatepayApiKey;
        
        // Payload dinâmico para a API
        const payload: any = {
            amount: serviceData.price * 100,
            description: `Agendamento: ${serviceData.name}`,
            customer: customerInfo,
            methods: [paymentMethod], // Usa o método de pagamento recebido
        };

        // Adiciona a URL de retorno se for cartão de crédito
        if (paymentMethod === 'CREDIT_CARD') {
            // IMPORTANTE: Substitua 'seusite.com' pelo domínio real da sua aplicação.
            // Esta é a página para onde o usuário será redirecionado após o pagamento.
            payload.returnUrl = `https://seusite.com/agendar/${salonData.slug}?status=success`;
        }

        const abacatePayResponse = await axios.post(
            "https://api.abacatepay.com/v1/billing/create",
            payload,
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return abacatePayResponse.data;

    } catch (error: any) {
        functions.logger.error("Erro ao criar cobrança AbacatePay:", error);
        if (axios.isAxiosError(error) && error.response) {
            throw new functions.https.HttpsError("internal", `Erro da API AbacatePay: ${error.response.statusText}`, error.response.data);
        }
        throw new functions.https.HttpsError("internal", "Não foi possível criar a cobrança.");
    }
});