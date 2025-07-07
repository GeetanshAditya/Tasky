export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'active' | 'completed' | 'overdue' | 'paused';
  dueDate?: Date;
  estimatedTime: number; // in minutes
  actualTime: number; // in minutes
  createdAt: Date;
  completedAt?: Date;
  overdueAt?: Date;
  parentId?: string;
  subtasks: Task[];
  tags: string[];
  isOverdue: boolean;
  pausedTime?: number; // accumulated paused time in seconds
  lastPausedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  completedCount: number;
  totalTime: number;
  createdAt: Date;
  isDeletable: boolean;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentTaskId: string | null;
  elapsedTime: number;
  startTime: Date | null;
  pausedTime: number;
  taskStartTime: Date | null;
  pausedTasks: { [taskId: string]: { elapsedTime: number; pausedAt: Date } };
}

export interface SyncStatus {
  isLoading: boolean;
  lastSync: Date | null;
  error: string | null;
}

export interface GitHubState {
  isConnected: boolean;
  token: string | null;
  username: string | null;
  selectedRepo: string | null;
  repositories: GitHubRepo[];
  syncStatus: SyncStatus;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  timer: TimerState;
  selectedProject: string | null;
  searchQuery: string;
  filterPriority: string;
  filterStatus: 'all' | 'todo' | 'active' | 'completed' | 'overdue' | 'paused';
  sidebarCollapsed: boolean;
  focusMode: boolean;
  selectedDate: Date | null;
  viewMode: 'tasks' | 'calendar';
  github: GitHubState;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  date: string;
}