
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Calendar, Tag as TagIcon, CheckSquare, AlignLeft, Flag, Bell, Clock, AlertCircle, ChevronDown, ChevronUp, Repeat, Folder, Check, Activity, PauseCircle, Play, Pause, Volume2, Save } from 'lucide-react';
import { Task, SubTask, Project, Tag, CustomRecurrenceConfig, RecurrenceType } from '../types';
import { CalendarView } from './CalendarView';
import { useLanguage } from '../contexts/LanguageContext';

// Reusable Compact TimePicker Component
const TimePicker: React.FC<{ date: Date, onChange: (date: Date) => void }> = ({ date, onChange }) => {
  const { t } = useLanguage();
  const h = date.getHours();
  const m = date.getMinutes();
  const h12 = h % 12 || 12;
  const p = h >= 12 ? 'PM' : 'AM';

  const setTime = (type: 'hour' | 'minute' | 'period', val: number | string) => {
    const newDate = new Date(date);
    let newH = newDate.getHours();
    let newM = newDate.getMinutes();

    if (type === 'hour') {
      const v = val as number;
      if (p === 'AM') newH = v === 12 ? 0 : v;
      else newH = v === 12 ? 12 : v + 12;
    } else if (type === 'minute') {
      newM = val as number;
    } else if (type === 'period') {
      const v = val as string;
      if (v === 'AM' && newH >= 12) newH -= 12;
      if (v === 'PM' && newH < 12) newH += 12;
    }
    
    newDate.setHours(newH, newM, 0, 0);
    onChange(newDate);
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
         <span className="text-xs font-semibold text-slate-500 uppercase">{t('time_label')}</span>
         <div className="text-sm font-mono font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-200">
           {h12.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')} {p}
         </div>
      </div>
      
      <div className="flex gap-1 h-32">
        {/* Hours */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 snap-y">
          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(hour => (
            <button 
              key={hour} 
              onClick={(e) => { e.preventDefault(); setTime('hour', hour); }}
              className={`w-full py-1.5 text-xs font-medium snap-center transition-colors ${h12 === hour ? 'bg-indigo-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              {hour.toString().padStart(2, '0')}
            </button>
          ))}
        </div>
        
        {/* Minutes */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 snap-y">
          {Array.from({length: 12}, (_, i) => i * 5).map(min => (
            <button 
              key={min}
              onClick={(e) => { e.preventDefault(); setTime('minute', min); }}
              className={`w-full py-1.5 text-xs font-medium snap-center transition-colors ${m === min ? 'bg-indigo-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              {min.toString().padStart(2, '0')}
            </button>
          ))}
        </div>

        {/* Period */}
        <div className="flex-1 flex flex-col gap-1">
          {['AM', 'PM'].map(pd => (
             <button 
              key={pd}
              onClick={(e) => { e.preventDefault(); setTime('period', pd); }}
              className={`flex-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors ${p === pd ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              {pd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Custom Recurrence Config Component
const CustomRecurrenceEditor: React.FC<{
  initialConfig?: CustomRecurrenceConfig;
  onSave: (config: CustomRecurrenceConfig) => void;
  onCancel: () => void;
  t: (key: string) => string;
}> = ({ initialConfig, onSave, onCancel, t }) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(initialConfig?.frequency || 'weekly');
  const [interval, setInterval] = useState<number | string>(initialConfig?.interval || 1);
  const [startDate, setStartDate] = useState(initialConfig?.startDate ? new Date(initialConfig.startDate) : new Date());
  const [weekDays, setWeekDays] = useState<number[]>(initialConfig?.weekDays || []);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize/Reset state when initialConfig changes
  useEffect(() => {
      setFrequency(initialConfig?.frequency || 'weekly');
      setInterval(initialConfig?.interval || 1);
      setStartDate(initialConfig?.startDate ? new Date(initialConfig.startDate) : new Date());
      setWeekDays(initialConfig?.weekDays || []);
  }, [initialConfig]);

  useEffect(() => {
    // Default to current weekday if no weekdays selected and we are in weekly mode
    if (frequency === 'weekly' && (!weekDays || weekDays.length === 0)) {
      setWeekDays([new Date().getDay()]);
    }
  }, [frequency]); 

  const toggleWeekDay = (day: number) => {
    if (weekDays.includes(day)) {
      setWeekDays(weekDays.filter(d => d !== day));
    } else {
      setWeekDays([...weekDays, day]);
    }
  };

  const handleSave = () => {
    onSave({
      frequency,
      interval: Number(interval) || 1, 
      startDate: startDate.getTime(),
      weekDays: frequency === 'weekly' ? weekDays : []
    });
  };

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  // Display order: Mon -> Sun (index 1 to 6, then 0)
  const uiWeekDays = [1, 2, 3, 4, 5, 6, 0];

  return (
    // Added relative and z-index to ensure it sits above the fixed backdrop correctly
    <div className="relative z-50 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-80 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('repeat_config')} *</label>
        <div className="w-full p-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between">
          <span>{t('custom_recurrence')}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="w-1/3">
          <label className="block text-xs font-semibold text-slate-500 mb-1">{t('repeat_every')} *</label>
          <input
            type="number"
            min="1"
            value={interval}
            onChange={(e) => {
                const val = e.target.value;
                setInterval(val === '' ? '' : Math.max(1, parseInt(val)));
            }}
            onBlur={() => {
                if (!interval) setInterval(1);
            }}
            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>
        <div className="w-2/3">
          <label className="block text-xs font-semibold text-slate-500 mb-1">{t('repeat_cycle')} *</label>
          <div className="relative">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            >
              <option value="daily">{t('day')}</option>
              <option value="weekly">{t('week')}</option>
              <option value="monthly">{t('month')}</option>
              <option value="yearly">{t('year')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mb-4 relative">
        <label className="block text-xs font-semibold text-slate-500 mb-1">{t('start_date')} *</label>
        <button 
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="w-full text-left p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm flex items-center justify-between text-slate-900 dark:text-white hover:border-indigo-400 transition-colors"
        >
          <span>{startDate.toLocaleDateString()}</span>
          <Calendar size={14} className="text-slate-400" />
        </button>
        {showDatePicker && (
          // Increased z-index to 60 to ensure it floats above everything
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-[60]">
             <CalendarView 
                tasks={[]} 
                selectedDate={startDate} 
                onSelectDate={(d) => { setStartDate(d); setShowDatePicker(false); }} 
                compact 
             />
          </div>
        )}
      </div>

      {frequency === 'weekly' && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {uiWeekDays.map((dayIdx) => (
            <label 
              key={dayIdx} 
              className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-colors select-none ${weekDays.includes(dayIdx) ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              onClick={(e) => {
                  e.preventDefault(); // Prevent double triggering if label wraps input
                  toggleWeekDay(dayIdx);
              }}
            >
              <div className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${weekDays.includes(dayIdx) ? 'bg-pink-500 border-pink-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                 {weekDays.includes(dayIdx) && <Check size={10} className="text-white" />}
              </div>
              {/* Input is visual only via the div above, actual state managed by onClick on label */}
              <input 
                type="checkbox" 
                checked={weekDays.includes(dayIdx)}
                onChange={() => {}} // Handled by label click
                className="hidden"
              />
              <span className="text-sm capitalize text-slate-700 dark:text-slate-200">{t(dayNames[dayIdx])}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors">
          {t('cancel')}
        </button>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-md shadow-indigo-500/20 transition-all">
          <Save size={16} />
          {t('save')}
        </button>
      </div>
    </div>
  );
};

interface TaskDetailProps {
  task: Task;
  projects: Project[];
  availableTags: Tag[];
  onUpdate: (task: Task) => void;
  onClose: () => void;
  activeTaskId: string | null;
  onToggleTimer: (id: string | null) => void;
  onDelete: (id: string) => void;
  onCreateTag: (tagName: string) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ 
  task, 
  projects, 
  availableTags, 
  onUpdate, 
  onClose, 
  activeTaskId,
  onToggleTimer,
  onDelete,
  onCreateTag
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [showCalendar, setShowCalendar] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isTagInputVisible, setIsTagInputVisible] = useState(false);
  const [isCustomRecurrenceOpen, setIsCustomRecurrenceOpen] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setNewSubtask('');
    setNewTag('');
    setIsTagInputVisible(false);
    setIsCustomRecurrenceOpen(false);
  }, [task.id]);

  const handleTitleBlur = () => {
    if (title !== task.title) onUpdate({ ...task, title });
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) onUpdate({ ...task, description });
  };

  // Helper to maintain relative reminder offset when deadline changes
  const updateDeadlineWithReminders = (newDeadline: number) => {
      let newReminders = task.reminders;
      if (task.deadline && task.reminders && task.reminders.length === 1) {
          const diff = task.deadline - task.reminders[0];
          // Only shift if the reminder was "before" the deadline (positive diff)
          if (diff >= 0) {
              newReminders = [newDeadline - diff];
          }
      }
      onUpdate({ ...task, deadline: newDeadline, reminders: newReminders });
  };

  const handleDateSelect = (date: Date) => {
    let newDate = new Date(date);
    if (task.deadline) {
        const currentDeadline = new Date(task.deadline);
        newDate.setHours(currentDeadline.getHours(), currentDeadline.getMinutes());
    } else {
        newDate.setHours(9, 0, 0, 0);
    }
    updateDeadlineWithReminders(newDate.getTime());
    setShowCalendar(false);
  };

  const handleTimeChange = (date: Date) => {
      updateDeadlineWithReminders(date.getTime());
  };

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subTasks.map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    onUpdate({ ...task, subTasks: updatedSubtasks });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const newSt: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtask.trim(),
      isCompleted: false
    };
    onUpdate({ ...task, subTasks: [...task.subTasks, newSt] });
    setNewSubtask('');
  };

  const deleteSubtask = (subtaskId: string) => {
    onUpdate({ ...task, subTasks: task.subTasks.filter(st => st.id !== subtaskId) });
  };

  const handleAddTag = () => {
      if (newTag.trim()) {
          const tagName = newTag.trim();
          if (!availableTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
              onCreateTag(tagName);
          }
          
          if (!task.tags.includes(tagName)) {
             onUpdate({ ...task, tags: [...task.tags, tagName] });
          }
          setNewTag('');
          setIsTagInputVisible(false);
      }
  };

  const removeTag = (tagToRemove: string) => {
      onUpdate({ ...task, tags: task.tags.filter(t => t !== tagToRemove) });
  };

  const handleRecurrenceChange = (val: string) => {
      if (val === 'custom') {
          setIsCustomRecurrenceOpen(true);
      } else {
          onUpdate({ ...task, recurrence: val as any, recurrenceConfig: undefined });
      }
  };
  
  const saveCustomRecurrence = (config: CustomRecurrenceConfig) => {
      onUpdate({ 
          ...task, 
          recurrence: 'custom', 
          recurrenceConfig: config 
      });
      setIsCustomRecurrenceOpen(false);
  };

  // --- Reminder Logic ---
  const getReminderValue = () => {
    if (!task.reminders || task.reminders.length === 0) return 'never';
    if (!task.deadline) return 'custom'; // Should technically act as never if no deadline, but if reminders exist, it's custom.
    
    // Check closest match to predefined options
    const diff = task.deadline - task.reminders[0];
    const tolerance = 1000; // 1s tolerance

    if (Math.abs(diff) < tolerance) return '0';
    if (Math.abs(diff - 5 * 60 * 1000) < tolerance) return '5';
    if (Math.abs(diff - 10 * 60 * 1000) < tolerance) return '10';
    if (Math.abs(diff - 15 * 60 * 1000) < tolerance) return '15';
    if (Math.abs(diff - 30 * 60 * 1000) < tolerance) return '30';
    if (Math.abs(diff - 60 * 60 * 1000) < tolerance) return '60';
    
    return 'custom'; 
  };

  const handleReminderChange = (val: string) => {
      if (val === 'never') {
          onUpdate({ ...task, reminders: [] });
          return;
      }
      
      let baseDeadline = task.deadline;
      let updates: Partial<Task> = {};

      if (!baseDeadline) {
          // Fix: Auto-set deadline if missing so user can interact immediately
          const now = new Date();
          now.setHours(now.getHours() + 1, 0, 0, 0); // Default to start of next hour
          baseDeadline = now.getTime();
          updates.deadline = baseDeadline;
      }

      const offsetMinutes = parseInt(val);
      // Only update if it's a standard numeric option. 'custom' does nothing (placeholder)
      if (!isNaN(offsetMinutes)) {
          const newReminder = baseDeadline - (offsetMinutes * 60 * 1000);
          updates.reminders = [newReminder];
          onUpdate({ ...task, ...updates });
      }
  };

  const reminderOptions = [
      { value: 'never', label: t('reminder_option_never') },
      { value: '0', label: t('reminder_option_0') },
      { value: '5', label: t('reminder_option_5') },
      { value: '10', label: t('reminder_option_10') },
      { value: '15', label: t('reminder_option_15') },
      { value: '30', label: t('reminder_option_30') },
      { value: '60', label: t('reminder_option_60') },
  ];

  // Add custom option if the current value isn't standard
  if (getReminderValue() === 'custom') {
      reminderOptions.push({ value: 'custom', label: t('reminder_option_custom') });
  }

  const recurrenceOptions = [
    { value: 'none', label: t('no_repeat') },
    { value: 'daily', label: t('daily') },
    { value: 'weekdays', label: t('weekdays') },
    { value: 'weekly', label: t('weekly') },
    { value: 'monthly', label: t('monthly') },
    { value: 'yearly', label: t('yearly') },
    { value: 'custom', label: t('custom_recurrence') },
  ];
  
  const currentRecurrenceValue = isCustomRecurrenceOpen || task.recurrence === 'custom' ? 'custom' : (task.recurrence || 'none');
  const currentReminderValue = getReminderValue();

  const isActive = activeTaskId === task.id;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 relative">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onUpdate({ ...task, isCompleted: !task.isCompleted })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${task.isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                    <CheckSquare size={16} />
                    {task.isCompleted ? t('completed') : 'Mark Complete'}
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                 <button 
                    onClick={() => onToggleTimer(isActive ? null : task.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100'}`}
                >
                    {isActive ? <Pause size={16} /> : <Play size={16} />}
                    {isActive ? t('pause_timer') : t('start_timer')}
                </button>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => onDelete(task.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Trash2 size={20} />
                </button>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <X size={20} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-white placeholder-slate-400"
                    placeholder={t('title')}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Folder size={14} /> {t('projects')}
                     </label>
                     <div className="relative">
                        <select 
                            value={task.projectId || ''}
                            onChange={(e) => onUpdate({ ...task, projectId: e.target.value || undefined })}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="">{t('none')}</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                </div>

                 <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Flag size={14} /> {t('priority')}
                     </label>
                     <div className="flex bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                        {(['low', 'medium', 'high'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => onUpdate({ ...task, priority: p })}
                                className={`flex-1 text-xs font-medium py-1.5 rounded capitalize transition-all ${task.priority === p ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                            >
                                {t(p)}
                            </button>
                        ))}
                     </div>
                </div>

                <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Calendar size={14} /> {t('deadline')}
                     </label>
                     <div className="relative">
                        <button 
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`w-full text-left bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm flex items-center justify-between ${task.deadline ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
                        >
                            <span className="truncate">{task.deadline ? new Date(task.deadline).toLocaleDateString() + ' ' + new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : t('select_date_time')}</span>
                            {task.deadline && (
                                <div onClick={(e) => { e.stopPropagation(); onUpdate({ ...task, deadline: undefined }); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex-shrink-0">
                                    <X size={12} />
                                </div>
                            )}
                        </button>
                        
                        {showCalendar && (
                            <div className="absolute top-full left-0 mt-2 z-10 w-full sm:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 animate-in fade-in zoom-in-95">
                                <CalendarView 
                                    tasks={[]} 
                                    selectedDate={task.deadline ? new Date(task.deadline) : new Date()} 
                                    onSelectDate={handleDateSelect} 
                                    compact
                                />
                                {task.deadline && (
                                    <TimePicker date={new Date(task.deadline)} onChange={handleTimeChange} />
                                )}
                            </div>
                        )}
                     </div>
                </div>

                <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Bell size={14} /> {t('reminders')}
                     </label>
                     <div className="relative">
                        <select
                            value={currentReminderValue}
                            onChange={(e) => handleReminderChange(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                            {reminderOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                             <ChevronDown size={14} />
                        </div>
                     </div>
                </div>

                <div className="col-span-2">
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Repeat size={14} /> {t('repeat_task')}
                     </label>
                     <div className="relative">
                        <select
                            value={currentRecurrenceValue}
                            onChange={(e) => handleRecurrenceChange(e.target.value)}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                            {recurrenceOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                             <ChevronDown size={14} />
                        </div>

                         {(task.recurrence === 'custom' || isCustomRecurrenceOpen) && (
                             <button 
                                 onClick={() => setIsCustomRecurrenceOpen(true)}
                                 className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-500 z-10"
                                 title="Edit custom config"
                             >
                                 <Repeat size={12} />
                             </button>
                         )}

                         {isCustomRecurrenceOpen && (
                             <div className="absolute top-full left-0 mt-2 z-50">
                                 <div className="fixed inset-0 bg-black/5 z-40" onClick={() => setIsCustomRecurrenceOpen(false)}></div>
                                 <CustomRecurrenceEditor 
                                     initialConfig={task.recurrenceConfig}
                                     onSave={saveCustomRecurrence}
                                     onCancel={() => {
                                         setIsCustomRecurrenceOpen(false);
                                     }}
                                     t={t}
                                 />
                             </div>
                         )}
                     </div>
                </div>
            </div>

            <div>
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlignLeft size={14} /> {t('description')}
                 </label>
                 <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    placeholder={t('add_notes')}
                    className="w-full h-32 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                 />
            </div>

            <div>
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckSquare size={14} /> {t('subtasks')}
                 </label>
                 <div className="space-y-2">
                    {task.subTasks.map(st => (
                        <div key={st.id} className="flex items-center gap-2 group">
                             <button onClick={() => toggleSubtask(st.id)} className={`flex-shrink-0 ${st.isCompleted ? 'text-indigo-500' : 'text-slate-400'}`}>
                                 {st.isCompleted ? <CheckSquare size={16} /> : <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 rounded" />}
                             </button>
                             <span className={`flex-1 text-sm ${st.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                 {st.title}
                             </span>
                             <button onClick={() => deleteSubtask(st.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                                 <X size={14} />
                             </button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                        <Plus size={16} className="text-slate-400" />
                        <input 
                            type="text" 
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') addSubtask(); }}
                            placeholder={t('add_subtask_placeholder')}
                            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 dark:text-slate-200"
                        />
                    </div>
                 </div>
            </div>

            <div>
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <TagIcon size={14} /> {t('tags')}
                 </label>
                 <div className="flex flex-wrap gap-2">
                     {task.tags.map(tag => (
                         <div key={tag} className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                             #{tag}
                             <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={12} /></button>
                         </div>
                     ))}
                     
                     {isTagInputVisible ? (
                         <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-indigo-500">
                             <span className="text-slate-400 text-xs">#</span>
                             <input 
                                autoFocus
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') handleAddTag(); }}
                                onBlur={() => { if(!newTag) setIsTagInputVisible(false); else handleAddTag(); }}
                                className="w-20 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200"
                             />
                         </div>
                     ) : (
                         <button 
                            onClick={() => setIsTagInputVisible(true)}
                            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                         >
                             + {t('add')}
                         </button>
                     )}
                 </div>
            </div>
            
        </div>
    </div>
  );
};
