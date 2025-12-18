const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "OK" };
    }

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

        // 1. RÉCUPÉRATION ET NETTOYAGE DE LA CLÉ
        // On utilise .trim() pour supprimer les espaces accidentels au début ou à la fin
        const rawApiKey = process.env.GEMINI_API_KEY;
        if (!rawApiKey) {
            throw new Error("Variable GEMINI_API_KEY introuvable sur Netlify.");
        }
        const apiKey = rawApiKey.trim();

        // 2. INITIALISATION
        const genAI = new GoogleGenerativeAI(apiKey);

        // 3. CHOIX DU MODÈLE
        // On retourne sur "gemini-1.5-flash" qui est le standard actuel.
        // Si cela échoue encore avec 404, c'est que l'API n'est pas activée sur le compte Google Cloud.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const languageMap = { fr: "French", en: "English", es: "Spanish", de: "German" };
        const targetLanguage = languageMap[langCode] || "English";

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

        // Message d'aide personnalisé selon l'erreur
        let helpMsg = "";
        if (error.message.includes("404") || error.message.includes("not found")) {
            helpMsg = " (Vérifie que l'API 'Generative Language API' est bien activée dans ta console Google Cloud)";
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: `Erreur IA: ${error.message}${helpMsg}`
            }),
        };
    }
};