
import React, { useState, useMemo } from 'react';
import { Trash2, Play, Pause, Circle, CheckCircle, Calendar, Edit2, ListChecks, Inbox, Archive, Sun, Bell, Repeat, Folder, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, ViewMode, Project } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { TaskCreator } from './TaskCreator';

interface TaskListProps {
  tasks: Task[];
  projects?: Project[];
  onAdd: (tasks: Partial<Task>[]) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPlay: (id: string | null) => void;
  onEdit: (id: string) => void;
  onArchive?: (id: string) => void; 
  onArchiveCompleted?: () => void;
  activeTaskId: string | null;
  viewMode: ViewMode;
  currentProject?: Project | null;
  defaultDate?: Date | null;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, projects = [], onAdd, onToggle, onDelete, onPlay, onEdit, onArchive, onArchiveCompleted, activeTaskId, viewMode, currentProject, defaultDate }) => {
  const { t, language } = useLanguage();

  const handleTaskToggle = (task: Task) => {
    if (!task.isCompleted) {
      // Dynamic congratulations: "Realistic" burst effect
      const count = 200;
      const defaults = {
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        shapes: ['circle', 'square'],
        disableForReducedMotion: true,
      };

      const fire = (particleRatio: number, opts: any) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
    onToggle(task.id);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const isOverdue = (deadline?: number) => {
    if (!deadline) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    return deadline < startOfToday.getTime();
  };

  const getHeaderInfo = () => {
    switch (viewMode) {
      case 'inbox':
        return { title: t('inbox'), subtitle: t('inbox_subtitle'), icon: <Inbox className="text-blue-500" size={28} /> };
      case 'today':
        return { title: t('today'), subtitle: t('today_subtitle'), icon: <Sun className="text-amber-500" size={28} /> };
      case 'scheduled':
        return { title: t('scheduled'), subtitle: t('scheduled_subtitle'), icon: <Calendar className="text-violet-500" size={28} /> };
      case 'archives':
        return { title: t('archives'), subtitle: t('archives_subtitle'), icon: <Archive className="text-emerald-500" size={28} /> };
      case 'search':
        return { title: t('search_results'), subtitle: t('search_subtitle'), icon: <Search className="text-indigo-500" size={28} /> };
      case 'project':
        return { 
          title: currentProject?.title || t('projects'), 
          subtitle: t('all_tasks_subtitle'), 
          icon: <Folder className="text-indigo-500" size={28} style={{ color: currentProject?.color }} /> 
        };
      default:
        return { title: t('tasks'), subtitle: t('all_tasks_subtitle'), icon: <ListChecks className="text-slate-500" size={28} /> };
    }
  };

  const header = getHeaderInfo();

  // Memoize sorted tasks to prevent expensive recalculations on every render
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Primary sort: Completion status (uncompleted first)
      if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
      }
      // Secondary sort: Creation date (newest first)
      return b.createdAt - a.createdAt;
    });
  }, [tasks]);

  const hasCompletedTasks = useMemo(() => tasks.some(t => t.isCompleted), [tasks]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {header.icon}
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{header.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{header.subtitle}</p>
            </div>
        </div>

        {/* Archive Completed Button */}
        {hasCompletedTasks && onArchiveCompleted && viewMode !== 'archives' && (
            <button 
                onClick={onArchiveCompleted}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-sm font-medium transition-colors"
                title={t('archive_completed')}
            >
                <Archive size={16} />
                <span className="hidden sm:inline">{t('archive_completed')}</span>
            </button>
        )}
      </div>

      {viewMode !== 'archives' && viewMode !== 'search' && (
        <TaskCreator 
          onAdd={onAdd} 
          projects={projects}
          defaultProject={currentProject}
          defaultDate={defaultDate}
          placeholder={`${t('add_task_placeholder')} ${header.title}`}
        />
      )}

      <div className="space-y-3">
        {sortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/20">
            {viewMode === 'search' ? (
                <>
                   <Search size={48} className="mb-4 opacity-50" />
                   <p>{t('no_search_results')}</p>
                </>
            ) : (
                <>
                    <ListChecks size={48} className="mb-4 opacity-50" />
                    <p>{viewMode === 'archives' ? t('no_archived_tasks') : t('no_active_tasks')} {header.title}.</p>
                </>
            )}
          </div>
        )}

        {sortedTasks.map(task => {
          const isActive = activeTaskId === task.id;
          const completedSubtasks = task.subTasks.filter(st => st.isCompleted).length;
          const totalSubtasks = task.subTasks.length;
          const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
          
          const taskProject = projects.find(p => p.id === task.projectId);

          return (
            <div 
              key={task.id} 
              className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                isActive 
                  ? 'bg-white dark:bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-900/10 dark:shadow-indigo-900/20' 
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800'
              } ${task.isCompleted ? 'opacity-60 grayscale' : ''}`}
            >
              {/* Checkbox */}
              <button 
                onClick={() => handleTaskToggle(task)}
                className={`flex-shrink-0 transition-colors ${
                  task.isCompleted ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-400'
                }`}
              >
                {task.isCompleted ? <CheckCircle size={24} /> : <Circle size={24} />}
              </button>

              {/* Task Content */}
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onEdit(task.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                   <p className={`font-medium text-lg truncate ${task.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {task.title}
                  </p>
                  {task.priority === 'high' && !task.isCompleted && (
                    <span className="w-2 h-2 rounded-full bg-red-500" title={t('high_priority')}></span>
                  )}
                  {task.recurrence && !task.isCompleted && (
                    <span title={`${t('repeats')} ${task.recurrence}`}>
                      <Repeat size={14} className="text-slate-400 dark:text-slate-500" />
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  {/* Time Spent */}
                  <span className="flex items-center gap-1 tabular-nums">
                     {formatTime(task.timeSpent)}
                     {isActive && <span className="text-emerald-500 dark:text-emerald-400 font-medium text-xs animate-pulse ml-1">● REC</span>}
                  </span>
                  
                  {/* Project Indicator (if not in project view) */}
                  {taskProject && viewMode !== 'project' && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${taskProject.color}20`, color: taskProject.color }}>
                       <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: taskProject.color }} />
                       {taskProject.title}
                    </span>
                  )}

                  {/* Deadline */}
                  {task.deadline && (
                    <span className={`flex items-center gap-1 ${isOverdue(task.deadline) && !task.isCompleted ? 'text-red-500 dark:text-red-400' : ''}`}>
                      <Calendar size={14} />
                      {new Date(task.deadline).toLocaleDateString(language)}
                    </span>
                  )}

                  {/* Reminders Icon */}
                  {(task.reminders || []).length > 0 && !task.isCompleted && (
                    <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400" title={t('reminders_set')}>
                      <Bell size={14} className="fill-current" />
                      {task.reminders.length}
                    </span>
                  )}

                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <div className="flex gap-1">
                      {task.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtask Progress Bar */}
                {totalSubtasks > 0 && (
                   <div className="mt-3 flex items-center gap-2">
                     <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                     </div>
                     <span className="text-xs text-slate-400">{completedSubtasks}/{totalSubtasks}</span>
                   </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {!task.isCompleted && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onPlay(isActive ? null : task.id); }}
                    className={`p-2 rounded-full transition-colors ${
                      isActive 
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30' 
                        : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/30'
                    }`}
                    title={isActive ? t('pause_timer') : t('start_timer')}
                  >
                    {isActive ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                )}
                
                {/* Archive Button for Completed Tasks */}
                {task.isCompleted && onArchive && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
                    className="p-2 rounded-full text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                    title="Archive Task"
                  >
                    <Archive size={18} />
                  </button>
                )}

                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(task.id); }}
                  className="p-2 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title={t('edit_details')}
                >
                  <Edit2 size={18} />
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="p-2 rounded-full text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title={t('delete_task')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
