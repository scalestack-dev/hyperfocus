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

        // Vérification explicite de la clé pour le débug
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Variable GEMINI_API_KEY introuvable sur Netlify.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const languageMap = { fr: "French", en: "English", es: "Spanish", de: "German" };
        const targetLanguage = languageMap[langCode] || "English";

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `You are Kai. Answer in ${targetLanguage}. Be concise.` }],
                },
                {
                    role: "model",
                    parts: [{ text: `Understood. I will answer in ${targetLanguage}.` }],
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
        console.error("ERREUR CRITIQUE:", error);
        // ICI : On renvoie le vrai message d'erreur au lieu d'un texte générique
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: `DEBUG INFO: ${error.message}`
            }),
        };
    }
};
