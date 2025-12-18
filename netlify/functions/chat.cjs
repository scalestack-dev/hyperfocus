const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
    // 1. Gestion des Headers CORS pour éviter les blocages navigateurs
    const headers = {
        "Access-Control-Allow-Origin": "*", // Autorise ton domaine
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // 2. Répondre immédiatement aux requêtes "preflight" (OPTIONS)
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "OK" };
    }

    // 3. Vérifier que c'est bien du POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    try {
        // Parsing sécurisé du corps de la requête
        const body = JSON.parse(event.body || "{}");
        const userMessage = body.message;
        const langCode = body.lang || "en";

        if (!userMessage) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Le message est vide." })
            };
        }

        const languageMap = {
            fr: "French",
            en: "English",
            es: "Spanish",
            de: "German",
        };
        const targetLanguage = languageMap[langCode] || "English";

        // Vérification de la clé API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Erreur: GEMINI_API_KEY manquante dans les variables d'environnement Netlify");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Configuration serveur invalide." }),
            };
        }

        // Initialisation de Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        // Utilisation de gemini-1.5-flash : plus rapide et moins cher pour du chat, 
        // ou gemini-pro si tu préfères.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
        You are Kai, the AI productivity coach for Hyperfocus.
        
        CORE RULES:
        1. Be concise, energetic and motivating.
        2. Focus strictly on productivity, organization, and focus.
        3. If unsure, admit it. Do not hallucinate.
        
        CONTEXT: The user is speaking in ${targetLanguage}. You MUST answer in ${targetLanguage}.
        `;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: `Understood. I am Kai. I will answer in ${targetLanguage}.` }],
                }
            ],
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: text }),
        };

    } catch (error) {
        console.error("Erreur Backend détaillée:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Erreur lors de la communication avec l'IA." }),
        };
    }
};