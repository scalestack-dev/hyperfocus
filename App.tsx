
import React, { useState, useEffect, useCallback } from 'react';
import { Menu, LayoutDashboard, BrainCircuit, BarChart3, Settings as SettingsIcon, Search, X } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { Task, Project, Tag, AppState, ViewMode, KanbanColumn, CustomList } from './types';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { KanbanBoard } from './components/KanbanBoard';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { CalendarView } from './components/CalendarView';
import { Timer } from './components/Timer';
import { Reports } from './components/Reports';
import { AIChat } from './components/AIChat';
import { Settings } from './components/Settings';
import { TaskDetail } from './components/TaskDetail';
import { ProjectModal } from './components/ProjectModal';
import { TagModal } from './components/TagModal';
import { InAppNotification } from './components/InAppNotification';

const App = () => {
  const { t } = useLanguage();
  
  // State Initialization
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('hyperfocus-state');
    return saved ? JSON.parse(saved) : {
        tasks: [],
        projects: [],
        tags: [],
        kanbanColumns: [
            { id: 'todo', title: 'To Do', color: 'border-slate-400' },
            { id: 'in-progress', title: 'In Progress', color: 'border-blue-500' },
            { id: 'done', title: 'Done', color: 'border-emerald-500' }
        ],
        eisenhowerLists: [],
        activeTaskId: null,
        activeProjectId: null,
        activeSessionStartTime: null,
        lastTimerSync: null,
        viewMode: 'inbox',
        isSidebarOpen: true,
        editingTaskId: null,
        isProjectModalOpen: false,
        editingProjectId: null,
        theme: 'system',
        notificationSound: 'default',
        customSoundData: null
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeAlert, setActiveAlert] = useState<{title: string, body: string} | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('hyperfocus-state', JSON.stringify(state));
  }, [state]);

  // Theme Handling
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === 'dark' || (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [state.theme]);

  // PWA Install Prompt
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  // Handlers
  const toggleSidebar = () => setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  
  const setViewMode = (mode: ViewMode, projectId?: string) => {
      setState(prev => ({ 
          ...prev, 
          viewMode: mode, 
          activeProjectId: projectId || null,
          isSidebarOpen: window.innerWidth >= 1024 
      }));
  };

  const openProjectModal = (projectId: string | null) => {
      setState(prev => ({ ...prev, isProjectModalOpen: true, editingProjectId: projectId }));
  };

  const handleSaveProject = (project: Project) => {
      setState(prev => {
          const exists = prev.projects.find(p => p.id === project.id);
          return {
              ...prev,
              projects: exists ? prev.projects.map(p => p.id === project.id ? project : p) : [...prev.projects, project],
              isProjectModalOpen: false,
              editingProjectId: null
          };
      });
  };

  const handleDeleteProject = (projectId: string) => {
       setState(prev => ({
           ...prev,
           projects: prev.projects.filter(p => p.id !== projectId),
           tasks: prev.tasks.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t),
           isProjectModalOpen: false,
           editingProjectId: null
       }));
  };

  const openTagModal = (tag: Tag | null) => {
      setEditingTag(tag);
      setIsTagModalOpen(true);
  };

  const handleCreateTag = (tagName: string) => {
       const newTag: Tag = { id: crypto.randomUUID(), name: tagName, color: '#6366f1' };
       setState(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
  };

  const handleSaveTag = (tag: Tag) => {
       setState(prev => {
           const exists = prev.tags.find(t => t.id === tag.id);
           return {
               ...prev,
               tags: exists ? prev.tags.map(t => t.id === tag.id ? tag : t) : [...prev.tags, tag]
           };
       });
       setIsTagModalOpen(false);
       setEditingTag(null);
  };

  const handleDeleteTag = (tagId: string) => {
      setState(prev => ({
           ...prev,
           tags: prev.tags.filter(t => t.id !== tagId),
           tasks: prev.tasks.map(t => ({ ...t, tags: t.tags.filter(tg => {
               const tagObj = prev.tags.find(pt => pt.id === tagId);
               return tagObj ? tg !== tagObj.name : true; 
           })})) 
      }));
      setIsTagModalOpen(false);
      setEditingTag(null);
  };

  const addTasks = (newTasks: Partial<Task>[]) => {
      const tasksToAdd = newTasks.map(t => ({
          ...t,
          id: t.id || crypto.randomUUID(),
          createdAt: Date.now(),
          timeSpent: 0,
          isCompleted: false,
          tags: t.tags || [],
          subTasks: t.subTasks || [],
          reminders: t.reminders || [],
          priority: t.priority || 'medium',
          status: t.status || 'todo'
      } as Task));
      setState(prev => ({ ...prev, tasks: [...prev.tasks, ...tasksToAdd] }));
  };

  const toggleTask = (id: string) => {
      setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)
      }));
  };

  const deleteTask = (id: string) => {
      setState(prev => ({
          ...prev,
          tasks: prev.tasks.filter(t => t.id !== id),
          activeTaskId: prev.activeTaskId === id ? null : prev.activeTaskId
      }));
  };

  const setActiveTask = (id: string | null) => {
      setState(prev => {
          let tasks = prev.tasks;
          
          if (prev.activeTaskId && prev.activeSessionStartTime) {
              const now = Date.now();
              const duration = now - prev.activeSessionStartTime;
              tasks = tasks.map(t => t.id === prev.activeTaskId ? { ...t, timeSpent: t.timeSpent + duration } : t);
          }

          return {
              ...prev,
              tasks,
              activeTaskId: id,
              activeSessionStartTime: id ? Date.now() : null
          };
      });
  };

  const setEditingTask = (id: string | null) => setState(prev => ({ ...prev, editingTaskId: id }));

  const archiveTask = (id: string) => {
      setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === id ? { ...t, isArchived: true } : t)
      }));
  };

  const updateTask = (task: Task) => {
      setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === task.id ? task : t)
      }));
  };

  const addKanbanColumn = (title: string, color: string) => {
       const newCol: KanbanColumn = { id: crypto.randomUUID(), title, color };
       setState(prev => ({ ...prev, kanbanColumns: [...prev.kanbanColumns, newCol] }));
  };

  const deleteKanbanColumn = (id: string) => {
       setState(prev => ({ ...prev, kanbanColumns: prev.kanbanColumns.filter(c => c.id !== id) }));
  };

  const renameKanbanColumn = (id: string, newTitle: string) => {
       setState(prev => ({ ...prev, kanbanColumns: prev.kanbanColumns.map(c => c.id === id ? { ...c, title: newTitle } : c) }));
  };

  const reorderTask = (id: string, direction: 'up' | 'down', contextTaskIds: string[]) => {
       setState(prev => {
           // This is a naive implementation as real reordering often involves an order field.
           // For now we assume array order matters.
           // Since tasks are filtered, we can't easily swap in global state without a proper order index.
           // But let's try to swap in place if possible or leave it for future enhancement.
           return prev; 
       });
  };

  const addEisenhowerList = (title: string, tag: string) => {
       const newList: CustomList = { id: crypto.randomUUID(), title, tagFilter: tag };
       setState(prev => ({ ...prev, eisenhowerLists: [...prev.eisenhowerLists, newList] }));
  };

  const deleteEisenhowerList = (id: string) => {
       setState(prev => ({ ...prev, eisenhowerLists: prev.eisenhowerLists.filter(l => l.id !== id) }));
  };

  const renameEisenhowerList = (id: string, newTitle: string) => {
       setState(prev => ({ ...prev, eisenhowerLists: prev.eisenhowerLists.map(l => l.id === id ? { ...l, title: newTitle } : l) }));
  };

  const setTheme = (theme: any) => setState(prev => ({ ...prev, theme }));
  
  const updateSoundSettings = (type: any, data?: any) => {
      setState(prev => ({ ...prev, notificationSound: type, customSoundData: data !== undefined ? data : prev.customSoundData }));
  };

  const playNotificationSound = () => {
      // Logic to play sound based on state.notificationSound
      // Placeholder
  };

  // Timer Tick
  useEffect(() => {
      let interval: any;
      if (state.activeTaskId && state.activeSessionStartTime) {
          interval = setInterval(() => {
              setState(prev => {
                  if (!prev.activeTaskId || !prev.activeSessionStartTime) return prev;
                  const now = Date.now();
                  const elapsed = now - prev.activeSessionStartTime;
                  // We only update the active session start time to now to keep incrementing in small chunks?
                  // Or we accumulate timeSpent. A common pattern is to accumulate and reset start time.
                  return {
                      ...prev,
                      activeSessionStartTime: now,
                      tasks: prev.tasks.map(t => t.id === prev.activeTaskId ? { ...t, timeSpent: t.timeSpent + elapsed } : t)
                  };
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [state.activeTaskId]);

  // Global "Add Task" handler for sub-components
  useEffect(() => {
      (window as any).handleGlobalAddTask = (task: Partial<Task>) => addTasks([task]);
      return () => { (window as any).handleGlobalAddTask = undefined; };
  }, []);

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed.tasks)) {
        setState(prev => ({ 
            ...prev, 
            tasks: parsed.tasks,
            projects: Array.isArray(parsed.projects) ? parsed.projects : prev.projects,
            tags: Array.isArray(parsed.tags) ? parsed.tags : prev.tags,
            kanbanColumns: Array.isArray(parsed.kanbanColumns) ? parsed.kanbanColumns : prev.kanbanColumns,
            eisenhowerLists: Array.isArray(parsed.eisenhowerLists) ? parsed.eisenhowerLists : prev.eisenhowerLists
        }));
        alert(t('data_imported'));
      } else {
        alert(t('invalid_data'));
      }
    } catch (e) {
      alert(t('failed_parse'));
    }
  };

  const getFilteredTasks = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return state.tasks.filter(t => 
        (t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query)) ||
        t.subTasks.some(st => st.title.toLowerCase().includes(query)))
      );
    }

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndTs = todayEnd.getTime();

    switch (state.viewMode) {
      case 'inbox': 
        return state.tasks.filter(t => !t.isArchived && !t.deadline && !t.projectId);
      case 'today': 
        return state.tasks.filter(t => !t.isArchived && t.deadline && t.deadline <= todayEndTs);
      case 'scheduled':
        const start = new Date(calendarDate);
        start.setHours(0,0,0,0);
        const end = new Date(calendarDate);
        end.setHours(23,59,59,999);
        return state.tasks.filter(t => !t.isArchived && t.deadline && t.deadline >= start.getTime() && t.deadline <= end.getTime());
      case 'project':
        if (!state.activeProjectId) return [];
        return state.tasks.filter(t => !t.isArchived && t.projectId === state.activeProjectId);
      case 'archives': 
        return state.tasks.filter(t => t.isArchived);
      default: return state.tasks.filter(t => !t.isArchived);
    }
  };

  const archiveCompletedTasks = () => {
      const visibleTasks = getFilteredTasks();
      const completedIds = visibleTasks.filter(t => t.isCompleted).map(t => t.id);
      
      if (completedIds.length === 0) return;

      if (window.confirm(t('confirm_archive_completed'))) {
          setState(prev => ({
              ...prev,
              tasks: prev.tasks.map(t => completedIds.includes(t.id) ? { ...t, isArchived: true } : t)
          }));
      }
  };

  const filteredTasks = getFilteredTasks();
  const activeTask = state.tasks.find(t => t.id === state.activeTaskId) || null;
  const editingTask = state.tasks.find(t => t.id === state.editingTaskId) || null;
  const editingProject = state.projects.find(p => p.id === state.editingProjectId);
  const currentProject = state.activeProjectId ? state.projects.find(p => p.id === state.activeProjectId) : null;
  const isSearchActive = !!searchQuery.trim();
  const isTaskView = ['inbox', 'today', 'scheduled', 'archives', 'project'].includes(state.viewMode);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {activeAlert && (
         <InAppNotification 
            title={activeAlert.title} 
            body={activeAlert.body} 
            onClose={() => setActiveAlert(null)} 
         />
      )}

      {state.isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => toggleSidebar()}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar 
          currentView={state.viewMode} 
          onViewChange={setViewMode} 
          activeTask={activeTask}
          projects={state.projects}
          activeProjectId={state.activeProjectId}
          onAddProject={() => openProjectModal(null)}
          onEditProject={(id) => openProjectModal(id)}
          onInstall={handleInstallClick}
          showInstall={!!deferredPrompt}
          tags={state.tags}
          onSelectTag={(tag) => setSearchQuery(tag)}
          onAddTag={() => openTagModal(null)}
          onEditTag={(tagId) => {
             const tag = state.tags.find(t => t.id === tagId);
             if (tag) openTagModal(tag);
          }}
        />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-800/50 backdrop-blur-md shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden text-slate-600 dark:text-slate-300"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-semibold text-lg flex items-center gap-2 capitalize whitespace-nowrap">
              {state.viewMode === 'focus' && <><LayoutDashboard className="text-indigo-500 dark:text-indigo-400" size={20} /> {t('focus_mode')}</>}
              {state.viewMode === 'ai' && <><BrainCircuit className="text-pink-500 dark:text-pink-400" size={20} /> {t('ai_assistant')}</>}
              {state.viewMode === 'reports' && <><BarChart3 className="text-pink-500 dark:text-pink-400" size={20} /> {t('reports')}</>}
              {state.viewMode === 'settings' && <><SettingsIcon className="text-slate-500 dark:text-slate-400" size={20} /> {t('settings_sync')}</>}
            </h1>
          </div>

          <div className="flex-1 max-w-md mx-4 relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-slate-100 dark:bg-slate-700/50 border-none rounded-full py-2 pl-9 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200 outline-none"
              />
              {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                      <X size={14} />
                  </button>
              )}
          </div>
          
          {activeTask && state.viewMode !== 'focus' && (
            <div className="hidden sm:flex items-center gap-2 text-sm bg-white dark:bg-slate-800 py-1 px-3 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-50 animate-pulse" />
              <span className="truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-200">{activeTask.title}</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-0">
          {isSearchActive ? (
             <TaskList 
                tasks={filteredTasks} 
                projects={state.projects}
                currentProject={undefined}
                onAdd={addTasks} 
                onToggle={toggleTask} 
                onDelete={deleteTask}
                onPlay={setActiveTask}
                onEdit={setEditingTask}
                onArchive={archiveTask}
                activeTaskId={state.activeTaskId}
                viewMode="search"
              />
          ) : (
             <>
                {state.viewMode === 'kanban' && (
                  <KanbanBoard 
                     tasks={state.tasks.filter(t => !t.isArchived)} 
                     columns={state.kanbanColumns}
                     projects={state.projects}
                     availableTags={state.tags}
                     onUpdateTask={updateTask}
                     onEdit={setEditingTask}
                     onPlay={setActiveTask}
                     activeTaskId={state.activeTaskId}
                     onAddColumn={addKanbanColumn}
                     onDeleteColumn={deleteKanbanColumn}
                     onRenameColumn={renameKanbanColumn}
                     onDeleteTask={deleteTask}
                     onReorderTask={reorderTask}
                     onAdd={addTasks} 
                  />
                )}

                {state.viewMode === 'eisenhower' && (
                  <EisenhowerMatrix 
                     tasks={state.tasks.filter(t => !t.isArchived)} 
                     customLists={state.eisenhowerLists}
                     projects={state.projects}
                     availableTags={state.tags}
                     onUpdateTask={updateTask}
                     onEdit={setEditingTask}
                     onPlay={setActiveTask}
                     activeTaskId={state.activeTaskId}
                     onAddList={addEisenhowerList}
                     onDeleteList={deleteEisenhowerList}
                     onRenameList={renameEisenhowerList}
                     onDeleteTask={deleteTask}
                     onReorderTask={reorderTask}
                  />
                )}

                {state.viewMode === 'scheduled' && (
                   <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6">
                      <CalendarView 
                        tasks={state.tasks.filter(t => !t.isArchived)} 
                        selectedDate={calendarDate} 
                        onSelectDate={setCalendarDate} 
                      />
                   </div>
                )}

                {isTaskView && (
                  <TaskList 
                    tasks={filteredTasks} 
                    projects={state.projects}
                    currentProject={currentProject || undefined}
                    onAdd={addTasks} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask}
                    onPlay={setActiveTask}
                    onEdit={setEditingTask}
                    onArchive={archiveTask}
                    onArchiveCompleted={archiveCompletedTasks}
                    activeTaskId={state.activeTaskId}
                    viewMode={state.viewMode}
                    defaultDate={
                      state.viewMode === 'today' ? new Date() :
                      state.viewMode === 'scheduled' ? calendarDate : 
                      null
                    }
                  />
                )}

                {state.viewMode === 'focus' && (
                  <Timer 
                    activeTask={activeTask} 
                    onStop={() => setActiveTask(null)}
                    tasks={state.tasks.filter(t => !t.isCompleted && !t.isArchived)}
                    onSelectTask={setActiveTask}
                    sessionStartTime={state.activeSessionStartTime}
                  />
                )}

                {state.viewMode === 'reports' && (
                  <Reports 
                    tasks={state.tasks}
                    projects={state.projects}
                  />
                )}

                {state.viewMode === 'ai' && (
                  <AIChat />
                )}

                {state.viewMode === 'settings' && (
                  <Settings 
                    tasks={state.tasks}
                    onImport={importData}
                    currentTheme={state.theme}
                    onThemeChange={setTheme}
                    notificationSound={state.notificationSound}
                    customSoundData={state.customSoundData}
                    onUpdateSound={updateSoundSettings}
                    onPreviewSound={playNotificationSound}
                  />
                )}
             </>
          )}
        </div>

        {/* ... (Modals) ... */}
        {state.editingTaskId && editingTask && (
           <div className="absolute inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-sm">
              <div 
                className="w-full md:w-[500px] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-full shadow-2xl animate-in slide-in-from-right duration-200 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <TaskDetail 
                  task={editingTask} 
                  projects={state.projects}
                  availableTags={state.tags}
                  onUpdate={updateTask} 
                  onClose={() => setEditingTask(null)} 
                  activeTaskId={state.activeTaskId}
                  onToggleTimer={setActiveTask}
                  onDelete={deleteTask}
                  onCreateTag={handleCreateTag}
                />
              </div>
           </div>
        )}

        <ProjectModal 
          isOpen={state.isProjectModalOpen}
          project={editingProject}
          onClose={() => setState(prev => ({ ...prev, isProjectModalOpen: false, editingProjectId: null }))}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
        />

        <TagModal
           isOpen={isTagModalOpen}
           tag={editingTag}
           onClose={() => { setIsTagModalOpen(false); setEditingTag(null); }}
           onSave={handleSaveTag}
           onDelete={handleDeleteTag}
        />
      </main>
    </div>
  );
};

export default App;
