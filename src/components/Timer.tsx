
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, StopCircle, Clock, SkipForward, RotateCcw, Coffee, Settings2, X, Check, Wind, Droplets } from 'lucide-react';
import { Task, PomodoroSettings } from '../types';
import { useLanguage } from '../contexts_temp/LanguageContext';

interface TimerProps {
  activeTask: Task | null;
  tasks: Task[];
  onStop: () => void;
  onSelectTask: (id: string) => void;
  sessionStartTime: number | null;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak' | 'breather';

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  breatherDuration: 1,
  roundsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false
};

export const Timer: React.FC<TimerProps> = ({ activeTask, tasks, onStop, onSelectTask, sessionStartTime }) => {
  const { t } = useLanguage();

  // -- State --
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem('pomodoro-settings');
    const defaults = { ...DEFAULT_SETTINGS };
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new keys like breatherDuration are present
      return { ...defaults, ...parsed };
    }
    return defaults;
  });

  // Track the last active task ID to keep showing it during breaks
  const [lastActiveTaskId, setLastActiveTaskId] = useState<string | null>(null);

  // Use a ref for interval to clear it cleanly
  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTask) {
      setLastActiveTaskId(activeTask.id);
      setIsActive(true);
      // Sync mode to focus if we just selected a task
      if (mode !== 'focus') {
        // If user manually selected a task during a break, we switch to focus
        setMode('focus');
        setTimeLeft(settings.focusDuration * 60);
      }
    } else if (mode === 'focus' && isActive) {
      // If activeTask became null (stopped externally) but we thought we were active
      setIsActive(false);
    }
  }, [activeTask]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
  }, [settings]);

  // Audio Alarm
  const playAlarm = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Simple 3-tone chime
      playTone(660, ctx.currentTime, 0.2);
      playTone(880, ctx.currentTime + 0.2, 0.2);
      playTone(1100, ctx.currentTime + 0.4, 0.4);

      setTimeout(() => { if (ctx.state !== 'closed') ctx.close(); }, 1000);
    } catch (e) { console.error(e); }
  }, []);

  // -- Timer Logic --

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    let duration = 0;
    if (newMode === 'focus') duration = settings.focusDuration;
    else if (newMode === 'shortBreak') duration = settings.shortBreakDuration;
    else if (newMode === 'longBreak') duration = settings.longBreakDuration;
    else if (newMode === 'breather') duration = settings.breatherDuration || 1;

    setTimeLeft(duration * 60);
    endTimeRef.current = null; // Reset target time
  }, [settings]);

  const handleTimerComplete = useCallback(() => {
    playAlarm();

    if (mode === 'focus') {
      const newRounds = roundsCompleted + 1;
      setRoundsCompleted(newRounds);

      // Stop global tracking
      onStop();
      setIsActive(false);

      // Determine next break
      if (newRounds % settings.roundsBeforeLongBreak === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }

      // Auto-start break?
      if (settings.autoStartBreaks) {
        setIsActive(true);
      }
    } else if (mode === 'breather') {
      // Breather complete, prompt to continue or switch to focus
      setIsActive(false);
      // Optional: auto switch back to focus but paused
      switchMode('focus');
    } else {
      // Break finished, back to work
      switchMode('focus');
      // We don't auto-select task, user must click play, unless autoStartPomodoros is on
      // But we need a task to be active.
      if (settings.autoStartPomodoros && lastActiveTaskId) {
        onSelectTask(lastActiveTaskId);
      }
    }
  }, [mode, roundsCompleted, settings, onStop, switchMode, playAlarm, lastActiveTaskId, onSelectTask]);

  // Countdown Effect
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      intervalRef.current = window.setInterval(() => {
        if (!endTimeRef.current) return;
        const delta = Math.ceil((endTimeRef.current - Date.now()) / 1000);

        if (delta <= 0) {
          setTimeLeft(0);
          setIsActive(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          handleTimerComplete();
        } else {
          setTimeLeft(delta);
        }
      }, 200); // Check frequently for smoother UI, but logic relies on Date.now
    } else {
      endTimeRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, handleTimerComplete]);

  // -- Handlers --

  const toggleTimer = () => {
    if (isActive) {
      // Pause
      setIsActive(false);
      if (mode === 'focus') onStop(); // Pause global tracking
    } else {
      // Start
      if (mode === 'focus') {
        if (activeTask) {
          setIsActive(true);
        } else if (lastActiveTaskId) {
          onSelectTask(lastActiveTaskId); // This will trigger useEffect to set IsActive(true)
        } else {
          alert(t('select_task_below'));
        }
      } else {
        // Start Break / Breather
        setIsActive(true);
      }
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    onStop();
    if (mode === 'focus') {
      setRoundsCompleted(r => r + 1);
      switchMode((roundsCompleted + 1) % settings.roundsBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak');
    } else {
      switchMode('focus');
    }
  };

  const handleReset = () => {
    setIsActive(false);
    onStop();
    switchMode(mode); // Reset time to current mode default
  };

  const startBreather = () => {
    onStop(); // Stop any task tracking
    switchMode('breather');
    setIsActive(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate Progress for Circle
  const getTotalDuration = () => {
    if (mode === 'focus') return settings.focusDuration * 60;
    if (mode === 'shortBreak') return settings.shortBreakDuration * 60;
    if (mode === 'breather') return (settings.breatherDuration || 1) * 60;
    return settings.longBreakDuration * 60;
  };
  const totalDur = getTotalDuration();
  const progress = ((totalDur - timeLeft) / totalDur) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Render Logic
  const showTimerUI = (mode === 'focus' && (activeTask || lastActiveTaskId)) || mode !== 'focus';
  const taskTitle = activeTask?.title || (lastActiveTaskId ? tasks.find(t => t.id === lastActiveTaskId)?.title : t('select_task_below'));

  // Color Theme based on mode
  const themeColor = mode === 'focus'
    ? 'text-indigo-500 stroke-indigo-500'
    : mode === 'breather'
      ? 'text-cyan-500 stroke-cyan-500'
      : 'text-emerald-500 stroke-emerald-500';

  // Breathing Text Logic
  const getBreathingText = () => {
    if (mode !== 'breather') return t('working_on');
    // 8 second cycle: 4s inhale, 4s exhale
    const cycle = 8;
    const phase = timeLeft % cycle;
    return phase >= 4 ? t('inhale') : t('exhale');
  };

  // Suggestion Logic: Show if paused in focus mode and some time has elapsed
  const showBreatherSuggestion = mode === 'focus' && !isActive && timeLeft < (settings.focusDuration * 60) && timeLeft > 0;

  if (showSettings) {
    return (
      <div className="flex flex-col h-full p-6 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Settings2 /> {t('pomodoro_settings')}</h2>
          <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><X size={20} className="text-slate-600 dark:text-slate-200" /></button>
        </div>

        <div className="space-y-6 max-w-lg mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('focus')} ({t('minutes')})</label>
              <input type="number" value={settings.focusDuration} onChange={e => setSettings({ ...settings, focusDuration: Number(e.target.value) })} className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('breather')} ({t('minutes')})</label>
              <input type="number" value={settings.breatherDuration} onChange={e => setSettings({ ...settings, breatherDuration: Number(e.target.value) })} className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('short_break')} ({t('minutes')})</label>
              <input type="number" value={settings.shortBreakDuration} onChange={e => setSettings({ ...settings, shortBreakDuration: Number(e.target.value) })} className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('long_break')} ({t('minutes')})</label>
              <input type="number" value={settings.longBreakDuration} onChange={e => setSettings({ ...settings, longBreakDuration: Number(e.target.value) })} className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('rounds')} before Long Break</label>
            <input type="number" value={settings.roundsBeforeLongBreak} onChange={e => setSettings({ ...settings, roundsBeforeLongBreak: Number(e.target.value) })} className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-slate-700 dark:text-slate-300">Auto-start Breaks</span>
            <button onClick={() => setSettings({ ...settings, autoStartBreaks: !settings.autoStartBreaks })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoStartBreaks ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoStartBreaks ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-slate-700 dark:text-slate-300">Auto-start Pomodoros</span>
            <button onClick={() => setSettings({ ...settings, autoStartPomodoros: !settings.autoStartPomodoros })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoStartPomodoros ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoStartPomodoros ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <button onClick={() => { setShowSettings(false); switchMode(mode); }} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors">
            {t('save_project')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative">

        {/* Top Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            <Settings2 />
          </button>
        </div>

        {showTimerUI ? (
          <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center w-full">

            {/* Mode Tabs */}
            <div className="flex gap-2 mb-8 bg-slate-200 dark:bg-slate-800 p-1 rounded-full overflow-x-auto max-w-full">
              <button onClick={() => switchMode('focus')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${mode === 'focus' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                {t('focus')}
              </button>
              <button onClick={() => switchMode('shortBreak')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${mode === 'shortBreak' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {t('short_break')}
              </button>
              <button onClick={() => switchMode('longBreak')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${mode === 'longBreak' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {t('long_break')}
              </button>
            </div>

            {/* Circular Timer */}
            <div className="relative w-72 h-72 md:w-80 md:h-80 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                  cx="50%" cy="50%" r={radius}
                  stroke="currentColor" strokeWidth="8"
                  fill="transparent"
                  className="text-slate-200 dark:text-slate-800"
                />
                {/* Progress Circle */}
                <circle
                  cx="50%" cy="50%" r={radius}
                  stroke="currentColor" strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`${themeColor} transition-all duration-1000 ease-linear`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {mode === 'breather' ? (
                  <div className="animate-pulse flex flex-col items-center">
                    <Wind size={48} className="text-cyan-500 mb-4 opacity-80" />
                    <div className="text-4xl md:text-5xl font-light text-slate-800 dark:text-slate-100 mb-2">
                      {getBreathingText()}
                    </div>
                  </div>
                ) : (
                  <div className="text-6xl md:text-7xl font-mono font-bold text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums">
                    {formatTime(timeLeft)}
                  </div>
                )}

                <div className="mt-2 text-slate-500 font-medium uppercase tracking-widest text-sm flex items-center gap-2">
                  {mode === 'focus' ? <Clock size={16} /> : mode === 'breather' ? <Droplets size={16} /> : <Coffee size={16} />}
                  {mode === 'focus' ? t('working_on') : mode === 'breather' ? t('hydrate') : 'Break Time'}
                </div>
              </div>
            </div>

            {mode === 'focus' && (
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2 max-w-lg leading-tight truncate px-4">
                {taskTitle}
              </h1>
            )}

            {mode === 'focus' && <p className="text-slate-500 mb-8 text-sm">#{roundsCompleted + 1} {t('rounds')}</p>}
            {mode !== 'focus' && <div className="mb-8 h-6" />} {/* Spacer */}

            {/* Breather Suggestion Banner */}
            {showBreatherSuggestion && (
              <div className="mb-6 px-4 py-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-bottom-2">
                <div className="p-2 bg-white dark:bg-cyan-900/50 rounded-full text-cyan-600 dark:text-cyan-400">
                  <Wind size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('breather_suggestion')}</div>
                  <div className="text-xs text-slate-500">{t('take_breather')} (1m)</div>
                </div>
                <button
                  onClick={startBreather}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Start
                </button>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTimer}
                className={`w-16 h-16 flex items-center justify-center rounded-full text-white shadow-lg transform active:scale-95 transition-all ${mode === 'focus' ? 'bg-indigo-600 hover:bg-indigo-500' :
                    mode === 'breather' ? 'bg-cyan-600 hover:bg-cyan-500' :
                      'bg-emerald-600 hover:bg-emerald-500'
                  }`}
              >
                {isActive ? <Pause size={32} className="fill-current" /> : <Play size={32} className="fill-current ml-1" />}
              </button>

              <button
                onClick={handleSkip}
                className="p-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title={t('skip')}
              >
                <SkipForward size={24} />
              </button>

              <button
                onClick={handleReset}
                className="p-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title={t('reset')}
              >
                <RotateCcw size={24} />
              </button>

              {/* Explicit Breather Button (Always available in Focus mode) */}
              {mode === 'focus' && !showBreatherSuggestion && (
                <button
                  onClick={startBreather}
                  className="p-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-800/50 transition-colors"
                  title={t('take_breather')}
                >
                  <Wind size={24} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-md w-full animate-in slide-in-from-bottom duration-300">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <StopCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('ready_to_focus')}</h2>
              <p className="text-slate-500 dark:text-slate-400">{t('select_task_below')}</p>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg dark:shadow-none">
              <div className="max-h-[400px] overflow-y-auto">
                {tasks.filter(t => !t.isCompleted).length > 0 ? (
                  tasks.filter(t => !t.isCompleted).map(task => (
                    <button
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className="w-full text-left p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-4">{task.title}</span>
                      <div className="p-2 rounded-full bg-indigo-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={16} className="fill-current ml-0.5" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    {t('no_active_tasks_avail')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
