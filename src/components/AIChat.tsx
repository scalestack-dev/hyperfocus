
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, Bot, User, X, Globe, ExternalLink, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini, fileToBase64 } from '../services/geminiService';
import { useLanguage } from '../contexts_temp/LanguageContext';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const base64 = await fileToBase64(file);
      setImagePreview(`data:${file.type};base64,${base64}`);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      imageUrl: imagePreview || undefined,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let imageBase64: string | undefined;

      if (selectedImage) {
        imageBase64 = await fileToBase64(selectedImage);
      }

      // Clear image selection after sending to UI
      clearImage();

      const response = await sendMessageToGemini(userMsg.text, imageBase64, selectedImage?.type);

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: response.text,
        groundingMetadata: response.groundingMetadata,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMessage = t('error_ai');

      // Provide more specific error if it's a configuration issue
      if (error.message && (error.message.includes("API Key") || error.message.includes("API_KEY"))) {
        errorMessage = "Configuration Error: API Key is missing or invalid. Please check your settings.";
      }

      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: errorMessage,
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
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <Bot size={48} className="mb-4 text-indigo-500" />
            <p className="text-lg font-medium">{t('how_can_i_help')}</p>
            <p className="text-sm">{t('ai_intro')}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' :
                  msg.text.includes("Error") ? 'bg-red-500' : 'bg-emerald-600'
                }`}
            >
              {msg.role === 'user' ? <User size={16} className="text-white" /> : (
                msg.text.includes("Error") ? <AlertTriangle size={16} className="text-white" /> : <Bot size={16} className="text-white" />
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                  ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-900 dark:text-indigo-100 rounded-tr-sm'
                  : msg.text.includes("Error")
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-sm'
                }`}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="User upload"
                  className="max-w-full rounded-lg mb-3 border border-slate-200 dark:border-white/10"
                />
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {msg.text}
              </div>

              {/* Grounding Sources (Citations) */}
              {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <Globe size={12} /> Sources
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingMetadata.groundingChunks.map((chunk: any, index: number) => {
                      if (chunk.web) {
                        return (
                          <a
                            key={index}
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded transition-colors max-w-full truncate"
                            title={chunk.web.title}
                          >
                            <span className="truncate max-w-[150px]">{chunk.web.title}</span>
                            <ExternalLink size={10} className="flex-shrink-0 opacity-50" />
                          </a>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
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

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 transition-colors">

        {/* Image Preview Overlay */}
        {imagePreview && (
          <div className="mb-2 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-300 dark:border-slate-600" />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-slate-200 dark:bg-slate-700 rounded-full p-1 hover:bg-red-500 transition-colors text-slate-600 dark:text-white border border-slate-300 dark:border-slate-500 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Upload Image"
          >
            <ImageIcon size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ask_placeholder')}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 resize-none h-12 max-h-32 scrollbar-hide"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2">
          {t('powered_by')}
        </p>
      </div>
    </div>
  );
};
