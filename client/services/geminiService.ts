import { GoogleGenAI, Type } from "@google/genai";
import { NcmSuggestion } from "../types";

// REMOVIDO DAQUI: A inicialização global travava o app se a chave faltasse.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNcmSuggestion = async (productDescription: string): Promise<NcmSuggestion> => {
  // 1. Tenta pegar a chave apenas no momento que o usuário pede a sugestão
  const apiKey = process.env.API_KEY;

  // 2. Proteção: Se não tiver chave (por causa do Dockerignore), retorna vazio sem quebrar o site
  if (!apiKey) {
    console.warn("AVISO: API Key do Gemini não encontrada. O recurso de sugestão de NCM está desativado.");
    return {
      ncm: "",
      descricao: productDescription, // Retorna a própria descrição digitada
      cfop: ""
    };
  }

  try {
    // 3. Inicializa a IA somente agora que sabemos que a chave existe
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest the most appropriate NCM (Nomenclatura Comum do Mercosul) code and a standard description for a product described as: "${productDescription}". Also suggest a common CFOP code for sales inside the state (Saída dentro do estado). Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ncm: { type: Type.STRING, description: "The 8-digit NCM code" },
            descricao: { type: Type.STRING, description: "Standardized technical description" },
            cfop: { type: Type.STRING, description: "Suggest CFOP (e.g., 5102)" }
          },
          required: ["ncm", "descricao", "cfop"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as NcmSuggestion;
  } catch (error) {
    console.error("Error fetching NCM suggestion:", error);
    // Em caso de erro na IA, retorna vazio para não travar o formulário do usuário
    return {
        ncm: "",
        descricao: productDescription,
        cfop: ""
    };
  }
};
