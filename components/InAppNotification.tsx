import React, { useEffect } from 'react';
import { X, Bell } from 'lucide-react';

interface InAppNotificationProps {
  title: string;
  body: string;
  onClose: () => void;
  duration?: number;
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({ title, body, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-slate-800 shadow-lg rounded-xl p-4 border border-slate-200 dark:border-slate-700 animate-in slide-in-from-right w-80 flex gap-3">
       <div className="flex-shrink-0 p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full h-10 w-10 flex items-center justify-center">
          <Bell size={20} />
       </div>
       <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h4>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={16} />
              </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
       </div>
    </div>
  );
};