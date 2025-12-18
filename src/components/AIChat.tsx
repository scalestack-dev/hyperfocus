import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';
// Import du nouveau service API (assure-toi d'avoir créé le fichier dans src/services/)
import { sendMessageToGemini } from '../services_temp/geminiService';
// Ton import conservé tel quel :
import { useLanguage } from '../contexts_temp/LanguageContext';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { t, language } = useLanguage();

  // --- Dictionnaire de traduction local pour les phrases fixes ---
  const chatText: Record<string, { subWelcome: string; footer: string }> = {
    fr: {
      subWelcome: "Je suis Kai, ton coach Hyperfocus.",
      footer: "Kai est prêt à booster ta journée."
    },
    en: {
      subWelcome: "I am Kai, your Hyperfocus coach.",
      footer: "Kai is ready to boost your day."
    },
    de: {
      subWelcome: "Ich bin Kai, dein Hyperfocus-Coach.",
      footer: "Kai ist bereit, deinen Tag zu verbessern."
    },
    es: {
      subWelcome: "Soy Kai, tu entrenador de Hyperfocus.",
      footer: "Kai está listo para impulsar tu día."
    }
  };

  // Sélection de la langue (fallback sur 'en' si non trouvée)
  const currentLang = (language && chatText[language]) ? language : 'en';
  const texts = chatText[currentLang];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Appel au service connecté à Netlify
      const response = await sendMessageToGemini(currentInput, language);

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: error.message || t('error_ai') || "Désolé, je rencontre un problème de connexion.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 max-w-4xl mx-auto border-x border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <Bot size={48} className="mb-4 text-indigo-500" />
            <p className="text-lg font-medium">{t('how_can_i_help') || "Comment puis-je t'aider ?"}</p>
            <p className="text-sm">{texts.subWelcome}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}
            >
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-900 dark:text-indigo-100 rounded-tr-sm'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700'
                }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4 text-slate-500 dark:text-slate-400 shadow-sm">
              <Loader2 className="animate-spin" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ask_placeholder') || "Pose ta question..."}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 resize-none h-12 max-h-32 scrollbar-hide"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2">
          {texts.footer}
        </p>
      </div>
    </div>
  );
};