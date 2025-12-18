const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
    // Log pour prouver que la nouvelle version est active
    console.log("--- NOUVELLE VERSION ACTIVE (STANDARD) ---");

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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Erreur: GEMINI_API_KEY manquante");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Configuration serveur invalide (Clé API manquante)." })
            };
        }

        // On utilise le modèle standard, rapide et efficace
        // .trim() est crucial pour éviter les erreurs d'espace
        const genAI = new GoogleGenerativeAI(apiKey.trim());
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
        console.error("Erreur Gemini:", error);

        // Message d'erreur simplifié pour confirmer que c'est bien le nouveau code
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: "Erreur IA (Si ce message s'affiche, c'est le nouveau code). Vérifiez l'activation de l'API sur Google Cloud."
            }),
        };
    }
};