import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types';
import { useLanguage } from '../contexts_temp/LanguageContext';

interface CalendarViewProps {
  tasks: Task[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  compact?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, selectedDate, onSelectDate, compact = false }) => {
  // State for the currently displayed month (not necessarily the selected date's month)
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const { language, t } = useLanguage();

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelectDate(today);
  };

  // Memoize task counts per day for performance
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(task => {
      if (!task.isCompleted && task.deadline) {
        const dateStr = new Date(task.deadline).toDateString();
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);

    // Empty slots for days before the 1st
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className={compact ? "h-8" : "h-10 sm:h-14"}></div>);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();
      const dateStr = date.toDateString();
      const hasTasks = taskCounts[dateStr] > 0;
      const count = taskCounts[dateStr];

      days.push(
        <button
          key={day}
          onClick={() => onSelectDate(date)}
          className={`
            relative w-full flex flex-col items-center justify-center rounded-lg transition-all
            ${compact ? 'h-8 text-xs' : 'h-10 sm:h-14'}
            ${isSelected
              ? 'bg-indigo-600 text-white shadow-md transform scale-105 z-10'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
            }
            ${isToday && !isSelected ? 'border border-indigo-500 text-indigo-500 font-semibold' : ''}
          `}
        >
          <span className={compact ? "text-xs" : "text-sm"}>{day}</span>

          {/* Task Indicator Dots */}
          {!compact && (
            <div className="flex gap-0.5 mt-1 h-1.5">
              {hasTasks && (
                <>
                  <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-indigo-500'}`}></div>
                  {count > 1 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-indigo-500'}`}></div>}
                  {count > 2 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-indigo-500'}`}></div>}
                </>
              )}
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`${compact ? '' : 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-6'} transition-colors`}>

      {/* Header */}
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
        <h2 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-slate-800 dark:text-slate-100 capitalize`}>
          {currentMonth.toLocaleDateString(language, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handleToday} className={`text-xs font-medium px-2 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${compact ? 'py-0.5' : 'py-1'}`}>
            {t('today_time')}
          </button>
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md shadow-sm transition-all">
              <ChevronLeft size={compact ? 16 : 18} />
            </button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md shadow-sm transition-all">
              <ChevronRight size={compact ? 16 : 18} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => (
          <div key={d} className={`text-center font-semibold text-slate-400 uppercase tracking-wider py-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
};