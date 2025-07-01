import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import cors from "cors";

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

// const corsHandler = cors({origin: true}); // Removido para evitar redeclaração

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


// (Removido: interface CreateBillingData não utilizada)

// --- FIM DA CORREÇÃO ---

// Garante que o corsHandler seja inicializado
const corsHandler = cors({ origin: true });

// Inicializa o app do Firebase apenas uma vez
if (admin.apps.length === 0) {
  admin.initializeApp();
}



// Substitua TODA a sua função createAbacatePayBilling por esta versão corrigida.

export const createAbacatePayBilling = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
      // Valida o método da requisição
      if (request.method !== "POST") {
          functions.logger.warn("Método não permitido recebido:", request.method);
          return response.status(405).send({ error: "Método não permitido." });
      }

      try {
          // O frontend enviará um payload mais simples e seguro
          const { salonId, serviceId, customer, paymentMethod } = request.body;
          functions.logger.info("Request Body Recebido:", request.body);

          // Validação de dados essenciais
          if (!salonId || !serviceId || !customer?.name || !customer.email || !customer.phone || !customer.taxId || !paymentMethod) {
              functions.logger.error("Erro de validação: Dados da cobrança incompletos.", request.body);
              return response.status(400).send({ error: "Dados da cobrança incompletos. Verifique salão, serviço, cliente, CPF/CNPJ e método de pagamento." });
          }

          // Busca dados do salão e do serviço em paralelo para otimizar
          const [salonDoc, serviceDoc] = await Promise.all([
              admin.firestore().collection("salons").doc(salonId).get(),
              admin.firestore().collection("salons").doc(salonId).collection("services").doc(serviceId).get()
          ]);

          const salonData = salonDoc.data();
          if (!salonDoc.exists || !salonData?.abacatepayApiKey || !salonData?.slug) {
              functions.logger.error(`Configurações inválidas para o salão: ${salonId}`);
              return response.status(404).send({ error: "A chave da API AbacatePay não está configurada ou o salão não foi encontrado." });
          }
          
          const serviceData = serviceDoc.data();
          if (!serviceDoc.exists || !serviceData?.price || !serviceData?.name) {
              functions.logger.error(`Serviço não encontrado: ${serviceId} no salão ${salonId}`);
              return response.status(404).send({ error: "O serviço selecionado não foi encontrado." });
          }
          
          // --- CORREÇÃO PRINCIPAL: PAYLOAD CONFORME A DOCUMENTAÇÃO DA ABACATEPAY ---
          const abacatePayPayload = {
              frequency: "ONE_TIME",
              methods: [paymentMethod], // Ex: ["PIX"] ou ["CREDIT_CARD"]
              products: [
                {
                  externalId: `svc-${serviceId}-${Date.now()}`,
                  name: serviceData.name,
                  description: `Agendamento para o serviço: ${serviceData.name}`,
                  quantity: 1,
                  price: serviceData.price * 100, // PREÇO EM CENTAVOS!
                }
              ],
              // ATENÇÃO: Use o seu domínio real aqui
              returnUrl: `https://hairflow-lmlxh.web.app/agendar/${salonData.slug}?status=cancelled`,
              completionUrl: `https://hairflow-lmlxh.web.app/agendar/${salonData.slug}?status=success`,
              customer: {
                name: customer.name,
                email: customer.email,
                cellphone: customer.phone.replace(/\D/g, ''),
                taxId: customer.taxId.replace(/\D/g, '') // <-- ADICIONADO E LIMPO
              },
              allowCoupons: false,
              coupons: []
          };

          functions.logger.info("Enviando Payload para AbacatePay:", JSON.stringify(abacatePayPayload, null, 2));

          const abacatePayResponse = await axios.post(
            "https://api.abacatepay.com/v1/billing/create", // <--- CORRIGIDO
            abacatePayPayload,
            { 
                headers: { 
                    "Authorization": `Bearer ${salonData.abacatepayApiKey}`,
                    "Content-Type": "application/json"
                } 
            }
        );

          // --- CORREÇÃO NA RESPOSTA: Retorna a resposta da API DIRETAMENTE ---
          // Não envolva em um objeto { data: ... }
          functions.logger.info("Resposta da AbacatePay recebida com sucesso.");
          return response.status(200).send(abacatePayResponse.data);

      } catch (error: any) {
          functions.logger.error("ERRO CRÍTICO AO CHAMAR ABACATEPAY:", {
              message: error.message,
              status: error.response?.status,
              responseData: error.response?.data 
          });

          if (axios.isAxiosError(error) && error.response) {
              // Envia os detalhes do erro da AbacatePay para o frontend
              return response.status(error.response.status).send({ 
                  error: `Erro da API AbacatePay: ${error.response.data?.message || error.response.statusText}`,
                  details: error.response.data 
              });
          }
          
          return response.status(500).send({ error: "Erro interno no servidor ao processar pagamento." });
      }
  });
});