
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the AI client
// Using a lazy initialization pattern to allow app to start even if key is missing (handled in UI)
let aiClient: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

// Model Constants
const MODEL_TEXT_IMAGE = 'gemini-3-pro-preview'; // Powerful model for text, vision, and search grounding

interface AIResponse {
  text: string;
  groundingMetadata?: any;
}

/**
 * Sends a text message to Gemini, optionally with an image.
 * Enables Google Search grounding for up-to-date info.
 */
export const sendMessageToGemini = async (
  prompt: string,
  imageBase64?: string,
  mimeType: string = 'image/jpeg'
): Promise<AIResponse> => {
  try {
    const ai = getClient();
    
    let contents: any;

    if (imageBase64) {
      // Multimodal request
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      };
      const textPart = {
        text: prompt || "Analyze this image." // Ensure there is always a prompt
      };
      contents = { parts: [imagePart, textPart] };
    } else {
      // Text-only request
      contents = prompt;
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_TEXT_IMAGE,
      contents: contents,
      config: {
        // Enable Google Search Grounding for internet access and fact checking
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType and responseSchema are NOT allowed when using googleSearch
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No text response received from Gemini.");
    }

    return {
      text: text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message === "API_KEY_MISSING") {
        throw new Error("Missing API Key. Please configure API_KEY in your Netlify environment variables.");
    }
    throw error;
  }
};

/**
 * Helper to convert File to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the Data-URL prefix (e.g. "data:image/png;base64,") to get raw base64
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
