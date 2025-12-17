// netlify/functions/chat.js
// On charge l'outil pour parler à Google
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event) {
    try {
        // 1. On récupère le message que l'utilisateur a tapé
        const body = JSON.parse(event.body);
        const userMessage = body.message;

        // 2. On récupère la clé secrète (que Netlify garde pour nous)
        const apiKey = process.env.GEMINI_API_KEY;

        // 3. On initialise l'IA avec la clé
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 4. On envoie la question à Google et on attend la réponse
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();

        // 5. On renvoie la réponse à notre site web
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: text }),
        };
    } catch (error) {
        // En cas de pépin
        return { statusCode: 500, body: JSON.stringify({ error: "Erreur IA" }) };
    }
};
