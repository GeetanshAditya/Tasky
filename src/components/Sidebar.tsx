import { useState } from 'react';
import { useApp } from '../context/AppContext';
import GitHubRepoModal from './GitHubRepoModal';
import {
  Menu,
  X,
  Plus,
  BarChart3,
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Github,
  Upload,
  RefreshCw,
  Zap,
  Target,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import Timer from './Timer';
import { format } from 'date-fns';

export default function Sidebar() {
  const { state, dispatch, createProject, deleteProject, connectGitHub, disconnectGitHub, selectGitHubRepo, syncToGitHub, checkAndImportTaskData, enterFullscreen } = useApp();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showGitHubToken, setShowGitHubToken] = useState(false);
  const [gitHubToken, setGitHubToken] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6366f1');
  const [showGitHubRepoModal, setShowGitHubRepoModal] = useState(false);

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
  ];

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName, newProjectColor);
      setNewProjectName('');
      setShowNewProject(false);
    }
  };

  const getProjectStats = (projectId: string) => {
    const getAllTasks = (tasks: any[]): any[] => {
      const result: any[] = [];
      for (const task of tasks) {
        result.push(task);
        result.push(...getAllTasks(task.subtasks));
      }
      return result;
    };

    const allTasks = getAllTasks(state.tasks);
    const projectTasks = allTasks.filter(task => task.projectId === projectId);
    const completedTasks = projectTasks.filter(task => task.status === 'completed');
    return {
      total: projectTasks.length,
      completed: completedTasks.length,
    };
  };

  const handleDeleteProject = (projectId: string) => {
    const project = state.projects.find(p => p.id === projectId);
    if (project && project.isDeletable) {
      deleteProject(projectId);
    }
  };

  const handleConnectGitHub = async () => {
    if (gitHubToken.trim()) {
      const success = await connectGitHub(gitHubToken.trim());
      if (success) {
        setGitHubToken('');
        setShowGitHubToken(false);
        setShowGitHubRepoModal(true);
      }
    }
  };

  const handleDisconnectGitHub = () => {
    disconnectGitHub();
  };

  const handleSelectRepo = (repo: any) => {
    selectGitHubRepo(repo.full_name);
  };

  const handleSyncFromGitHub = async () => {
    if (state.github.isConnected && state.github.token && state.github.selectedRepo) {
      await checkAndImportTaskData(state.github.token, state.github.selectedRepo);
    } else {
      alert('Please connect to GitHub and select a repository first.');
    }
  };

  const handleUploadToGitHub = async () => {
    await syncToGitHub(true);
  };

  const getSyncStatusIcon = () => {
    if (state.github.syncStatus.isLoading) {
      return <Loader2 className="w-3 h-3 animate-spin text-blue-400" />;
    }
    if (state.github.syncStatus.error) {
      return <AlertCircle className="w-3 h-3 text-red-400" />;
    }
    if (state.github.syncStatus.lastSync) {
      return <CheckCircle2 className="w-3 h-3 text-green-400" />;
    }
    return <Github className="w-3 h-3 text-gray-400" />;
  };

  const getSyncStatusText = () => {
    if (state.github.syncStatus.isLoading) {
      return 'Syncing...';
    }
    if (state.github.syncStatus.error) {
      return 'Sync failed';
    }
    if (state.github.syncStatus.lastSync) {
      return `Last sync: ${format(state.github.syncStatus.lastSync, 'HH:mm')}`;
    }
    return 'Ready to sync';
  };

  return (
    <div className={`fixed left-0 top-0 h-full glass-dark border-r border-white/10 transition-all duration-500 ease-in-out z-40 ${
      state.sidebarCollapsed ? 'w-16' : 'w-64 sm:w-72 md:w-64 lg:w-72 xl:w-80'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-3 lg:p-4 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
          <div className="flex items-center justify-between">
            {!state.sidebarCollapsed && (
              <div className="flex items-center space-x-2 sm:space-x-3 animate-slide-in">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-7 md:h-7 lg:w-8 lg:h-8 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg md:text-sm lg:text-lg font-bold text-white text-shadow">TaskFlow Pro</h1>
                  <p className="text-xs text-indigo-300 hidden sm:block md:hidden lg:block">Productivity Dashboard</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <button
                onClick={enterFullscreen}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
                title="Enter Fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-indigo-300" />
              </button>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
              >
                {state.sidebarCollapsed ? <Menu className="w-4 h-4 text-indigo-300" /> : <X className="w-4 h-4 text-indigo-300" />}
              </button>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="p-2 sm:p-3 md:p-2 lg:p-3 border-b border-white/10">
          <Timer />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto">
          {!state.sidebarCollapsed && (
            <div className="p-2 sm:p-3 md:p-2 lg:p-3 space-y-4 sm:space-y-6 md:space-y-4 lg:space-y-6">
              {/* Workspace */}
              <div className="animate-fade-in">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 sm:mb-3 md:mb-2 lg:mb-3 flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  Workspace
                </h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_SELECTED_PROJECT', payload: null });
                      dispatch({ type: 'SET_VIEW_MODE', payload: 'tasks' });
                    }}
                    className={`w-full flex items-center space-x-2 px-2 sm:px-3 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 rounded-xl transition-all duration-300 card-hover ${
                      state.selectedProject === null && state.viewMode === 'tasks'
                        ? 'gradient-primary text-white shadow-lg border-gradient'
                        : 'hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                    <span className="font-medium text-xs sm:text-sm md:text-xs lg:text-sm">All Tasks</span>
                    <span className="ml-auto text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                      {state.tasks.filter(task => task.status !== 'completed').length}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_SELECTED_PROJECT', payload: 'analytics' });
                      dispatch({ type: 'SET_VIEW_MODE', payload: 'tasks' });
                    }}
                    className={`w-full flex items-center space-x-2 px-2 sm:px-3 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 rounded-xl transition-all duration-300 card-hover ${
                      state.selectedProject === 'analytics'
                        ? 'gradient-secondary text-white shadow-lg border-gradient'
                        : 'hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                    <span className="font-medium text-xs sm:text-sm md:text-xs lg:text-sm">Analytics</span>
                  </button>
                  <button 
                    onClick={() => {
                      dispatch({ type: 'SET_VIEW_MODE', payload: 'calendar' });
                      dispatch({ type: 'SET_SELECTED_PROJECT', payload: 'calendar' });
                    }}
                    className={`w-full flex items-center space-x-2 px-2 sm:px-3 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 rounded-xl transition-all duration-300 card-hover ${
                      state.viewMode === 'calendar' || state.selectedProject === 'calendar'
                        ? 'gradient-warning text-white shadow-lg border-gradient'
                        : 'hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                    <span className="font-medium text-xs sm:text-sm md:text-xs lg:text-sm">Calendar</span>
                  </button>
                </nav>
              </div>

              {/* Projects */}
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-2 lg:mb-3">
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    Projects
                  </h3>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110"
                  >
                    <Plus className="w-3 h-3 text-indigo-300" />
                  </button>
                </div>
                <div className="space-y-1">
                  {state.projects.map(project => {
                    const stats = getProjectStats(project.id);
                    return (
                      <div key={project.id} className="group flex items-center">
                        <button
                          onClick={() => {
                            dispatch({ type: 'SET_SELECTED_PROJECT', payload: project.id });
                            dispatch({ type: 'SET_VIEW_MODE', payload: 'tasks' });
                          }}
                          className={`flex-1 flex items-center space-x-2 px-2 sm:px-3 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 rounded-xl transition-all duration-300 card-hover ${
                            state.selectedProject === project.id
                              ? 'bg-white/10 text-white shadow-lg border border-white/20'
                              : 'hover:bg-white/5 text-gray-300 hover:text-white'
                          }`}
                        >
                          <div 
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full shadow-lg"
                            style={{ backgroundColor: project.color, boxShadow: `0 0 10px ${project.color}40` }}
                          />
                          <span className="flex-1 text-left font-medium text-xs sm:text-sm md:text-xs lg:text-sm truncate">{project.name}</span>
                          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                            {stats.total}
                          </span>
                        </button>
                        {project.isDeletable && (
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 ml-1 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* New Project Form */}
                {showNewProject && (
                  <div className="mt-2 sm:mt-3 md:mt-2 lg:mt-3 p-2 sm:p-3 md:p-2 lg:p-3 glass rounded-xl border border-white/20 animate-fade-in">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name"
                      className="w-full px-2 sm:px-3 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-xs sm:text-sm md:text-xs lg:text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateProject();
                        if (e.key === 'Escape') setShowNewProject(false);
                      }}
                      autoFocus
                    />
                    <div className="flex items-center justify-between mt-2 sm:mt-3 md:mt-2 lg:mt-3">
                      <div className="flex space-x-1">
                        {colors.map(color => (
                          <button
                            key={color}
                            onClick={() => setNewProjectColor(color)}
                            className={`w-4 h-4 sm:w-5 sm:h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 transition-all duration-300 hover:scale-110 ${
                              newProjectColor === color ? 'border-white scale-110 shadow-lg' : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: color, boxShadow: newProjectColor === color ? `0 0 15px ${color}60` : 'none' }}
                          />
                        ))}
                      </div>
                      <div className="flex space-x-1.5">
                        <button
                          onClick={() => setShowNewProject(false)}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateProject}
                          className="px-2 py-1 text-xs gradient-primary rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Focus Mode Toggle */}
        <div className="p-2 sm:p-3 md:p-2 lg:p-3 border-t border-white/10 bg-gradient-to-r from-purple-600/10 to-indigo-600/10">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
            className={`w-full flex items-center space-x-2 px-2 sm:px-3 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 rounded-xl transition-all duration-300 card-hover ${
              state.focusMode
                ? 'gradient-success text-white shadow-lg animate-glow'
                : 'hover:bg-white/10 text-gray-300 hover:text-white'
            }`}
          >
            {state.focusMode ? <Eye className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />}
            {!state.sidebarCollapsed && <span className="font-medium text-xs sm:text-sm md:text-xs lg:text-sm">Focus Mode</span>}
          </button>
          
          {/* GitHub Integration */}
          {!state.sidebarCollapsed && state.github && (
            <div className="mt-2 sm:mt-3 md:mt-2 lg:mt-3">
              {!state.github.isConnected ? (
                <>
                  {!showGitHubToken ? (
                    <button
                      onClick={() => setShowGitHubToken(true)}
                      className="w-full flex items-center space-x-2 px-2 sm:px-3 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 rounded-xl transition-all duration-300 hover:bg-white/10 text-gray-300 hover:text-white card-hover"
                    >
                      <Github className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                      <span className="font-medium text-xs sm:text-sm md:text-xs lg:text-sm">Connect GitHub</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-1.5 lg:space-y-2 animate-fade-in">
                      <input
                        type="password"
                        placeholder="GitHub Personal Access Token"
                        value={gitHubToken}
                        onChange={(e) => setGitHubToken(e.target.value)}
                        className="w-full px-2 sm:px-3 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs sm:text-sm md:text-xs lg:text-sm"
                        disabled={state.github.syncStatus.isLoading}
                      />
                      <div className="flex space-x-1.5">
                        <button
                          onClick={handleConnectGitHub}
                          disabled={state.github.syncStatus.isLoading}
                          className="flex-1 px-2 py-1 gradient-primary rounded-lg text-white text-xs transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {state.github.syncStatus.isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Connect'
                          )}
                        </button>
                        <button
                          onClick={() => setShowGitHubToken(false)}
                          disabled={state.github.syncStatus.isLoading}
                          className="flex-1 px-2 py-1 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg text-white text-xs transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1.5 sm:space-y-2 md:space-y-1.5 lg:space-y-2">
                  <div className="flex items-center space-x-1.5 text-green-400">
                    <Github className="w-3 h-3" />
                    <span className="text-xs font-medium">@{state.github.username}</span>
                  </div>
                  
                  {/* Sync Status */}
                  <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                    {getSyncStatusIcon()}
                    <span>{getSyncStatusText()}</span>
                  </div>
                  
                  {/* Error Display */}
                  {state.github.syncStatus.error && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                      {state.github.syncStatus.error}
                    </div>
                  )}
                  
                  {state.github.selectedRepo && (
                    <div className="text-xs text-gray-400 px-1">
                      Repository: {state.github.selectedRepo.split('/')[1]}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={handleSyncFromGitHub}
                      disabled={state.github.syncStatus.isLoading}
                      className="flex items-center justify-center space-x-1 px-1.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-xs transition-all duration-300 card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {state.github.syncStatus.isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      <span>Sync</span>
                    </button>
                    <button
                      onClick={handleUploadToGitHub}
                      disabled={state.github.syncStatus.isLoading}
                      className="flex items-center justify-center space-x-1 px-1.5 py-1 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-green-400 text-xs transition-all duration-300 card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {state.github.syncStatus.isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>Upload</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowGitHubRepoModal(true)}
                    disabled={state.github.syncStatus.isLoading}
                    className="w-full px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-400 text-xs transition-all duration-300 card-hover disabled:opacity-50"
                  >
                    Change Repository
                  </button>
                  
                  <button
                    onClick={handleDisconnectGitHub}
                    disabled={state.github.syncStatus.isLoading}
                    className="w-full px-2 py-1 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 text-xs transition-all duration-300 card-hover disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* GitHub Repository Modal */}
      <GitHubRepoModal
        isOpen={showGitHubRepoModal}
        onClose={() => setShowGitHubRepoModal(false)}
        repositories={state.github?.repositories || []}
        onSelectRepo={handleSelectRepo}
      />
    </div>
  );
}