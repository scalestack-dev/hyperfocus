
export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly';
}

export interface Project {
  id: string;
  title: string;
  color: string; // Hex code or Tailwind class
  icon: string; // Key for the icon map
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string; // Hex code
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}

export interface CustomList {
  id: string;
  title: string;
  tagFilter: string; // Tasks with this tag will appear in this list
  icon?: string;
}

export type RecurrenceType = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface CustomRecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  startDate: number; // timestamp
  weekDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface Task {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isArchived?: boolean; // New property to hide completed tasks from main views
  status: string; // Changed from fixed union to string to support custom columns
  timeSpent: number; // in milliseconds
  estimate?: number; // Time estimate in milliseconds
  createdAt: number;
  deadline?: number; // timestamp
  projectId?: string; // Link to a project
  tags: string[]; // Stores tag names
  subTasks: SubTask[];
  reminders: number[]; // Array of timestamps
  priority: 'low' | 'medium' | 'high';
  recurrence?: RecurrenceType;
  recurrenceConfig?: CustomRecurrenceConfig; // Advanced configuration
  lastActiveAt?: number; // Timestamp of when the timer was last running for this task
}

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  breatherDuration: number; // minutes
  roundsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export type ViewMode = 'inbox' | 'today' | 'scheduled' | 'kanban' | 'eisenhower' | 'archives' | 'focus' | 'ai' | 'settings' | 'project' | 'reports' | 'search';

export type Theme = 'light' | 'dark' | 'system';

export type Language = 'en' | 'fr' | 'de' | 'es';

export type SoundType = 'default' | 'retro' | 'soft' | 'custom';

export interface AppState {
  tasks: Task[];
  projects: Project[];
  tags: Tag[]; // Global list of tags with colors
  kanbanColumns: KanbanColumn[]; // Custom Kanban Columns
  eisenhowerLists: CustomList[]; // Custom lists for Eisenhower view
  activeTaskId: string | null;
  activeProjectId: string | null; // Currently selected project view
  activeSessionStartTime: number | null; // Timestamp when the current session started
  lastTimerSync: number | null; // Timestamp of the last successful tick/save
  viewMode: ViewMode;
  isSidebarOpen: boolean;
  editingTaskId: string | null; // For the detail view
  isProjectModalOpen: boolean; // For creating/editing projects
  editingProjectId: string | null; // If editing a specific project
  theme: Theme;
  notificationSound: SoundType;
  customSoundData: string | null; // Base64 string for custom audio
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  timestamp: number;
  groundingMetadata?: any; // Store search grounding data
}

export interface GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}
