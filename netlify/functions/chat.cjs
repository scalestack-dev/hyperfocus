const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
    // En-têtes pour autoriser l'accès depuis ton site (CORS)
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Gestion de la requête "preflight" (OPTIONS)
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "OK" };
    }

    // On n'accepte que les requêtes POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    try {
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

        // Vérification de la clé API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Variable GEMINI_API_KEY introuvable sur Netlify.");
        }

        // Initialisation de Google AI
        const genAI = new GoogleGenerativeAI(apiKey);

        // CORRECTION MAJEURE : Utilisation de "gemini-pro" (stable)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Configuration de la langue
        const languageMap = { fr: "French", en: "English", es: "Spanish", de: "German" };
        const targetLanguage = languageMap[langCode] || "English";

        // Démarrage du chat avec instructions
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `You are Kai, a friendly productivity coach. Answer in ${targetLanguage}. Be concise and encouraging.` }],
                },
                {
                    role: "model",
                    parts: [{ text: `Understood. I am Kai. I will answer in ${targetLanguage} and help you stay focused.` }],
                }
            ],
        });

        // Envoi du message
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: text }),
        };

    } catch (error) {
        console.error("ERREUR:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                // Message d'erreur détaillé pour le débogage
                error: `Erreur IA: ${error.message}`
            }),
        };
    }
};