
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Flag, Folder, Layers, List, CheckSquare, X, ChevronDown } from 'lucide-react';
import { Project, Task, SubTask } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CalendarView } from './CalendarView';

interface TaskCreatorProps {
  onAdd: (tasks: Partial<Task>[]) => void;
  projects: Project[];
  defaultProject?: Project | null;
  defaultDate?: Date | null;
  placeholder?: string;
}

type Tab = 'single' | 'bulk';

export const TaskCreator: React.FC<TaskCreatorProps> = ({ onAdd, projects, defaultProject, defaultDate, placeholder }) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('single');
  
  // Single Mode State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>(defaultProject?.id || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState<Date | null>(defaultDate || null);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Bulk Mode State
  const [bulkText, setBulkText] = useState('');

  // UI State
  const [showCalendar, setShowCalendar] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync state with props when they change (e.g. view switching)
  useEffect(() => {
    if (defaultDate) {
        setDeadline(defaultDate);
    } else {
        setDeadline(null);
    }
  }, [defaultDate]);

  useEffect(() => {
    if (defaultProject) {
        setSelectedProject(defaultProject.id);
    } else {
        setSelectedProject('');
    }
  }, [defaultProject]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        // Only collapse if empty to prevent data loss
        if (!title.trim() && !bulkText.trim()) {
            setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title, bulkText]);

  const handleAddSingle = (shouldClose: boolean = true) => {
    if (!title.trim()) return;

    const newTask: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      projectId: selectedProject || undefined,
      priority,
      deadline: deadline?.getTime(),
      subTasks: subtasks.map(st => ({
        id: crypto.randomUUID(),
        title: st,
        isCompleted: false
      }))
    };

    onAdd([newTask]);

    // Reset fields
    setTitle('');
    setDescription('');
    setSubtasks([]);
    setNewSubtask('');
    
    if (shouldClose) {
       setIsExpanded(false);
       setDeadline(defaultDate || null);
       setPriority('medium');
    } else {
       // Focus title again
       setTimeout(() => titleInputRef.current?.focus(), 10);
    }
  };

  const handleAddBulk = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    const tasks: Partial<Task>[] = [];
    let currentTask: Partial<Task> | null = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // It's a subtask of the previous task
        if (currentTask) {
          if (!currentTask.subTasks) currentTask.subTasks = [];
          currentTask.subTasks.push({
            id: crypto.randomUUID(),
            title: trimmed.substring(2),
            isCompleted: false
          });
        }
      } else {
        // It's a new task
        if (currentTask) tasks.push(currentTask);
        currentTask = {
          title: trimmed,
          projectId: selectedProject || undefined,
          deadline: deadline?.getTime(), // Apply common deadline
          priority: 'medium',
          subTasks: []
        };
      }
    });

    if (currentTask) tasks.push(currentTask);

    if (tasks.length > 0) {
      onAdd(tasks);
      setBulkText('');
      setIsExpanded(false);
      setDeadline(defaultDate || null);
    }
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  // Date Helpers
  const setQuickDate = (type: 'today' | 'tomorrow' | 'nextWeek') => {
    const d = new Date();
    d.setHours(12, 0, 0, 0); // Default to noon
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    if (type === 'nextWeek') d.setDate(d.getDate() + 7);
    setDeadline(d);
    setShowCalendar(false);
  };

  if (!isExpanded) {
    return (
      <div 
        className="mb-8 relative" 
        onClick={() => setIsExpanded(true)}
      >
        <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl py-4 pl-5 pr-14 shadow-sm cursor-text hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center gap-3">
          <Plus size={20} />
          <span>{placeholder || t('add_task_placeholder')}...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="mb-8 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200 overflow-visible z-10">
      
      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('single')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'single' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <List size={16} /> {t('quick_add')}
        </button>
        <button 
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'bulk' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <Layers size={16} /> {t('bulk_add')}
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* SINGLE MODE */}
        {activeTab === 'single' && (
          <>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSingle(false); }}
              placeholder={t('title')}
              className="w-full text-lg font-semibold bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 focus:border-indigo-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-100"
              autoFocus
            />
            
            <textarea 
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder={t('description')}
               rows={2}
               className="w-full text-sm bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent focus:border-indigo-500 text-slate-700 dark:text-slate-200"
            />

            {/* Subtasks List */}
            <div className="space-y-2">
              {subtasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 pl-2 border-l-2 border-indigo-200 dark:border-indigo-800">
                  <CheckSquare size={14} className="text-slate-400" />
                  <span>{st}</span>
                  <button onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} className="ml-auto text-slate-400 hover:text-red-500"><X size={14}/></button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-slate-400" />
                <input 
                  type="text" 
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                  placeholder={t('add_subtask_placeholder')}
                  className="flex-1 bg-transparent text-sm focus:outline-none py-1 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </>
        )}

        {/* BULK MODE */}
        {activeTab === 'bulk' && (
           <div className="space-y-2">
              <p className="text-xs text-slate-500 flex items-center gap-2">
                 <Layers size={14} /> {t('one_per_line')} • {t('bulk_help')}
              </p>
              <textarea 
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="- Task 1&#10;- Task 2&#10;  - Subtask A"
                className="w-full h-40 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              />
           </div>
        )}

        {/* Common Controls (Date, Project, Actions) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
           
           <div className="flex flex-wrap items-center gap-2">
              {/* Date Picker */}
              <div className="relative">
                  <button 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${deadline ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-400'}`}
                  >
                    <Calendar size={14} />
                    {deadline ? deadline.toLocaleDateString() : t('schedule')}
                  </button>

                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2">
                       <div className="flex gap-1 mb-2">
                          <button onClick={() => setQuickDate('today')} className="flex-1 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20">{t('today')}</button>
                          <button onClick={() => setQuickDate('tomorrow')} className="flex-1 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20">{t('tomorrow')}</button>
                          <button onClick={() => setQuickDate('nextWeek')} className="flex-1 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20">{t('next_week')}</button>
                       </div>
                       <CalendarView 
                          tasks={[]} 
                          selectedDate={deadline || new Date()} 
                          onSelectDate={(d) => { setDeadline(d); setShowCalendar(false); }}
                          compact
                        />
                    </div>
                  )}
              </div>

              {/* Project Picker */}
              <div className="relative">
                 <select
                   value={selectedProject}
                   onChange={(e) => setSelectedProject(e.target.value)}
                   className="appearance-none pl-8 pr-4 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400 focus:outline-none"
                 >
                   <option value="">{t('none')}</option>
                   {projects.map(p => (
                     <option key={p.id} value={p.id}>{p.title}</option>
                   ))}
                 </select>
                 <Folder size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Priority (Single Only) */}
              {activeTab === 'single' && (
                 <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                    {(['low', 'medium', 'high'] as const).map(p => (
                       <button
                         key={p}
                         onClick={() => setPriority(p)}
                         className={`px-3 py-1 text-xs font-medium capitalize rounded-md transition-all ${
                           priority === p 
                             ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' 
                             : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                         }`}
                       >
                         {t(p)}
                       </button>
                    ))}
                 </div>
              )}
           </div>

           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {t('cancel')}
              </button>
              
              {activeTab === 'single' && (
                <button 
                  onClick={() => handleAddSingle(false)}
                  className="hidden sm:block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                >
                  {t('add_and_next')}
                </button>
              )}

              <button 
                onClick={() => activeTab === 'single' ? handleAddSingle(true) : handleAddBulk()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md shadow-indigo-500/20"
              >
                {activeTab === 'single' ? t('add_task_btn') : t('add_tasks_btn')}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
