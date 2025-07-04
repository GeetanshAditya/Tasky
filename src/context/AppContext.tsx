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
  | { type: 'SET_FILTER_STATUS'; payload: 'all' | 'todo' | 'active' | 'completed' | 'overdue' }
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
  | { type: 'CHECK_OVERDUE_TASKS' };

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
    currentTaskId: null,
    elapsedTime: 0,
    startTime: null,
    pausedTime: 0,
    taskStartTime: null,
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
          })),
          projects: parsed.projects.map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt),
          })),
          timer: {
            ...parsed.timer,
            startTime: parsed.timer.startTime ? new Date(parsed.timer.startTime) : null,
            taskStartTime: parsed.timer.taskStartTime ? new Date(parsed.timer.taskStartTime) : null,
          },
          selectedDate: parsed.selectedDate ? new Date(parsed.selectedDate) : null,
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

  // Check for GitHub connection on app load
  useEffect(() => {
    const checkGitHubConnection = async () => {
      if (state.github.isConnected && state.github.token && state.github.selectedRepo) {
        // Try to import existing data on app load
        await checkAndImportTaskData(state.github.token, state.github.selectedRepo);
      }
    };

    checkGitHubConnection();
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
    setTimeout(() => syncToGitHub(false), 1000);
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
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
    // Auto-sync to GitHub after task update
    setTimeout(() => syncToGitHub(false), 1000);
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
    // Auto-sync to GitHub after task deletion
    setTimeout(() => syncToGitHub(false), 1000);
  };

  const startTimer = (taskId: string) => {
    // Update task status to active
    updateTask(taskId, { status: 'active' });
    
    dispatch({
      type: 'SET_TIMER',
      payload: {
        isRunning: true,
        currentTaskId: taskId,
        startTime: new Date(),
        taskStartTime: new Date(),
        elapsedTime: 0,
        pausedTime: 0,
      },
    });
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
        }));
        
        const projects = parsedData.projects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
        }));
        
        dispatch({ type: 'IMPORT_DATA', payload: { tasks, projects } });
      } else {
        alert('Invalid file format. Please select a valid TaskFlow export file.');
      }
    } catch (error) {
      alert('Error reading file. Please check the file format and try again.');
    }
  };

  const connectGitHub = async (token: string) => {
    try {
      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('Invalid token or failed to authenticate');
      }

      const user = await userResponse.json();

      // Get private repositories
      const reposResponse = await fetch('https://api.github.com/user/repos?type=private&sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

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

      // Don't automatically select a repo - let user choose through the modal
      return true;
    } catch (error) {
      alert('Failed to connect to GitHub. Please check your token and try again.');
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
    try {
      const response = await fetch(`https://api.github.com/repos/${repoFullName}/contents/Task_details.json`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const fileData = await response.json();
        const content = atob(fileData.content);
        importData(content);
        alert('Task data imported successfully from GitHub!');
      }
    } catch (error) {
      // File doesn't exist, that's ok
      console.log('Task_details.json not found in repository');
    }
  };

  const syncToGitHub = async (showAlert: boolean = true) => {
    if (!state.github.isConnected || !state.github.token || !state.github.selectedRepo) {
      if (showAlert) {
        alert('Please connect to GitHub and select a repository first.');
      }
      return;
    }

    try {
      const dataStr = JSON.stringify(state, null, 2);
      const content = btoa(dataStr);

      // Check if file exists to get its SHA
      let sha = '';
      try {
        const existingFile = await fetch(`https://api.github.com/repos/${state.github.selectedRepo}/contents/Task_details.json`, {
          headers: {
            'Authorization': `token ${state.github.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (existingFile.ok) {
          const fileData = await existingFile.json();
          sha = fileData.sha;
        }
      } catch (error) {
        // File doesn't exist, no problem
      }

      // Update or create file
      const response = await fetch(`https://api.github.com/repos/${state.github.selectedRepo}/contents/Task_details.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${state.github.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update TaskFlow data - ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
          content: content,
          ...(sha && { sha }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync to GitHub');
      }

      if (showAlert) {
        alert('Successfully synced to GitHub!');
      }
    } catch (error) {
      if (showAlert) {
        alert('Failed to sync to GitHub. Please try again.');
      }
    }
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getAllTasks(state.tasks).filter(task => 
      task.completedAt && format(task.completedAt, 'yyyy-MM-dd') === dateStr
    );
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