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

        // 1. RÉCUPÉRATION DE LA CLÉ
        const rawApiKey = process.env.GEMINI_API_KEY;
        if (!rawApiKey) {
            throw new Error("Variable GEMINI_API_KEY introuvable sur Netlify.");
        }
        const apiKey = rawApiKey.trim();

        const genAI = new GoogleGenerativeAI(apiKey);
        const languageMap = { fr: "French", en: "English", es: "Spanish", de: "German" };
        const targetLanguage = languageMap[langCode] || "English";

        // 2. STRATÉGIE MULTI-MODÈLES
        // On essaie ces modèles dans l'ordre. Si le premier échoue (404), on tente le suivant.
        const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
        let lastError = null;
        let successResponse = null;

        console.log("Début de la tentative de contact avec l'IA...");

        for (const modelName of modelsToTry) {
            try {
                console.log(`Essai avec le modèle : ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

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
                successResponse = response.text();

                // Si on arrive ici, c'est gagné !
                console.log(`Succès avec ${modelName} !`);
                break;

            } catch (error) {
                console.warn(`Échec avec ${modelName}:`, error.message);
                lastError = error;
                // On continue la boucle pour essayer le modèle suivant
            }
        }

        // 3. RÉSULTAT FINAL
        if (successResponse) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ reply: successResponse }),
            };
        }

        // Si on est là, c'est que TOUS les modèles ont échoué
        throw lastError;

    } catch (error) {
        console.error("ERREUR CRITIQUE:", error);

        // Ce message différent nous prouvera que le nouveau code est bien en ligne
        let helpMsg = "";
        if (error.message.includes("404") || error.message.includes("not found")) {
            helpMsg = " (L'API 'Generative Language API' n'est pas activée sur ton compte Google Cloud).";
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: `Tous les modèles ont échoué. Dernière erreur : ${error.message}${helpMsg}`
            }),
        };
    }
};
