
import React, { useState, useRef, useEffect } from 'react';
import { Task, KanbanColumn, Project, Tag as TagType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Play, Pause, Edit2, Plus, Trash2, Calendar, Timer, X, Clock } from 'lucide-react';
import { CalendarView } from './CalendarView';

interface KanbanBoardProps {
  tasks: Task[];
  columns: KanbanColumn[];
  projects: Project[];
  availableTags: TagType[];
  onUpdateTask: (task: Task) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string | null) => void;
  activeTaskId: string | null;
  onAddColumn: (title: string, color: string) => void;
  onDeleteColumn: (id: string) => void;
  onRenameColumn: (id: string, newTitle: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTask: (id: string, direction: 'up' | 'down', contextTaskIds: string[]) => void;
  onAdd?: (tasks: Partial<Task>[]) => void; 
}

const COLORS = [
  'border-slate-400',
  'border-blue-500',
  'border-emerald-500',
  'border-amber-500',
  'border-red-500',
  'border-violet-500',
  'border-pink-500',
  'border-cyan-500',
  'border-indigo-500',
];

const QUICK_DATES = [
    { label: 'Today', offset: 0 },
    { label: 'Tomorrow', offset: 1 },
    { label: 'Next Week', offset: 7 },
];

// --- Quick Add Component (With @ Trigger) ---
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
      // Trigger calendar when typing '@' at end
      if (val.endsWith('@') || val.endsWith(' @')) {
          setShowCalendar(true);
      }
  };

  const handleDateSelect = (date: Date) => {
      const d = new Date(date);
      // Default to 9 AM if no time
      if (d.getHours() === 0) d.setHours(9, 0, 0, 0);
      
      setDeadline(d.getTime());
      setShowCalendar(false);
      // Clean the trigger '@' from text if it's at the end
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
      // Parse inline values
      let finalTitle = title;
      let finalDeadline = deadline;
      let finalTags: string[] = [];

      // 1. Time parsing in text (@HH:MM) overrides or augments selected date
      const timeRegex = /@(\d{1,2}:\d{2})/;
      const timeMatch = finalTitle.match(timeRegex);
      if (timeMatch) {
          const [h, m] = timeMatch[1].split(':').map(Number);
          const d = finalDeadline ? new Date(finalDeadline) : new Date();
          d.setHours(h, m, 0, 0);
          
          // If no date was selected and time is past, assume tomorrow
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
    <div className="bg-white dark:bg-slate-700 rounded shadow-md border border-indigo-100 dark:border-slate-600 mb-2 relative z-20">
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <input 
            ref={inputRef}
            type="text" 
            value={title}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="New task... (Try typing '@' for date)"
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 p-1"
            />
            <button 
                onClick={() => handleKeyDown({ key: 'Enter' } as React.KeyboardEvent)}
                className="w-7 h-7 flex items-center justify-center rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm shrink-0"
            >
                <Plus size={16} />
            </button>
        </div>

        {/* Selected Metadata Badges */}
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

// --- Kanban Card ---
const KanbanCard: React.FC<{
  task: Task;
  index: number;
  columnId: string;
  activeTaskId: string | null;
  contextTaskIds: string[];
  t: (key: string) => string;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDeleteTask: (id: string) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string | null) => void;
  onReorderTask: (id: string, direction: 'up' | 'down', contextTaskIds: string[]) => void;
}> = ({
  task,
  index,
  activeTaskId,
  contextTaskIds,
  t,
  onDragStart,
  onDeleteTask,
  onEdit,
  onPlay,
  onReorderTask,
}) => {
  return (
    <div 
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onClick={() => onEdit(task.id)}
        className={`bg-white dark:bg-slate-700 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing select-none mb-2 ${task.isCompleted ? 'opacity-70' : ''}`}
    >
      <div className="flex justify-between items-start mb-1 pr-6">
         <h4 className={`text-sm font-medium line-clamp-2 ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</h4>
      </div>
      
      {/* Quick Actions (Hover) */}
      <div className="absolute top-1 right-1 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded">
          <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1 text-slate-400 hover:text-red-500" title={t('delete')}>
            <Trash2 size={12} />
          </button>
      </div>
      
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
         {task.priority === 'high' && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="High Priority" />
         )}
         {task.tags.slice(0, 3).map(tag => (
           <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300">#{tag}</span>
         ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-600/50 mt-1">
         <div className="flex items-center gap-2 text-xs text-slate-400">
            {task.deadline && (
                 <span className={`flex items-center gap-0.5 ${task.deadline < Date.now() ? 'text-red-500' : ''}`}>
                    <Calendar size={10} />
                    {new Date(task.deadline).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                 </span>
            )}
            {task.estimate && (
                 <span className="flex items-center gap-0.5" title="Estimate">
                     <Timer size={10} />
                     {Math.ceil(task.estimate / 60000)}m
                 </span>
             )}
         </div>

         <div className="flex items-center gap-1">
             {!task.isCompleted && (
               <button 
                  onClick={(e) => { e.stopPropagation(); onPlay(activeTaskId === task.id ? null : task.id); }}
                  className={`p-1 rounded-full transition-colors ${
                    activeTaskId === task.id 
                      ? 'bg-amber-100 text-amber-600' 
                      : 'text-slate-300 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
               >
                 {activeTaskId === task.id ? <Pause size={12} /> : <Play size={12} />}
               </button>
             )}
         </div>
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  columns,
  projects,
  availableTags,
  onUpdateTask, 
  onEdit, 
  onPlay, 
  activeTaskId,
  onAddColumn,
  onDeleteColumn,
  onRenameColumn,
  onDeleteTask,
  onReorderTask,
  onAdd
}) => {
  const { t } = useLanguage();
  
  // UI States
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColTitle, setEditColTitle] = useState('');
  
  // Drag & Drop
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  
  // Quick Add Task
  const [addingTaskToColId, setAddingTaskToColId] = useState<string | null>(null);

  const handleStatusChange = (task: Task, newStatusId: string) => {
    const isDoneColumn = newStatusId === 'done' || newStatusId.toLowerCase().includes('done');
    
    const updatedTask = { 
        ...task, 
        status: newStatusId,
        isCompleted: isDoneColumn ? true : task.isCompleted
    };
    
    onUpdateTask(updatedTask);
  };

  const handleAddColumnSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newColTitle.trim()) {
          // Random color from palette
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          onAddColumn(newColTitle.trim(), color);
          setNewColTitle('');
          setIsAddingColumn(false);
      }
  };

  const startEditingColumn = (column: KanbanColumn) => {
      setEditingColId(column.id);
      setEditColTitle(column.title);
  };

  const saveColumnTitle = (id: string) => {
      if(editColTitle.trim()) {
          onRenameColumn(id, editColTitle.trim());
      }
      setEditingColId(null);
  };

  const handleQuickAdd = (title: string, columnId: string, metadata: { projectId?: string, deadline?: number, estimate?: number, tags: string[] }) => {
     const addTaskFn = onAdd || (window as any).handleGlobalAddTask;
     
     if (typeof addTaskFn === 'function') {
         const isDoneColumn = columnId === 'done';
         const newTask: Partial<Task> = {
            id: crypto.randomUUID(),
            title,
            status: columnId,
            isCompleted: isDoneColumn,
            createdAt: Date.now(),
            subTasks: [],
            tags: metadata.tags || [],
            reminders: [],
            projectId: metadata.projectId,
            deadline: metadata.deadline,
            estimate: metadata.estimate,
         };
         addTaskFn([newTask]);
     }
     setAddingTaskToColId(null);
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== colId) {
        handleStatusChange(task, colId);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
       <div className="flex-1 overflow-x-auto overflow-y-hidden">
         <div className="h-full flex px-4 pb-4 pt-2 gap-4 min-w-max">
            {columns.map((col) => {
                const columnTasks = tasks.filter(t => (t.status || 'todo') === col.id);
                const isDragOver = dragOverColId === col.id;
                const isAdding = addingTaskToColId === col.id;
                const contextTaskIds = columnTasks.map(t => t.id);

                return (
                  <div 
                    key={col.id}
                    className={`flex flex-col w-80 h-full rounded-xl transition-colors ${
                       isDragOver ? 'bg-indigo-50 dark:bg-slate-700/80 ring-2 ring-indigo-400' : 'bg-slate-100/50 dark:bg-slate-800/30'
                    }`}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    onDragLeave={() => setDragOverColId(null)}
                  >
                    {/* Column Header */}
                    <div className="p-3 flex items-center justify-between group/header shrink-0">
                       <div className="flex items-center gap-2 overflow-hidden">
                          {editingColId === col.id ? (
                             <input 
                                autoFocus
                                value={editColTitle}
                                onChange={(e) => setEditColTitle(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') saveColumnTitle(col.id); }}
                                onBlur={() => saveColumnTitle(col.id)}
                                className="w-full text-sm font-semibold bg-white dark:bg-slate-700 px-1 py-0.5 rounded border border-indigo-500 outline-none"
                             />
                          ) : (
                             <>
                                <h3 
                                  className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate cursor-pointer"
                                  onClick={() => startEditingColumn(col)}
                                >
                                  {col.title}
                                </h3>
                                <span className="text-xs text-slate-400 font-mono">
                                   -{columnTasks.length}
                                </span>
                             </>
                          )}
                       </div>
                       
                       <div className="flex items-center opacity-0 group-hover/header:opacity-100 transition-opacity">
                          <button onClick={() => startEditingColumn(col)} className="p-1 text-slate-400 hover:text-slate-600">
                             <Edit2 size={12} />
                          </button>
                          {columns.length > 1 && (
                            <button onClick={() => { if(confirm(t('confirm_delete_column'))) onDeleteColumn(col.id); }} className="p-1 text-slate-400 hover:text-red-500">
                                <Trash2 size={12} />
                            </button>
                          )}
                       </div>
                    </div>

                    {/* Quick Add Area */}
                    {isAdding && (
                       <div className="px-2 pb-1 relative z-50">
                           <QuickAdd 
                              onAdd={(title, meta) => handleQuickAdd(title, col.id, meta)}
                              onCancel={() => setAddingTaskToColId(null)}
                              t={t}
                           />
                       </div>
                    )}

                    {/* Tasks List */}
                    <div className="flex-1 overflow-y-auto px-2 pb-2">
                       {columnTasks.map((task, index) => (
                           <KanbanCard 
                              key={task.id}
                              task={task}
                              index={index}
                              columnId={col.id}
                              activeTaskId={activeTaskId}
                              contextTaskIds={contextTaskIds}
                              t={t}
                              onDragStart={handleDragStart}
                              onDeleteTask={onDeleteTask}
                              onEdit={onEdit}
                              onPlay={onPlay}
                              onReorderTask={onReorderTask}
                           />
                       ))}

                       {/* Add Button */}
                       {!isAdding && (
                          <button 
                             onClick={() => setAddingTaskToColId(col.id)}
                             className={`w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-xs font-medium ${columnTasks.length === 0 ? 'mt-8' : 'mt-1'}`}
                          >
                             <Plus size={14} /> {t('add')}
                          </button>
                       )}
                    </div>
                  </div>
                );
            })}

            {/* Add Column Button */}
            <div className="w-80 h-full shrink-0">
               {!isAddingColumn ? (
                   <button 
                      onClick={() => setIsAddingColumn(true)}
                      className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all font-medium text-sm bg-slate-50/50 dark:bg-slate-800/20"
                   >
                      <Plus size={16} /> {t('add_column')}
                   </button>
               ) : (
                   <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg animate-in fade-in zoom-in-95">
                       <form onSubmit={handleAddColumnSubmit}>
                           <input 
                              autoFocus
                              type="text" 
                              placeholder={t('column_title')} 
                              value={newColTitle}
                              onChange={e => setNewColTitle(e.target.value)}
                              className="w-full p-2 mb-2 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <div className="flex gap-2">
                               <button type="submit" className="flex-1 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-500">{t('add')}</button>
                               <button type="button" onClick={() => setIsAddingColumn(false)} className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs hover:bg-slate-200">{t('cancel')}</button>
                           </div>
                       </form>
                   </div>
               )}
            </div>
         </div>
       </div>
    </div>
  );
};
