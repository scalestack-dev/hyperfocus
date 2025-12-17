import React, { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export const AIChat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string, text: string }>>([
    { role: 'model', text: "Bonjour ! Je suis prêt à vous aider." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput(''); // On vide le champ
    // On affiche le message de l'utilisateur tout de suite
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // C'EST ICI LA MAGIE : On appelle notre "tunnel" (chat.js)
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();

      // On affiche la réponse de l'IA
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Oups, erreur de connexion." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Zone des messages */}
      <div className="flex-1 overflow-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-full ${m.role === 'model' ? 'bg-blue-100' : 'bg-gray-200'}`}>
              {m.role === 'model' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className={`p-3 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-black'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && <Loader2 className="animate-spin mx-auto text-indigo-500" />}
      </div>

      {/* Zone de saisie */}
      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded-full text-black"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Écrivez votre message..."
        />
        <button onClick={sendMessage} className="bg-indigo-600 text-white p-2 rounded-full">
          <Send />
        </button>
      </div>
    </div>
  );
};
