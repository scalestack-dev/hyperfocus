
import React from 'react';
import { LayoutDashboard, Inbox, Calendar, Archive, Sun, BrainCircuit, Activity, Settings, Kanban, Grid, Plus, Folder, Briefcase, Home, Code, Book, Rocket, Star, Zap, Globe, Cpu, Edit2, BarChart3, Download, Hash } from 'lucide-react';
import { ViewMode, Task, Project, Tag } from '../types';
import { useLanguage } from '../contexts_temp/LanguageContext';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode, projectId?: string) => void;
  activeTask: Task | null;
  projects: Project[];
  activeProjectId: string | null;
  onAddProject: () => void;
  onEditProject: (projectId: string) => void;
  onInstall?: () => void;
  showInstall?: boolean;
  tags: Tag[];
  onSelectTag: (tag: string) => void;
  onAddTag: () => void;
  onEditTag: (tagId: string) => void;
}

const ICONS: Record<string, any> = {
  Folder, Briefcase, Home, Code, Book, Rocket, Star, Zap, Globe, Cpu
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  activeTask,
  projects,
  activeProjectId,
  onAddProject,
  onEditProject,
  onInstall,
  showInstall,
  tags,
  onSelectTag,
  onAddTag,
  onEditTag
}) => {
  const { t } = useLanguage();

  const NavItem = ({ mode, icon: Icon, label, colorClass, onClick, active }: { mode?: ViewMode, icon: any, label: string, colorClass?: string, onClick?: () => void, active?: boolean }) => {
    const isActive = active !== undefined ? active : currentView === mode;
    return (
      <button
        onClick={onClick || (() => mode && onViewChange(mode))}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors group relative ${isActive
            ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border-r-2 border-indigo-500'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
      >
        <Icon size={20} className={isActive ? '' : colorClass} />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-500 dark:text-indigo-400">
          <Activity />
          <span>HyperFocus</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{t('supercharged')}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <div className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {t('tasks')}
        </div>
        <NavItem mode="inbox" icon={Inbox} label={t('inbox')} colorClass="text-blue-500" />
        <NavItem mode="today" icon={Sun} label={t('today')} colorClass="text-amber-500" />
        <NavItem mode="scheduled" icon={Calendar} label={t('scheduled')} colorClass="text-violet-500" />

        {/* Projects Section */}
        <div className="mt-6 px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center group">
          {t('projects')}
          <button
            onClick={onAddProject}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title={t('add_project')}
          >
            <Plus size={14} />
          </button>
        </div>

        {projects.length === 0 && (
          <div className="px-4 py-2 text-xs text-slate-400 italic">
            {t('no_projects')}
          </div>
        )}

        {projects.map(project => {
          const IconComponent = ICONS[project.icon] || Folder;
          const isActive = currentView === 'project' && activeProjectId === project.id;

          return (
            <div key={project.id} className="relative group">
              <button
                onClick={() => onViewChange('project', project.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border-r-2 border-indigo-500'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <IconComponent size={18} style={{ color: isActive ? undefined : project.color }} className={isActive ? 'text-indigo-600 dark:text-indigo-300' : ''} />
                <span className="truncate flex-1 text-left">{project.title}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onEditProject(project.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 size={12} />
              </button>
            </div>
          );
        })}

        {/* Tags Section */}
        <div className="mt-6 px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center group">
          {t('tags')}
          <button
            onClick={onAddTag}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add Tag"
          >
            <Plus size={14} />
          </button>
        </div>
        {tags.length === 0 && (
          <div className="px-4 py-2 text-xs text-slate-400 italic">
            No tags found.
          </div>
        )}
        {tags.map(tag => (
          <div key={tag.id} className="relative group">
            <button
              onClick={() => onSelectTag(tag.name)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <Hash size={18} style={{ color: tag.color }} />
              <span className="truncate flex-1 text-left">{tag.name}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEditTag(tag.id); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 size={12} />
            </button>
          </div>
        ))}

        <div className="mt-6 px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Views
        </div>
        <NavItem mode="kanban" icon={Kanban} label={t('kanban')} colorClass="text-orange-500" />
        <NavItem mode="eisenhower" icon={Grid} label={t('eisenhower')} colorClass="text-cyan-500" />
        <NavItem mode="reports" icon={BarChart3} label={t('reports')} colorClass="text-pink-500" />

        <div className="mt-6 px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {t('tools')}
        </div>
        <NavItem mode="focus" icon={LayoutDashboard} label={t('focus_mode')} />
        <NavItem mode="ai" icon={BrainCircuit} label={t('ai_assistant')} />
        <NavItem mode="archives" icon={Archive} label={t('archives')} colorClass="text-emerald-500" />
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
        {showInstall && (
          <NavItem
            icon={Download}
            label={t('install_app')}
            onClick={onInstall}
            active={false}
          />
        )}
        <NavItem mode="settings" icon={Settings} label={t('settings_sync')} />

        {/* Active Task Mini-Status */}
        {activeTask && (
          <div className="p-3 border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-slate-900/50 rounded-lg">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">{t('active_now')}</p>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{activeTask.title}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-500 dark:text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              {t('tracking_time')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
