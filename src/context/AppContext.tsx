import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, Task, Project, TimerState, TimeEntry, GitHubRepo } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, isAfter } from 'date-fns';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'actualTime' | 'subtasks' | 'isOverdue'>) => void;
  createSubtask: (parentId: string, task: Omit<Task, 'id' | 'createdAt' | 'actualTime' | 'subtasks' | 'parentId' | 'isOverdue'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  startTimer: (taskId: string) => void;
  pauseTimer: () => void;
  resumeTimer: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  createProject: (name: string, color: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getTimeEntries: () => TimeEntry[];
  exportData: () => void;
  importData: (jsonData: string) => void;
  getTasksForDate: (date: Date) => Task[];
  connectGitHub: (token: string) => Promise<boolean>;
  disconnectGitHub: () => void;
  selectGitHubRepo: (repoName: string) => Promise<void>;
  syncToGitHub: (showAlert?: boolean) => Promise<void>;
  checkAndImportTaskData: (token: string, repoFullName: string) => Promise<void>;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
}

type AppAction =
  | { type: 'CREATE_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'CREATE_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_TIMER'; payload: Partial<TimerState> }
  | { type: 'SET_SELECTED_PROJECT'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER_PRIORITY'; payload: string }
  | { type: 'SET_FILTER_STATUS'; payload: 'all' | 'todo' | 'active' | 'completed' | 'overdue' | 'paused' }
  | { type: 'SET_SELECTED_DATE'; payload: Date | null }
  | { type: 'SET_VIEW_MODE'; payload: 'tasks' | 'calendar' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'IMPORT_DATA'; payload: { tasks: Task[]; projects: Project[] } }
  | { type: 'SET_GITHUB_CONNECTION'; payload: { token: string; username: string; repositories: GitHubRepo[] } }
  | { type: 'DISCONNECT_GITHUB' }
  | { type: 'SELECT_GITHUB_REPO'; payload: string }
  | { type: 'TICK_TIMER' }
  | { type: 'CHECK_OVERDUE_TASKS' }
  | { type: 'SET_SYNC_STATUS'; payload: { isLoading: boolean; lastSync?: Date; error?: string } }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER'; payload: string };

const initialState: AppState = {
  tasks: [],
  projects: [
    {
      id: 'miscellaneous',
      name: 'Miscellaneous',
      color: '#10B981',
      taskCount: 0,
      completedCount: 0,
      totalTime: 0,
      createdAt: new Date(),
      isDeletable: false,
    },
  ],
  timer: {
    isRunning: false,
    isPaused: false,
    currentTaskId: null,
    elapsedTime: 0,
    startTime: null,
    pausedTime: 0,
    taskStartTime: null,
    pausedTasks: {},
  },
  selectedProject: null,
  searchQuery: '',
  filterPriority: 'all',
  filterStatus: 'all',
  sidebarCollapsed: false,
  focusMode: false,
  selectedDate: null,
  viewMode: 'tasks',
  github: {
    isConnected: false,
    token: null,
    username: null,
    selectedRepo: null,
    repositories: [],
    syncStatus: {
      isLoading: false,
      lastSync: null,
      error: null,
    },
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'CREATE_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: updateTaskRecursively(state.tasks, action.payload.id, action.payload.updates),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: deleteTaskRecursively(state.tasks, action.payload),
      };
    case 'CREATE_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? { ...project, ...action.payload.updates } : project
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        tasks: state.tasks.filter(task => task.projectId !== action.payload),
      };
    case 'SET_TIMER':
      return {
        ...state,
        timer: { ...state.timer, ...action.payload },
      };
    case 'PAUSE_TIMER':
      if (state.timer.isRunning && state.timer.currentTaskId) {
        const now = new Date();
        const currentElapsed = state.timer.elapsedTime;
        return {
          ...state,
          timer: {
            ...state.timer,
            isRunning: false,
            isPaused: true,
            pausedTasks: {
              ...state.timer.pausedTasks,
              [state.timer.currentTaskId]: {
                elapsedTime: currentElapsed,
                pausedAt: now,
              },
            },
          },
        };
      }
      return state;
    case 'RESUME_TIMER':
      const pausedTask = state.timer.pausedTasks[action.payload];
      if (pausedTask) {
        const { [action.payload]: removed, ...remainingPausedTasks } = state.timer.pausedTasks;
        return {
          ...state,
          timer: {
            ...state.timer,
            isRunning: true,
            isPaused: false,
            currentTaskId: action.payload,
            startTime: new Date(),
            elapsedTime: pausedTask.elapsedTime,
            pausedTime: pausedTask.elapsedTime * 1000,
            pausedTasks: remainingPausedTasks,
          },
        };
      }
      return state;
    case 'SET_SELECTED_PROJECT':
      return {
        ...state,
        selectedProject: action.payload,
      };
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };
    case 'SET_FILTER_PRIORITY':
      return {
        ...state,
        filterPriority: action.payload,
      };
    case 'SET_FILTER_STATUS':
      return {
        ...state,
        filterStatus: action.payload,
      };
    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload,
      };
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };
    case 'TOGGLE_FOCUS_MODE':
      return {
        ...state,
        focusMode: !state.focusMode,
      };
    case 'LOAD_STATE':
      return action.payload;
    case 'IMPORT_DATA':
      return {
        ...state,
        tasks: action.payload.tasks,
        projects: action.payload.projects,
      };
    case 'SET_GITHUB_CONNECTION':
      return {
        ...state,
        github: {
          isConnected: true,
          token: action.payload.token,
          username: action.payload.username,
          selectedRepo: null,
          repositories: action.payload.repositories,
          syncStatus: {
            isLoading: false,
            lastSync: null,
            error: null,
          },
        },
      };
    case 'DISCONNECT_GITHUB':
      return {
        ...state,
        github: {
          isConnected: false,
          token: null,
          username: null,
          selectedRepo: null,
          repositories: [],
          syncStatus: {
            isLoading: false,
            lastSync: null,
            error: null,
          },
        },
      };
    case 'SELECT_GITHUB_REPO':
      return {
        ...state,
        github: {
          ...state.github,
          selectedRepo: action.payload,
        },
      };
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        github: {
          ...state.github,
          syncStatus: {
            ...state.github.syncStatus,
            ...action.payload,
          },
        },
      };
    case 'TICK_TIMER':
      if (state.timer.isRunning && state.timer.startTime) {
        const now = new Date();
        const elapsedMs = now.getTime() - state.timer.startTime.getTime() + state.timer.pausedTime;
        return {
          ...state,
          timer: {
            ...state.timer,
            elapsedTime: Math.floor(elapsedMs / 1000),
          },
        };
      }
      return state;
    case 'CHECK_OVERDUE_TASKS':
      const now = new Date();
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.status === 'active' && task.dueDate && isAfter(now, task.dueDate) && !task.isOverdue) {
            return {
              ...task,
              status: 'overdue' as const,
              isOverdue: true,
              overdueAt: now,
            };
          }
          return task;
        }),
      };
    default:
      return state;
  }
}

