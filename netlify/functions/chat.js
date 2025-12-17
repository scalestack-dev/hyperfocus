// netlify/functions/chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event) {
    // Sécurité : On accepte uniquement les messages POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const userMessage = body.message;
        const langCode = body.lang || 'en';

        // 1. Traduction du code langue pour l'IA (Ex: 'fr' -> 'French')
        const languageMap = {
            'fr': 'French',
            'en': 'English',
            'es': 'Spanish',
            'de': 'German'
        };
        const targetLanguage = languageMap[langCode] || 'English';

        // 2. Vérification de la clé API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "Clé API manquante" }) };
        }

        // 3. Initialisation de Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 4. Le "Cerveau" de Kai (System Prompt)
        // 4. Le "Cerveau" de Kai (Version Anti-Hallucination)
        const systemPrompt = `
      You are Kai, the AI productivity coach for Hyperfocus.
      
      CORE RULES:
      1. Be concise and precise. No fluff.
      2. If you don't know the answer, say "I don't know" or "I'm not sure" (in the target language). DO NOT invent facts.
      3. Focus only on productivity, organization, focus, and time management.
      4. If asked about unrelated topics (politics, celebrities...), politely refuse.
      
      CRITICAL INSTRUCTION: You must respond in ${targetLanguage}.
    `;


        // 5. Envoi à Google
        const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\nKai (${targetLanguage}):`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: text }),
        };

    } catch (error) {
        console.error("Erreur Backend:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erreur technique Kai" }),
        };
    }
};
