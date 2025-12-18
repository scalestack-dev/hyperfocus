// Service pour communiquer avec la fonction Serverless Netlify
export const sendMessageToGemini = async (message: string, language: string) => {
  try {
    // L'URL relative '/.netlify/functions/chat' fonctionne automatiquement 
    // sur le même domaine (ex: ton-app.netlify.app)
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        lang: language
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return { text: data.reply };

  } catch (error) {
    console.error("Erreur service Gemini:", error);
    throw error;
  }
};
