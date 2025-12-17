
import React, { useState, useMemo } from 'react';
import { Task, Project } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart3, DollarSign, Euro, JapaneseYen, PoundSterling, Clock, CheckCircle, ChevronDown, ChevronRight, Briefcase } from 'lucide-react';

interface ReportsProps {
  tasks: Task[];
  projects: Project[];
}

export const Reports: React.FC<ReportsProps> = ({ tasks, projects }) => {
  const { t } = useLanguage();
  const [hourlyRate, setHourlyRate] = useState<number>(() => {
    const saved = localStorage.getItem('hyperfocus-hourly-rate');
    return saved ? parseFloat(saved) : 50;
  });
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem('hyperfocus-currency') || 'USD';
  });
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const handleRateChange = (rate: number) => {
    setHourlyRate(rate);
    localStorage.setItem('hyperfocus-hourly-rate', rate.toString());
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('hyperfocus-currency', newCurrency);
  };

  const toggleProjectExpand = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  };

  const getCurrencyIcon = (curr: string, size: number) => {
    switch (curr) {
      case 'EUR': return <Euro size={size} className="text-emerald-500" />;
      case 'JPY': return <JapaneseYen size={size} className="text-emerald-500" />;
      case 'GBP': return <PoundSterling size={size} className="text-emerald-500" />;
      default: return <DollarSign size={size} className="text-emerald-500" />;
    }
  };

  const formatHours = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    return hours.toFixed(2) + 'h';
  };

  const formatDurationDetailed = (ms: number) => {
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
  };

  // Aggregation Logic
  const stats = useMemo(() => {
    let totalTime = 0;
    let completedCount = 0;
    const projectStats: Record<string, { time: number, tasks: Task[] }> = {};

    tasks.forEach(task => {
      totalTime += task.timeSpent;
      if (task.isCompleted) completedCount++;

      const pId = task.projectId || 'unassigned';
      if (!projectStats[pId]) {
        projectStats[pId] = { time: 0, tasks: [] };
      }
      projectStats[pId].time += task.timeSpent;
      projectStats[pId].tasks.push(task);
    });

    const totalEarnings = (totalTime / (1000 * 60 * 60)) * hourlyRate;

    // Sort projects by time spent (descending)
    const sortedProjectIds = Object.keys(projectStats).sort((a, b) => projectStats[b].time - projectStats[a].time);

    return {
      totalTime,
      totalEarnings,
      completedCount,
      projectStats,
      sortedProjectIds
    };
  }, [tasks, hourlyRate]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('reports_title')}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{t('reports_subtitle')}</p>
            </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            {getCurrencyIcon(currency, 16)}
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('hourly_rate')}:</span>
            <input 
                type="number" 
                min="0"
                step="1"
                value={hourlyRate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 ml-1"
            >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
            </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Time */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                <Clock size={20} />
                <span className="text-sm font-semibold uppercase tracking-wider">{t('total_hours')}</span>
            </div>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-auto">
                {formatHours(stats.totalTime)}
            </div>
             <div className="text-xs text-slate-400 mt-1">{formatDurationDetailed(stats.totalTime)}</div>
        </div>

        {/* Earnings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                {getCurrencyIcon(currency, 20)}
                <span className="text-sm font-semibold uppercase tracking-wider">{t('total_earnings')}</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-auto">
                {formatCurrency(stats.totalEarnings)}
            </div>
            <div className="text-xs text-slate-400 mt-1">@ {hourlyRate}/hr</div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                <CheckCircle size={20} />
                <span className="text-sm font-semibold uppercase tracking-wider">{t('tasks_completed')}</span>
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-auto">
                {stats.completedCount}
            </div>
             <div className="text-xs text-slate-400 mt-1">/ {tasks.length} total tasks</div>
        </div>
      </div>

      {/* Project Breakdown List */}
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Briefcase size={20} /> {t('project_breakdown')}
      </h3>
      
      <div className="space-y-4">
         {stats.sortedProjectIds.map(projectId => {
             const data = stats.projectStats[projectId];
             const project = projects.find(p => p.id === projectId);
             const title = project ? project.title : t('unassigned_project');
             const color = project ? project.color : '#94a3b8'; // slate-400 default
             const hours = data.time / (1000 * 60 * 60);
             const earnings = hours * hourlyRate;
             const isExpanded = expandedProjects.has(projectId);

             return (
                 <div key={projectId} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-all">
                     <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750"
                        onClick={() => toggleProjectExpand(projectId)}
                     >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-opacity-10" style={{ backgroundColor: `${color}20`, color: color }}>
                               {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
                                <p className="text-xs text-slate-500">{data.tasks.length} tasks</p>
                            </div>
                        </div>

                        <div className="text-right">
                             <div className="font-bold text-slate-800 dark:text-slate-100">{formatHours(data.time)}</div>
                             <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(earnings)}</div>
                        </div>
                     </div>

                     {/* Expanded Task List */}
                     {isExpanded && (
                         <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50">
                             <table className="w-full text-sm text-left">
                                 <thead className="text-xs text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                     <tr>
                                         <th className="px-6 py-3 font-semibold">{t('tasks')}</th>
                                         <th className="px-6 py-3 font-semibold text-right">{t('total_time')}</th>
                                         <th className="px-6 py-3 font-semibold text-right">{t('billable')}</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                     {data.tasks.sort((a,b) => b.timeSpent - a.timeSpent).map(task => {
                                         const taskHours = task.timeSpent / (1000 * 60 * 60);
                                         return (
                                             <tr key={task.id} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                                                 <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">
                                                     <div className="flex items-center gap-2">
                                                         {task.isCompleted && <CheckCircle size={14} className="text-emerald-500" />}
                                                         <span className={task.isCompleted ? 'line-through opacity-70' : ''}>{task.title}</span>
                                                     </div>
                                                 </td>
                                                 <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400 font-mono">
                                                     {formatDurationDetailed(task.timeSpent)}
                                                 </td>
                                                 <td className="px-6 py-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                                                     {formatCurrency(taskHours * hourlyRate)}
                                                 </td>
                                             </tr>
                                         );
                                     })}
                                 </tbody>
                             </table>
                             {data.tasks.length === 0 && (
                                 <div className="p-4 text-center text-slate-500 italic">No tasks tracked yet.</div>
                             )}
                         </div>
                     )}
                 </div>
             );
         })}

         {stats.sortedProjectIds.length === 0 && (
             <div className="text-center py-12 text-slate-500">
                 No data available to display reports. Start tracking time on tasks!
             </div>
         )}
      </div>
    </div>
  );
};
