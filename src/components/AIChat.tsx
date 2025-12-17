import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts_temp/LanguageContext';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const ASSISTANT_NAME = 'Kai';

export const AIChat = () => {
  const { t, language } = useLanguage();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Message d'accueil dans la bonne langue
  useEffect(() => {
    const welcomeMessages: Record<string, string> = {
      en: `Hello, I'm ${ASSISTANT_NAME}! Ready to help you stay hyper-focused.`,
      fr: `Bonjour, je suis ${ASSISTANT_NAME} ! Prêt à vous aider à rester concentré.`,
      es: `¡Hola, soy ${ASSISTANT_NAME}! Listo para ayudarte a mantener el enfoque.`,
      de: `Hallo, ich bin ${ASSISTANT_NAME}! Bereit, Ihnen zu helfen, fokussiert zu bleiben.`,
    };

    setMessages([
      {
        role: 'model',
        text: welcomeMessages[language] || welcomeMessages.en,
        timestamp: Date.now(),
      },
    ]);
  }, [language]);

  // Scroll auto en bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    setMessages(prev => [
      ...prev,
      { role: 'user', text: userText, timestamp: Date.now() },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          lang: language,
        }),
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { role: 'model', text: data.reply, timestamp: Date.now() },
      ]);
    } catch (error) {
      const errorMessages: Record<string, string> = {
        en: "I'm having trouble connecting right now. Please try again.",
        fr: "J'ai un souci de connexion. Réessayez s'il vous plaît.",
        es: 'Estoy teniendo problemas de conexión. Inténtalo de nuevo.',
        de: 'Ich habe Verbindungsprobleme. Bitte versuchen Sie es erneut.',
      };
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: errorMessages[language] || errorMessages.en,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Zone des messages */}
      <div className="flex-1 overflow-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''
              }`}
          >
            <div
              className={`p-2 rounded-full ${m.role === 'model' ? 'bg-blue-100' : 'bg-gray-200'
                }`}
            >
              {m.role === 'model' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div
              className={`p-3 rounded-lg max-w-[80%] ${m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-black'
                }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <Loader2 className="animate-spin mx-auto text-indigo-500" />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded-full text-black"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={t('ai_assistant') ? `${t('ai_assistant')}...` : 'Ask Kai...'}
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white p-2 rounded-full"
          disabled={!input.trim() || isLoading}
        >
          <Send />
        </button>
      </div>
    </div>
  );
};
