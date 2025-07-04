import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import GitHubRepoModal from './GitHubRepoModal';
import {
  Menu,
  X,
  Plus,
  BarChart3,
  Calendar,
  Settings,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Github,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import Timer from './Timer';

export default function Sidebar() {
  const { state, dispatch, createProject, deleteProject, connectGitHub, disconnectGitHub, selectGitHubRepo, syncToGitHub, checkAndImportTaskData } = useApp();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showGitHubToken, setShowGitHubToken] = useState(false);
  const [gitHubToken, setGitHubToken] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3B82F6');
  const [showGitHubRepoModal, setShowGitHubRepoModal] = useState(false);

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
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

  return (
    <div className={`fixed left-0 top-0 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ${
      state.sidebarCollapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {!state.sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">TaskFlow Pro</span>
              </div>
            )}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              {state.sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="p-4 border-b border-white/10">
          <Timer />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto">
          {!state.sidebarCollapsed && (
            <div className="p-4 space-y-6">
              {/* Workspace */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Workspace
                </h3>
                <nav className="space-y-2">
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_SELECTED_PROJECT', payload: null });
                      dispatch({ type: 'SET_VIEW_MODE', payload: 'tasks' });
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      state.selectedProject === null && state.viewMode === 'tasks'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>All Tasks</span>
                    <span className="ml-auto text-sm text-gray-500">
                      {state.tasks.filter(task => task.status !== 'completed').length}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_SELECTED_PROJECT', payload: 'analytics' });
                      dispatch({ type: 'SET_VIEW_MODE', payload: 'tasks' });
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      state.selectedProject === 'analytics'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics</span>
                  </button>
                  <button 
                    onClick={() => {
                      dispatch({ type: 'SET_VIEW_MODE', payload: 'calendar' });
                      dispatch({ type: 'SET_SELECTED_PROJECT', payload: 'calendar' });
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      state.viewMode === 'calendar' || state.selectedProject === 'calendar'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Calendar</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-700/50 text-gray-300 transition-colors">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </button>
                </nav>
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Projects
                  </h3>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-2">
                  {state.projects.map(project => {
                    const stats = getProjectStats(project.id);
                    return (
                      <div key={project.id} className="group flex items-center">
                        <button
                          onClick={() => {
                            dispatch({ type: 'SET_SELECTED_PROJECT', payload: project.id });
                            dispatch({ type: 'SET_VIEW_MODE', payload: 'tasks' });
                          }}
                          className={`flex-1 flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            state.selectedProject === project.id
                              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                              : 'hover:bg-gray-700/50 text-gray-300'
                          }`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="flex-1 text-left">{project.name}</span>
                          <span className="text-sm text-gray-500">
                            {stats.total}
                          </span>
                        </button>
                        {project.isDeletable && (
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 ml-2 hover:bg-red-600/20 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* New Project Form */}
                {showNewProject && (
                  <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateProject();
                        if (e.key === 'Escape') setShowNewProject(false);
                      }}
                      autoFocus
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        {colors.map(color => (
                          <button
                            key={color}
                            onClick={() => setNewProjectColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              newProjectColor === color ? 'border-white scale-110' : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowNewProject(false)}
                          className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateProject}
                          className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded transition-colors"
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
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              state.focusMode
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'hover:bg-gray-700/50 text-gray-300'
            }`}
          >
            {state.focusMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            {!state.sidebarCollapsed && <span>Focus Mode</span>}
          </button>
          
          {/* GitHub Integration */}
          {!state.sidebarCollapsed && state.github && (
            <div className="mt-4">
              {!state.github.isConnected ? (
                <>
                  {!showGitHubToken ? (
                    <button
                      onClick={() => setShowGitHubToken(true)}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-700/50 text-gray-300"
                    >
                      <Github className="w-5 h-5" />
                      <span>Connect GitHub</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="GitHub Personal Access Token"
                        value={gitHubToken}
                        onChange={(e) => setGitHubToken(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleConnectGitHub}
                          className="flex-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
                        >
                          Connect
                        </button>
                        <button
                          onClick={() => setShowGitHubToken(false)}
                          className="flex-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-green-400">
                    <Github className="w-4 h-4" />
                    <span className="text-sm">@{state.github.username}</span>
                  </div>
                  {state.github.selectedRepo && (
                    <div className="text-xs text-gray-400 px-2">
                      Repository: {state.github.selectedRepo.split('/')[1]}
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSyncFromGitHub}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sync</span>
                    </button>
                    <button
                      onClick={handleUploadToGitHub}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-green-400 text-sm transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setShowGitHubRepoModal(true)}
                    className="w-full px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-400 text-sm transition-colors"
                  >
                    Change Repository
                  </button>
                  <button
                    onClick={handleDisconnectGitHub}
                    className="w-full px-3 py-1 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 text-sm transition-colors"
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