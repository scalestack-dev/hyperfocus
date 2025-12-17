
import React, { useState, useRef, useEffect } from 'react';
import { Task, CustomList, Project, Tag as TagType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Play, Pause, Edit2, AlertCircle, Clock, Calendar, CheckCircle, Plus, Hash, Trash2, Check, X, ChevronUp, ChevronDown, Inbox, Tag, Timer } from 'lucide-react';
import { CalendarView } from './CalendarView';

interface EisenhowerMatrixProps {
  tasks: Task[];
  customLists: CustomList[];
  projects: Project[];
  availableTags: TagType[]; 
  onUpdateTask: (task: Task) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string | null) => void;
  activeTaskId: string | null;
  onAddList: (title: string, tag: string) => void;
  onDeleteList: (id: string) => void;
  onRenameList: (id: string, newTitle: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTask: (id: string, direction: 'up' | 'down', contextTaskIds: string[]) => void;
  onAddTask?: (task: Partial<Task>) => void; 
}

const QUICK_DATES = [
    { label: 'Today', offset: 0 },
    { label: 'Tomorrow', offset: 1 },
    { label: 'Next Week', offset: 7 },
];

// Quick Add Component (With @ Trigger)
const QuickAdd: React.FC<{
  onAdd: (title: string, metadata: { projectId?: string, deadline?: number, estimate?: number, tags: string[] }) => void;
  onCancel: () => void;
  t: (key: string) => string;
}> = ({ onAdd, onCancel, t }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState<number | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleClickOutside = (e: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
            setShowCalendar(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTitle(val);
      if (val.endsWith('@') || val.endsWith(' @')) {
          setShowCalendar(true);
      }
  };

  const handleDateSelect = (date: Date) => {
      const d = new Date(date);
      if (d.getHours() === 0) d.setHours(9, 0, 0, 0);
      setDeadline(d.getTime());
      setShowCalendar(false);
      setTitle(prev => prev.replace(/@\s*$/, ''));
      inputRef.current?.focus();
  };

  const handleQuickDate = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      d.setHours(9, 0, 0, 0);
      setDeadline(d.getTime());
      setShowCalendar(false);
      setTitle(prev => prev.replace(/@\s*$/, ''));
      inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) {
      let finalTitle = title;
      let finalDeadline = deadline;
      let finalTags: string[] = [];

      // 1. Time parsing (@HH:MM)
      const timeRegex = /@(\d{1,2}:\d{2})/;
      const timeMatch = finalTitle.match(timeRegex);
      if (timeMatch) {
          const [h, m] = timeMatch[1].split(':').map(Number);
          const d = finalDeadline ? new Date(finalDeadline) : new Date();
          d.setHours(h, m, 0, 0);
          if (!finalDeadline && d.getTime() < Date.now()) {
              d.setDate(d.getDate() + 1);
          }
          finalDeadline = d.getTime();
          finalTitle = finalTitle.replace(timeMatch[0], '').trim();
      }

      // 2. Tag parsing (#tag)
      const tagRegex = /#(\w+)/g;
      const tagMatches = finalTitle.match(tagRegex);
      if (tagMatches) {
          tagMatches.forEach(t => {
              const tagName = t.substring(1);
              if (!finalTags.includes(tagName)) finalTags.push(tagName);
          });
          finalTitle = finalTitle.replace(tagRegex, '').trim();
      }

      onAdd(finalTitle.trim(), { tags: finalTags, deadline: finalDeadline });
      
      setTitle('');
      setDeadline(undefined);
      setShowCalendar(false);
    } else if (e.key === 'Escape') {
        if (showCalendar) setShowCalendar(false);
        else onCancel();
    }
  };

  const formatDeadline = (ts: number) => {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-indigo-100 dark:border-slate-600 mb-3 animate-in fade-in zoom-in-95 duration-200 overflow-visible relative z-20">
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <input 
            ref={inputRef}
            type="text" 
            value={title}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="New task... (Type '@' for date)"
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 p-1"
            />
            <button 
                onClick={() => handleKeyDown({ key: 'Enter' } as React.KeyboardEvent)}
                className="p-1.5 rounded bg-indigo-500 hover:bg-indigo-600 text-white transition-colors flex-shrink-0"
            >
                <Plus size={14} />
            </button>
        </div>

        {deadline && (
            <div className="flex items-center gap-2 px-1">
                <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-800">
                    <Calendar size={10} />
                    {formatDeadline(deadline)}
                    <button onClick={() => setDeadline(undefined)} className="hover:text-red-800 ml-1"><X size={10}/></button>
                </span>
            </div>
        )}
      </div>

       {/* Popover Menu */}
      {showCalendar && (
          <div ref={calendarRef} className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95">
               <div className="flex gap-1 mb-2">
                  {QUICK_DATES.map(q => (
                      <button 
                        key={q.label}
                        onClick={() => handleQuickDate(q.offset)}
                        className="flex-1 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300"
                      >
                          {q.label}
                      </button>
                  ))}
               </div>
               <div className="bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700 p-1">
                   <CalendarView 
                      tasks={[]}
                      selectedDate={deadline ? new Date(deadline) : new Date()}
                      onSelectDate={handleDateSelect}
                      compact
                   />
               </div>
          </div>
      )}
    </div>
  );
};

