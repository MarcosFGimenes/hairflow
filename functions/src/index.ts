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

// --- INÍCIO DA CORREÇÃO ---

// 1. Defina interfaces para dar "forma" aos seus dados. Isso resolve os erros do TypeScript.
interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
}

interface CreateBillingData {
    salonId: string;
    serviceId: string;
    customerInfo: CustomerInfo;
    paymentMethod: "PIX" | "CREDIT_CARD";
}

// --- FIM DA CORREÇÃO ---

export const createAbacatePayBilling = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        // ADICIONADO: Log para depuração. Veremos isso nos logs do Firebase.
        functions.logger.info("Request recebido:", {
            method: request.method,
            body: request.body,
        });

        if (request.method !== "POST") {
            return response.status(405).send("Método não permitido. Use POST.");
        }

        try {
            // Agora pegamos o corpo da requisição diretamente.
            const data = request.body as CreateBillingData;
            const { salonId, serviceId, customerInfo, paymentMethod } = data;

            if (!salonId || !serviceId || !customerInfo || !paymentMethod) {
                // ALTERADO: Enviando erro como texto simples
                return response.status(400).send("Dados da cobrança incompletos. Verifique o payload enviado.");
            }

            const salonDoc = await admin.firestore().collection("salons").doc(salonId).get();
            const salonData = salonDoc.data();
            if (!salonDoc.exists || !salonData?.abacatepayApiKey) {
                return response.status(404).send("A chave da API AbacatePay não está configurada para este salão.");
            }

            const serviceDoc = await admin.firestore().collection("salons").doc(salonId).collection("services").doc(serviceId).get();
            const serviceData = serviceDoc.data();
            if (!serviceDoc.exists || !serviceData?.price || !serviceData?.name) {
                return response.status(404).send("O serviço selecionado não foi encontrado ou está com dados incompletos.");
            }

            const apiKey = salonData.abacatepayApiKey;
            const payload = {
                amount: serviceData.price * 100,
                description: `Agendamento: ${serviceData.name}`,
                customer: customerInfo,
                methods: [paymentMethod],
                returnUrl: paymentMethod === 'CREDIT_CARD' ? `https://seusite.com/agendar/${salonData.slug}?status=success` : undefined,
            };

            const abacatePayResponse = await axios.post("https://api.abacatepay.com/v1/billing/create", payload, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            });

            return response.status(200).send({ data: abacatePayResponse.data });

        } catch (error: any) {
            functions.logger.error("Erro CRÍTICO ao criar cobrança AbacatePay:", error);
            if (axios.isAxiosError(error) && error.response) {
                return response.status(error.response.status).send(`Erro da API AbacatePay: ${error.response.statusText}`);
            }
            return response.status(500).send("Erro interno ao processar a cobrança.");
        }
    });
});