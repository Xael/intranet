import { GoogleGenAI, Type } from "@google/genai";
import { NcmSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNcmSuggestion = async (productDescription: string): Promise<NcmSuggestion> => {
  try {
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
    throw error;
  }
};