function updateTaskRecursively(tasks: Task[], taskId: string, updates: Partial<Task>): Task[] {
  return tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, ...updates };
    }
    if (task.subtasks.length > 0) {
      return {
        ...task,
        subtasks: updateTaskRecursively(task.subtasks, taskId, updates),
      };
    }
    return task;
  });
}

function deleteTaskRecursively(tasks: Task[], taskId: string): Task[] {
  return tasks.filter(task => task.id !== taskId).map(task => ({
    ...task,
    subtasks: deleteTaskRecursively(task.subtasks, taskId),
  }));
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('taskflow-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const processedState = {
          ...parsed,
          tasks: parsed.tasks.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
            overdueAt: task.overdueAt ? new Date(task.overdueAt) : undefined,
            lastPausedAt: task.lastPausedAt ? new Date(task.lastPausedAt) : undefined,
          })),
          projects: parsed.projects.map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt),
          })),
          timer: {
            ...parsed.timer,
            startTime: parsed.timer.startTime ? new Date(parsed.timer.startTime) : null,
            taskStartTime: parsed.timer.taskStartTime ? new Date(parsed.timer.taskStartTime) : null,
            pausedTasks: parsed.timer.pausedTasks || {},
          },
          selectedDate: parsed.selectedDate ? new Date(parsed.selectedDate) : null,
          github: {
            ...parsed.github,
            syncStatus: {
              isLoading: false,
              lastSync: parsed.github?.syncStatus?.lastSync ? new Date(parsed.github.syncStatus.lastSync) : null,
              error: null,
            },
          },
        };
        dispatch({ type: 'LOAD_STATE', payload: processedState });
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('taskflow-state', JSON.stringify(state));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Timer tick effect
  useEffect(() => {
    if (state.timer.isRunning) {
      const interval = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.timer.isRunning]);

  // Check for overdue tasks every minute
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_OVERDUE_TASKS' });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'actualTime' | 'subtasks' | 'isOverdue'>) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
      actualTime: 0,
      subtasks: [],
      isOverdue: false,
    };
    dispatch({ type: 'CREATE_TASK', payload: newTask });
    // Auto-sync to GitHub after task creation
    setTimeout(() => syncToGitHub(false), 2000);
  };

  const createSubtask = (parentId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'actualTime' | 'subtasks' | 'parentId' | 'isOverdue'>) => {
    const newSubtask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
      actualTime: 0,
      subtasks: [],
      parentId,
      isOverdue: false,
    };
    
    const addSubtaskToParent = (tasks: Task[]): Task[] => {
      return tasks.map(task => {
        if (task.id === parentId) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtask],
          };
        }
        if (task.subtasks.length > 0) {
          return {
            ...task,
            subtasks: addSubtaskToParent(task.subtasks),
          };
        }
        return task;
      });
    };

    dispatch({ type: 'UPDATE_TASK', payload: { id: 'dummy', updates: {} } });
    // Update tasks with new subtask
    const updatedTasks = addSubtaskToParent(state.tasks);
    dispatch({ type: 'LOAD_STATE', payload: { ...state, tasks: updatedTasks } });
    // Auto-sync to GitHub after subtask creation
    setTimeout(() => syncToGitHub(false), 2000);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
    // Auto-sync to GitHub after task update
    setTimeout(() => syncToGitHub(false), 2000);
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
    // Auto-sync to GitHub after task deletion
    setTimeout(() => syncToGitHub(false), 2000);
  };

  const startTimer = (taskId: string) => {
    // Update task status to active
    updateTask(taskId, { status: 'active' });
    
    dispatch({
      type: 'SET_TIMER',
      payload: {
        isRunning: true,
        isPaused: false,
        currentTaskId: taskId,
        startTime: new Date(),
        taskStartTime: new Date(),
        elapsedTime: 0,
        pausedTime: 0,
      },
    });
  };

  const pauseTimer = () => {
    if (state.timer.isRunning && state.timer.currentTaskId) {
      updateTask(state.timer.currentTaskId, { 
        status: 'paused',
        pausedTime: state.timer.elapsedTime,
        lastPausedAt: new Date(),
      });
      dispatch({ type: 'PAUSE_TIMER' });
    }
  };

  const resumeTimer = (taskId: string) => {
    updateTask(taskId, { status: 'active' });
    dispatch({ type: 'RESUME_TIMER', payload: taskId });
  };

  const completeTask = (taskId: string) => {
    const currentTask = findTaskById(state.tasks, taskId);
    if (currentTask && state.timer.currentTaskId === taskId) {
      const additionalTime = Math.floor(state.timer.elapsedTime / 60);
      const completedAt = new Date();
      
      updateTask(taskId, {
        status: currentTask.isOverdue ? 'overdue' : 'completed',
        actualTime: currentTask.actualTime + additionalTime,
        completedAt,
      });

      dispatch({
        type: 'SET_TIMER',
        payload: {
          isRunning: false,
          isPaused: false,
          currentTaskId: null,
          elapsedTime: 0,
          startTime: null,
          taskStartTime: null,
          pausedTime: 0,
        },
      });
    }
  };

  const cancelTask = (taskId: string) => {
    updateTask(taskId, { status: 'todo' });
    
    if (state.timer.currentTaskId === taskId) {
      dispatch({
        type: 'SET_TIMER',
        payload: {
          isRunning: false,
          isPaused: false,
          currentTaskId: null,
          elapsedTime: 0,
          startTime: null,
          taskStartTime: null,
          pausedTime: 0,
        },
      });
    }
  };

  const createProject = (name: string, color: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      color,
      taskCount: 0,
      completedCount: 0,
      totalTime: 0,
      createdAt: new Date(),
      isDeletable: true,
    };
    dispatch({ type: 'CREATE_PROJECT', payload: newProject });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
  };

  const deleteProject = (id: string) => {
    const project = state.projects.find(p => p.id === id);
    if (project && project.isDeletable) {
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    }
  };

  const getTimeEntries = (): TimeEntry[] => {
    return state.tasks.flatMap(task => {
      if (task.actualTime > 0) {
        return [{
          id: uuidv4(),
          taskId: task.id,
          startTime: task.createdAt,
          endTime: task.completedAt || new Date(),
          duration: task.actualTime,
          date: format(task.createdAt, 'yyyy-MM-dd'),
        }];
      }
      return [];
    });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `taskflow-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (jsonData: string) => {
    try {
      const parsedData = JSON.parse(jsonData);
      
      // Validate that the data has the required structure
      if (parsedData.tasks && parsedData.projects) {
        // Convert date strings back to Date objects
        const tasks = parsedData.tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          overdueAt: task.overdueAt ? new Date(task.overdueAt) : undefined,
          lastPausedAt: task.lastPausedAt ? new Date(task.lastPausedAt) : undefined,
        }));
        
        const projects = parsedData.projects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
        }));
        
        dispatch({ type: 'IMPORT_DATA', payload: { tasks, projects } });
        
        // Update sync status
        dispatch({
          type: 'SET_SYNC_STATUS',
          payload: {
            isLoading: false,
            lastSync: new Date(),
            error: null,
          },
        });
      } else {
        throw new Error('Invalid file format');
      }
    } catch (error) {
      console.error('Import error:', error);
      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: {
          isLoading: false,
          error: 'Failed to import data. Invalid file format.',
        },
      });
      alert('Error reading file. Please check the file format and try again.');
    }
  };

  const connectGitHub = async (token: string): Promise<boolean> => {
    dispatch({
      type: 'SET_SYNC_STATUS',
      payload: { isLoading: true, error: null },
    });

    try {
      // Validate token format
      if (!token || token.length < 20) {
        throw new Error('Invalid token format');
      }

      // Get user info with timeout
      const userController = new AbortController();
      const userTimeout = setTimeout(() => userController.abort(), 10000);

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'TaskFlow-Pro',
        },
        signal: userController.signal,
      });

      clearTimeout(userTimeout);

      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          throw new Error('Invalid GitHub token. Please check your token and try again.');
        } else if (userResponse.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`GitHub API error: ${userResponse.status}`);
        }
      }

      const user = await userResponse.json();

      // Get repositories with timeout
      const reposController = new AbortController();
      const reposTimeout = setTimeout(() => reposController.abort(), 15000);

      const reposResponse = await fetch('https://api.github.com/user/repos?type=all&sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'TaskFlow-Pro',
        },
        signal: reposController.signal,
      });

      clearTimeout(reposTimeout);

      if (!reposResponse.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repositories = await reposResponse.json();

      dispatch({
        type: 'SET_GITHUB_CONNECTION',
        payload: {
          token,
          username: user.login,
          repositories: repositories.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            private: repo.private,
          })),
        },
      });

      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: {
          isLoading: false,
          error: null,
        },
      });

      return true;
    } catch (error: any) {
      console.error('GitHub connection error:', error);
      
      let errorMessage = 'Failed to connect to GitHub.';
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: {
          isLoading: false,
          error: errorMessage,
        },
      });

      alert(errorMessage);
      return false;
    }
  };

  const disconnectGitHub = () => {
    dispatch({ type: 'DISCONNECT_GITHUB' });
  };

  const selectGitHubRepo = async (repoName: string) => {
    dispatch({ type: 'SELECT_GITHUB_REPO', payload: repoName });
    if (state.github.token) {
      await checkAndImportTaskData(state.github.token, repoName);
    }
  };

  const checkAndImportTaskData = async (token: string, repoFullName: string) => {
    dispatch({
      type: 'SET_SYNC_STATUS',
      payload: { isLoading: true, error: null },
    });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://api.github.com/repos/${repoFullName}/contents/Task_details.json`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'TaskFlow-Pro',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const fileData = await response.json();
        const content = atob(fileData.content);
        importData(content);
        alert('✅ Task data imported successfully from GitHub!');
      } else if (response.status === 404) {
        // File doesn't exist, that's ok
        dispatch({
          type: 'SET_SYNC_STATUS',
          payload: {
            isLoading: false,
            error: null,
          },
        });
        console.log('Task_details.json not found in repository - this is normal for new setups');
      } else {
        throw new Error(`Failed to check repository: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Import check error:', error);
      
      let errorMessage = 'Failed to check for existing data.';
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout while checking repository.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: {
          isLoading: false,
          error: errorMessage,
        },
      });
    }
  };

  const syncToGitHub = async (showAlert: boolean = true) => {
    if (!state.github.isConnected || !state.github.token || !state.github.selectedRepo) {
      if (showAlert) {
        alert('❌ Please connect to GitHub and select a repository first.');
      }
      return;
    }

    // Prevent multiple simultaneous syncs
    if (state.github.syncStatus.isLoading) {
      if (showAlert) {
        alert('⏳ Sync already in progress. Please wait...');
      }
      return;
    }

    dispatch({
      type: 'SET_SYNC_STATUS',
      payload: { isLoading: true, error: null },
    });

    try {
      // Prepare data for sync
      const dataStr = JSON.stringify({
        ...state,
        github: {
          ...state.github,
          token: '[REDACTED]', // Don't sync the token
        },
      }, null, 2);
      
      const content = btoa(dataStr);

      // Check if file exists to get its SHA
      let sha = '';
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const existingFile = await fetch(`https://api.github.com/repos/${state.github.selectedRepo}/contents/Task_details.json`, {
          headers: {
            'Authorization': `token ${state.github.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'TaskFlow-Pro',
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (existingFile.ok) {
          const fileData = await existingFile.json();
          sha = fileData.sha;
        }
      } catch (error) {
        // File doesn't exist or other error, continue without SHA
        console.log('File does not exist or error checking:', error);
      }

      // Update or create file
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`https://api.github.com/repos/${state.github.selectedRepo}/contents/Task_details.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${state.github.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'TaskFlow-Pro',
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: `🔄 TaskFlow Pro sync - ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
          content: content,
          ...(sha && { sha }),
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub token expired or invalid. Please reconnect.');
        } else if (response.status === 403) {
          throw new Error('Permission denied. Check repository access or API rate limits.');
        } else if (response.status === 409) {
          throw new Error('Sync conflict. Repository was modified by another source.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Sync failed: ${errorData.message || response.status}`);
        }
      }

      // Success
      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: {
          isLoading: false,
          lastSync: new Date(),
          error: null,
        },
      });

      if (showAlert) {
        alert('✅ Successfully synced to GitHub!');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      
      let errorMessage = 'Failed to sync to GitHub.';
      if (error.name === 'AbortError') {
        errorMessage = 'Sync timeout. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: {
          isLoading: false,
          error: errorMessage,
        },
      });

      if (showAlert) {
        alert(`❌ ${errorMessage}`);
      }
    }
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getAllTasks(state.tasks).filter(task => 
      task.completedAt && format(task.completedAt, 'yyyy-MM-dd') === dateStr
    );
  };

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        createTask,
        createSubtask,
        updateTask,
        deleteTask,
        startTimer,
        pauseTimer,
        resumeTimer,
        completeTask,
        cancelTask,
        createProject,
        updateProject,
        deleteProject,
        getTimeEntries,
        exportData,
        importData,
        getTasksForDate,
        connectGitHub,
        disconnectGitHub,
        selectGitHubRepo,
        syncToGitHub,
        checkAndImportTaskData,
        enterFullscreen,
        exitFullscreen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function findTaskById(tasks: Task[], id: string): Task | null {
  for (const task of tasks) {
    if (task.id === id) return task;
    const found = findTaskById(task.subtasks, id);
    if (found) return found;
  }
  return null;
}

function getAllTasks(tasks: Task[]): Task[] {
  const result: Task[] = [];
  for (const task of tasks) {
    result.push(task);
    result.push(...getAllTasks(task.subtasks));
  }
  return result;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}