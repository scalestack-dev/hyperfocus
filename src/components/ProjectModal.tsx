import React, { useState, useEffect } from 'react';
import { X, Folder, Briefcase, Home, Code, Book, Rocket, Star, Zap, Globe, Cpu } from 'lucide-react';
import { Project } from '../types';
import { useLanguage } from '../contexts_temp/LanguageContext';

interface ProjectModalProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#64748b', // slate-500
];

const ICONS = {
  Folder, Briefcase, Home, Code, Book, Rocket, Star, Zap, Globe, Cpu
};

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose, onSave, onDelete }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[6]); // Default indigo
  const [icon, setIcon] = useState('Folder');

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setColor(project.color);
      setIcon(project.icon);
    } else {
      // Reset for new project
      setTitle('');
      setColor(COLORS[6]);
      setIcon('Folder');
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const savedProject: Project = {
      id: project?.id || crypto.randomUUID(),
      title: title.trim(),
      color,
      icon,
      createdAt: project?.createdAt || Date.now(),
    };
    onSave(savedProject);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {project ? t('edit_project') : t('add_project')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('project_name')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('project_name')}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-white"
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('project_color')}</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-slate-600 dark:border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('project_icon')}</label>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(ICONS).map(([name, IconComponent]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${icon === name
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                  <IconComponent size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {project && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this project?')) {
                    onDelete(project.id);
                  }
                }}
                className="px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-semibold transition-colors"
              >
                {t('delete_project')}
              </button>
            )}
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-500 hover:text-slate-700 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {project ? t('save_project') : t('create_project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