// ... (Rest of MatrixCard and EisenhowerMatrix)
const MatrixCard: React.FC<{
  task: Task;
  contextTaskIds: string[];
  index: number;
  t: (key: string) => string;
  onReorderTask: (id: string, direction: 'up' | 'down', contextTaskIds: string[]) => void;
  onDeleteTask: (id: string) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string | null) => void;
  activeTaskId: string | null;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}> = ({ 
  task, 
  contextTaskIds, 
  index, 
  t, 
  onReorderTask, 
  onDeleteTask, 
  onEdit, 
  onPlay, 
  activeTaskId,
  onDragStart
}) => {
  return (
    <div 
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        className="bg-white dark:bg-slate-700 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all group flex flex-col gap-2 relative cursor-grab active:cursor-grabbing select-none"
    >
       <div className="flex justify-between items-start pr-6">
         <span className={`font-medium text-sm line-clamp-2 ${task.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
            {task.title}
         </span>
       </div>
       
       {/* Quick Actions (Hover) */}
       <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded">
           <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="text-slate-400 hover:text-red-500 p-1" title={t('delete')}>
               <Trash2 size={14} />
           </button>
           <button onClick={(e) => { e.stopPropagation(); onEdit(task.id); }} className="text-slate-400 hover:text-indigo-500 p-1" title={t('edit_details')}>
               <Edit2 size={14} />
           </button>
       </div>
       
       <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-600/50">
          <div className="flex items-center gap-2 overflow-hidden">
             {task.deadline && (
                <span className={`text-[10px] flex items-center gap-1 flex-shrink-0 ${task.deadline < Date.now() ? 'text-red-500' : 'text-slate-400'}`}>
                   <Calendar size={12} />
                   {new Date(task.deadline).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                </span>
             )}
             {task.estimate && (
                 <span className="text-[10px] flex items-center gap-1 flex-shrink-0 text-slate-400" title="Estimate">
                     <Timer size={12} />
                     {Math.ceil(task.estimate / 60000)}m
                 </span>
             )}
             {task.tags.length > 0 && (
                 <div className="flex gap-1 overflow-hidden">
                     {task.tags.slice(0, 2).map(tag => (
                         <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 truncate max-w-[60px]">#{tag}</span>
                     ))}
                 </div>
             )}
          </div>
          
          <div className="flex items-center gap-0.5">
              <button 
                  onClick={(e) => { e.stopPropagation(); onReorderTask(task.id, 'up', contextTaskIds); }} 
                  disabled={index === 0}
                  className="p-1 text-slate-300 hover:text-indigo-500 disabled:opacity-20 disabled:cursor-default transition-colors"
              >
                  <ChevronUp size={14} />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onReorderTask(task.id, 'down', contextTaskIds); }} 
                  disabled={index === contextTaskIds.length - 1}
                  className="p-1 text-slate-300 hover:text-indigo-500 disabled:opacity-20 disabled:cursor-default transition-colors"
              >
                  <ChevronDown size={14} />
              </button>

              <button 
                 onClick={(e) => { e.stopPropagation(); onPlay(activeTaskId === task.id ? null : task.id); }}
                 className={`ml-1 p-1 rounded-full ${
                    activeTaskId === task.id 
                      ? 'bg-amber-100 text-amber-600' 
                      : 'text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-500'
                 }`}
              >
                 {activeTaskId === task.id ? <Pause size={14} /> : <Play size={14} />}
              </button>
          </div>
       </div>
    </div>
  );
};

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ 
    tasks, 
    customLists,
    projects,
    availableTags,
    onUpdateTask, 
    onEdit, 
    onPlay, 
    activeTaskId,
    onAddList,
    onDeleteList,
    onRenameList,
    onDeleteTask,
    onReorderTask
}) => {
  const { t } = useLanguage();
  
  // State for editing LIST TITLES
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListTitle, setEditListTitle] = useState('');
  
  // Drag & Drop State
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Quick Add Task State (Tracks which list is currently adding a task)
  const [addingTaskToListId, setAddingTaskToListId] = useState<string | null>(null);

  // --- Logic for Quadrants ---
  const isUrgent = (task: Task) => {
    if (!task.deadline) return false;
    const now = Date.now();
    const twoDaysFromNow = now + (2 * 24 * 60 * 60 * 1000); 
    return task.deadline < twoDaysFromNow;
  };
  const isImportant = (task: Task) => task.priority === 'high';

  // Show tasks that are NOT archived (but show completed ones greyed out)
  const activeTasks = tasks.filter(t => !t.isArchived);

  // --- Helpers for Task Creation based on Quadrant ---
  const handleQuickAdd = (title: string, listId: string, metadata: { projectId?: string, deadline?: number, estimate?: number, tags: string[] }) => {
      // Let's formulate the new task based on the list
      const now = Date.now();
      const tomorrow = now + (24 * 60 * 60 * 1000); 
      const nextWeek = now + (7 * 24 * 60 * 60 * 1000);

      const newTask: Partial<Task> = {
          id: crypto.randomUUID(),
          title,
          createdAt: now,
          isCompleted: false,
          subTasks: [],
          tags: metadata.tags || [],
          reminders: [],
          timeSpent: 0,
          status: 'todo',
          projectId: metadata.projectId,
          estimate: metadata.estimate,
      };

      // Defaults based on Quadrant, overridden by metadata if provided
      switch (listId) {
          case 'q1': // Urgent & Important
              newTask.priority = 'high';
              newTask.deadline = metadata.deadline || tomorrow;
              break;
          case 'q2': // Not Urgent & Important
              newTask.priority = 'high';
              newTask.deadline = metadata.deadline || nextWeek;
              break;
          case 'q3': // Urgent & Not Important
              newTask.priority = 'medium';
              newTask.deadline = metadata.deadline || tomorrow;
              break;
          case 'q4': // Not Urgent & Not Important
              newTask.priority = 'low';
              newTask.deadline = metadata.deadline;
              break;
          default:
              // Custom List
              const list = customLists.find(l => l.id === listId);
              if (list) {
                  newTask.tags = [...(metadata.tags || []), list.tagFilter];
                  newTask.priority = 'medium';
                  newTask.deadline = metadata.deadline;
              }
              break;
      }

      if (typeof (window as any).handleGlobalAddTask === 'function') {
          (window as any).handleGlobalAddTask(newTask);
      }
      setAddingTaskToListId(null);
  };

  // ... (Drag & Drop handlers remain same)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData('taskId', taskId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      setDragOverId(id);
  };

  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverId(null);
      const taskId = e.dataTransfer.getData('taskId');
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const now = Date.now();
      const urgentThreshold = now + (48 * 60 * 60 * 1000);
      const tomorrow = now + (24 * 60 * 60 * 1000);

      if (['q1', 'q2', 'q3', 'q4'].includes(targetId)) {
          const updates: Partial<Task> = {};
          switch (targetId) {
              case 'q1': // Urgent & Important
                  updates.priority = 'high';
                  if (!task.deadline || task.deadline > urgentThreshold) updates.deadline = tomorrow;
                  break;
              case 'q2': // Not Urgent & Important
                  updates.priority = 'high';
                  if (task.deadline && task.deadline <= urgentThreshold) updates.deadline = undefined;
                  break;
              case 'q3': // Urgent & Not Important
                  if (task.priority === 'high') updates.priority = 'medium';
                  if (!task.deadline || task.deadline > urgentThreshold) updates.deadline = tomorrow;
                  break;
              case 'q4': // Not Urgent & Not Important
                  updates.priority = 'low';
                  if (task.deadline && task.deadline <= urgentThreshold) updates.deadline = undefined;
                  break;
          }
          onUpdateTask({ ...task, ...updates });
      } else {
          const targetList = customLists.find(l => l.id === targetId);
          if (targetList) {
              const otherListTags = customLists.filter(l => l.id !== targetId).map(l => l.tagFilter);
              const newTags = task.tags.filter(tag => !otherListTags.includes(tag)).concat(targetList.tagFilter);
              onUpdateTask({ ...task, tags: [...new Set(newTags)] });
          }
      }
  };

  const saveListTitle = (id: string) => {
      if (editListTitle.trim()) {
          onRenameList(id, editListTitle.trim());
      }
      setEditingListId(null);
  };

  // --- Render Helpers ---
  const renderList = (
      id: string, 
      title: string, 
      subtitle: string | React.ReactNode, 
      listTasks: Task[], 
      accentColor: string, 
      Icon: any,
      isCustom: boolean = false,
      tagFilter?: string
  ) => {
      const isOver = dragOverId === id;
      const contextTaskIds = listTasks.map(t => t.id);
      const isAdding = addingTaskToListId === id;

      return (
        <div 
           className={`flex flex-col h-full rounded-xl border-t-4 ${accentColor} transition-colors ${
               isOver 
               ? 'bg-indigo-50 dark:bg-slate-700/50 ring-2 ring-indigo-400' 
               : 'bg-white dark:bg-slate-800 border-x border-b border-slate-200 dark:border-slate-700'
           } overflow-hidden min-h-[300px] shadow-sm relative group/list`}
           onDragOver={(e) => handleDragOver(e, id)}
           onDrop={(e) => handleDrop(e, id)}
           onDragLeave={handleDragLeave}
        >
           {/* Header */}
           <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                 {isCustom && editingListId === id ? (
                     <div className="flex items-center gap-1 flex-1 mr-2">
                        <input 
                            value={editListTitle}
                            onChange={(e) => setEditListTitle(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') saveListTitle(id); }}
                            autoFocus
                            className="w-full text-sm p-1 rounded border bg-white dark:bg-slate-700"
                        />
                        <button onClick={() => saveListTitle(id)} className="text-emerald-500"><Check size={14}/></button>
                     </div>
                 ) : (
                     <div className="flex items-center gap-2 group/title">
                       <h3 
                         className={`text-sm font-semibold text-slate-700 dark:text-slate-200 ${isCustom ? 'cursor-pointer hover:text-indigo-500' : ''}`}
                         onClick={() => { if(isCustom) { setEditingListId(id); setEditListTitle(title); }}}
                       >
                           {title}
                       </h3>
                       {isCustom && <Edit2 size={10} className="text-slate-300 opacity-0 group-hover/title:opacity-100" />}
                     </div>
                 )}

                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                        {listTasks.length}
                    </span>
                    {isCustom && (
                        <button onClick={() => onDeleteList(id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={12} />
                        </button>
                    )}
                    <button onClick={() => { if(isCustom) { setEditingListId(id); setEditListTitle(title); }}} className="text-slate-300 hover:text-slate-500">
                       <Edit2 size={12} />
                    </button>
                 </div>
              </div>
           </div>

           {/* Tasks Area */}
           <div className="flex-1 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/20 relative">
              
              {/* Quick Add Input (if active) */}
              {isAdding && (
                  <QuickAdd 
                    onAdd={(t, m) => handleQuickAdd(t, id, m)} 
                    onCancel={() => setAddingTaskToListId(null)}
                    t={t}
                  />
              )}

              {listTasks.map((task, index) => (
                <div key={task.id} className="mb-2 last:mb-0">
                    <MatrixCard 
                        task={task}
                        contextTaskIds={contextTaskIds}
                        index={index}
                        t={t}
                        onReorderTask={onReorderTask}
                        onDeleteTask={onDeleteTask}
                        onEdit={onEdit}
                        onPlay={onPlay}
                        activeTaskId={activeTaskId}
                        onDragStart={handleDragStart}
                    />
                </div>
              ))}
              
              {listTasks.length === 0 && !isAdding && (
                <div className="h-full flex items-center justify-center">
                   <button 
                      onClick={() => setAddingTaskToListId(id)}
                      className="flex items-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                   >
                      <Plus size={16} /> {t('add')}
                   </button>
                </div>
              )}
           </div>

           {/* Hover Add Button (if not adding and has tasks) */}
           {listTasks.length > 0 && !isAdding && (
               <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover/list:opacity-100 transition-opacity pointer-events-none">
                   <button 
                      onClick={() => setAddingTaskToListId(id)}
                      className="pointer-events-auto bg-white dark:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-600 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:text-indigo-500 flex items-center gap-1 hover:scale-105 transition-transform"
                   >
                       <Plus size={12} /> {t('add')}
                   </button>
               </div>
           )}
        </div>
      );
  };

  const nonArchivedTasks = tasks.filter(t => !t.isArchived);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('eisenhower')}</h2>
            <p className="text-slate-500 text-sm">{t('matrix_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 pb-8">
         {renderList('q1', t('urgent') + ' & ' + t('important'), t('do_first'), nonArchivedTasks.filter(t => isUrgent(t) && isImportant(t)), "border-red-500", AlertCircle)}
         {renderList('q2', t('not_urgent') + ' & ' + t('important'), t('schedule'), nonArchivedTasks.filter(t => !isUrgent(t) && isImportant(t)), "border-blue-500", Calendar)}
         {renderList('q3', t('urgent') + ' & ' + t('not_important'), t('delegate'), nonArchivedTasks.filter(t => isUrgent(t) && !isImportant(t)), "border-amber-500", Clock)}
         {renderList('q4', t('not_urgent') + ' & ' + t('not_important'), t('eliminate'), nonArchivedTasks.filter(t => !isUrgent(t) && !isImportant(t)), "border-slate-400", CheckCircle)}

         {customLists.map(list => (
             <React.Fragment key={list.id}>
                 {renderList(
                     list.id, 
                     list.title, 
                     t('custom_tables'), 
                     nonArchivedTasks.filter(t => t.tags.includes(list.tagFilter)), 
                     "border-indigo-400", 
                     Hash,
                     true,
                     list.tagFilter
                 )}
             </React.Fragment>
         ))}
      </div>
    </div>
  );
};
