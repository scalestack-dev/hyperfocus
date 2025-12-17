
import React, { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Tag } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TagModalProps {
  tag?: Tag | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: Tag) => void;
  onDelete: (tagId: string) => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#64748b'
];

export const TagModal: React.FC<TagModalProps> = ({ tag, isOpen, onClose, onSave, onDelete }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
    } else {
      setName('');
      setColor('#6366f1');
    }
  }, [tag, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: tag?.id || crypto.randomUUID(),
      name: name.trim(),
      color
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TagIcon size={18} />
            {tag ? t('edit_tag') || 'Edit Tag' : t('add_tag') || 'Add Tag'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('title')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag Name"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('project_color') || 'Color'}</label>
            <div className="flex items-center gap-3 mb-3">
               <input 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
               />
               <span className="text-sm font-mono text-slate-500">{color}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {tag && (
              <button
                type="button"
                onClick={() => {
                   if (window.confirm('Delete this tag?')) {
                     onDelete(tag.id);
                   }
                }}
                className="px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-semibold transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-slate-500 hover:text-slate-700 font-semibold transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {tag ? t('save_project') : t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
