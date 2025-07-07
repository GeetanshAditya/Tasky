import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  Plus, 
  Download,
  BarChart3,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  Target,
  Zap,
  Pause,
} from 'lucide-react';
import { format } from 'date-fns';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import CalendarView from './CalendarView';

export default function TaskView() {
  const { state, dispatch, exportData } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const selectedProject = state.selectedProject 
    ? state.projects.find(p => p.id === state.selectedProject)
    : null;

  const getAllTasks = (tasks: any[]): any[] => {
    const result: any[] = [];
    for (const task of tasks) {
      result.push(task);
      result.push(...getAllTasks(task.subtasks));
    }
    return result;
  };

  const filteredTasks = useMemo(() => {
    let tasks = state.tasks;

    // Filter by project
    if (state.selectedProject) {
      tasks = tasks.filter(task => task.projectId === state.selectedProject);
    }

    // Filter by search query
    if (state.searchQuery) {
      
      // Return only top-level tasks that match or have matching subtasks
      tasks = tasks.filter(task => {
        const taskMatches = task.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(state.searchQuery.toLowerCase());
        const hasMatchingSubtask = getAllTasks(task.subtasks).some(subtask =>
          subtask.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          subtask.description.toLowerCase().includes(state.searchQuery.toLowerCase())
        );
        return taskMatches || hasMatchingSubtask;
      });
    }

    // Filter by priority
    if (state.filterPriority !== 'all') {
      tasks = tasks.filter(task => task.priority === state.filterPriority);
    }

    // Filter by status
    if (state.filterStatus !== 'all') {
      tasks = tasks.filter(task => task.status === state.filterStatus);
    }

    return tasks;
  }, [state.tasks, state.selectedProject, state.searchQuery, state.filterPriority, state.filterStatus]);

  const taskStats = useMemo(() => {
    const allTasks = getAllTasks(filteredTasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const todoTasks = allTasks.filter(task => task.status === 'todo').length;
    const activeTasks = allTasks.filter(task => task.status === 'active').length;
    const pausedTasks = allTasks.filter(task => task.status === 'paused').length;
    const overdueTasks = allTasks.filter(task => task.status === 'overdue').length;

    return {
      total: totalTasks,
      completed: completedTasks,
      todo: todoTasks,
      active: activeTasks,
      paused: pausedTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [filteredTasks]);

  const statusFilters = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Todo', value: 'todo' },
    { label: 'Active', value: 'active' },
    { label: 'Paused', value: 'paused' },
    { label: 'Completed', value: 'completed' },
    { label: 'Overdue', value: 'overdue' },
  ];

  const getViewTitle = () => {
    if (selectedProject) {
      return selectedProject.name;
    }
    return "Task Dashboard";
  };

  const getViewSubtitle = () => {
    if (selectedProject) {
      return `${taskStats.total} tasks in project`;
    }
    return format(new Date(), 'EEEE, MMMM d, yyyy');
  };

  const groupedTasks = useMemo(() => {
    const groups = {
      todo: filteredTasks.filter(task => task.status === 'todo'),
      active: filteredTasks.filter(task => task.status === 'active'),
      paused: filteredTasks.filter(task => task.status === 'paused'),
      completed: filteredTasks.filter(task => task.status === 'completed'),
      overdue: filteredTasks.filter(task => task.status === 'overdue'),
    };
    return groups;
  }, [filteredTasks]);

  if (state.viewMode === 'calendar' || state.selectedProject === 'calendar') {
    return <CalendarView />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-3 lg:p-6 border-b border-white/10 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 sm:mb-6 md:mb-4 lg:mb-6">
          <div className="animate-slide-in mb-3 lg:mb-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-7 md:h-7 lg:w-10 lg:h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-5 lg:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl md:text-xl lg:text-3xl font-bold text-white text-shadow">
                  {getViewTitle()}
                </h1>
                <p className="text-indigo-300 font-medium text-xs sm:text-sm md:text-xs lg:text-base">
                  {getViewSubtitle()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-2 lg:space-x-4">
            <div className="text-left sm:text-right bg-white/10 rounded-xl p-2 sm:p-3 md:p-2 lg:p-3 border border-white/20 w-full sm:w-auto">
              <div className="text-xs text-indigo-300 font-medium">Overall Progress</div>
              <div className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-white">
                {taskStats.total > 0 ? `${taskStats.completionRate}%` : '0%'}
              </div>
              <div className="text-xs text-gray-400">
                {taskStats.completed}/{taskStats.total} completed
              </div>
            </div>

            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={exportData}
                className="flex items-center space-x-1.5 px-3 sm:px-4 md:px-3 lg:px-4 py-2 glass rounded-xl transition-all duration-300 hover:scale-105 border border-white/20 card-hover flex-1 sm:flex-none justify-center"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                <span className="font-medium text-xs sm:text-sm md:text-xs lg:text-sm">Export</span>
              </button>

              <button
                onClick={() => dispatch({ type: 'SET_SELECTED_PROJECT', payload: 'analytics' })}
                className="flex items-center space-x-1.5 px-3 sm:px-4 md:px-3 lg:px-4 py-2 gradient-secondary rounded-xl transition-all duration-300 hover:scale-105 shadow-lg font-medium flex-1 sm:flex-none justify-center"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                <span className="text-xs sm:text-sm md:text-xs lg:text-sm">Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-2 lg:gap-4 mb-4 sm:mb-6 md:mb-4 lg:mb-6">
          <div className="glass rounded-xl border border-white/20 p-3 sm:p-4 md:p-3 lg:p-4 card-hover animate-fade-in">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-blue-400" />
              </div>
              <div className="text-xs gradient-primary text-transparent bg-clip-text font-bold px-1.5 py-0.5 bg-white/10 rounded-full">
                {taskStats.total}
              </div>
            </div>
            <div className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-white mb-0.5">{taskStats.total}</div>
            <div className="text-xs text-gray-400">Total Tasks</div>
          </div>

          <div className="glass rounded-xl border border-white/20 p-3 sm:p-4 md:p-3 lg:p-4 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Circle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-indigo-400" />
              </div>
              <div className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded-full">
                {taskStats.todo}
              </div>
            </div>
            <div className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-white mb-0.5">{taskStats.todo}</div>
            <div className="text-xs text-gray-400">To Do</div>
          </div>

          <div className="glass rounded-xl border border-white/20 p-3 sm:p-4 md:p-3 lg:p-4 card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-yellow-400" />
              </div>
              <div className="text-xs bg-yellow-500/20 text-yellow-300 font-bold px-1.5 py-0.5 rounded-full">
                {taskStats.active}
              </div>
            </div>
            <div className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-white mb-0.5">{taskStats.active}</div>
            <div className="text-xs text-gray-400">In Progress</div>
          </div>

          <div className="glass rounded-xl border border-white/20 p-3 sm:p-4 md:p-3 lg:p-4 card-hover animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-blue-400" />
              </div>
              <div className="text-xs bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded-full">
                {taskStats.paused}
              </div>
            </div>
            <div className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-white mb-0.5">{taskStats.paused}</div>
            <div className="text-xs text-gray-400">Paused</div>
          </div>

          <div className="glass rounded-xl border border-white/20 p-3 sm:p-4 md:p-3 lg:p-4 card-hover animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-green-400" />
              </div>
              <div className="text-xs bg-green-500/20 text-green-300 font-bold px-1.5 py-0.5 rounded-full">
                {taskStats.completed}
              </div>
            </div>
            <div className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-white mb-0.5">{taskStats.completed}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 sm:left-3 md:left-2.5 lg:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
              className="w-full pl-8 sm:pl-10 md:pl-8 lg:pl-10 pr-3 py-2 sm:py-3 md:py-2 lg:py-3 glass border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 text-xs sm:text-sm md:text-xs lg:text-sm"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 sm:px-4 md:px-3 lg:px-4 py-2 sm:py-3 md:py-2 lg:py-3 glass border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300 card-hover w-full md:w-auto justify-center"
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
              <span className="font-medium text-xs sm:text-sm md:text-xs lg:text-sm">Filters</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {filterDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 sm:w-48 glass border border-white/20 rounded-xl shadow-2xl z-50 animate-fade-in">
                {statusFilters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      dispatch({ type: 'SET_FILTER_STATUS', payload: filter.value as any });
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl font-medium text-xs sm:text-sm md:text-xs lg:text-sm ${
                      state.filterStatus === filter.value ? 'gradient-primary text-white' : 'text-gray-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-4 sm:px-6 md:px-4 lg:px-6 py-2 sm:py-3 md:py-2 lg:py-3 gradient-primary rounded-xl transition-all duration-300 hover:scale-105 shadow-lg font-bold justify-center"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
            <span className="text-xs sm:text-sm md:text-xs lg:text-sm">New Task</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-3 lg:p-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-8 lg:py-16 animate-fade-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-16 md:h-16 lg:w-20 lg:h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3">No tasks found</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 md:mb-4 lg:mb-6 text-sm sm:text-base md:text-sm lg:text-base">
              {state.searchQuery ? 'Try adjusting your search or filters' : 'Create your first task to get started'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 sm:px-6 md:px-4 lg:px-6 py-2 sm:py-3 md:py-2 lg:py-3 gradient-primary rounded-xl transition-all duration-300 hover:scale-105 shadow-lg font-bold"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
              <span className="text-xs sm:text-sm md:text-xs lg:text-sm">Create First Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 md:space-y-4 lg:space-y-8">
            {/* Todo Tasks */}
            {groupedTasks.todo.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-3 lg:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Circle className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4 text-blue-400" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-base lg:text-lg font-bold text-white">
                    To Do ({groupedTasks.todo.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                </div>
                <div className="space-y-2 sm:space-y-3 md:space-y-2 lg:space-y-3">
                  {groupedTasks.todo.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Active Tasks */}
            {groupedTasks.active.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-3 lg:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4 text-yellow-400" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-base lg:text-lg font-bold text-white">
                    In Progress ({groupedTasks.active.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
                </div>
                <div className="space-y-2 sm:space-y-3 md:space-y-2 lg:space-y-3">
                  {groupedTasks.active.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Paused Tasks */}
            {groupedTasks.paused.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-3 lg:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Pause className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4 text-blue-400" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-base lg:text-lg font-bold text-white">
                    Paused ({groupedTasks.paused.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                </div>
                <div className="space-y-2 sm:space-y-3 md:space-y-2 lg:space-y-3">
                  {groupedTasks.paused.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Tasks */}
            {groupedTasks.overdue.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-3 lg:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4 text-red-400" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-base lg:text-lg font-bold text-white">
                    Overdue ({groupedTasks.overdue.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-red-500/50 to-transparent"></div>
                </div>
                <div className="space-y-2 sm:space-y-3 md:space-y-2 lg:space-y-3">
                  {groupedTasks.overdue.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {groupedTasks.completed.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-3 lg:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4 text-green-400" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-base lg:text-lg font-bold text-white">
                    Completed ({groupedTasks.completed.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent"></div>
                </div>
                <div className="space-y-2 sm:space-y-3 md:space-y-2 lg:space-y-3">
                  {groupedTasks.completed.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-4 sm:bottom-6 md:bottom-4 lg:bottom-6 right-4 sm:right-6 md:right-4 lg:right-6 w-12 h-12 sm:w-14 sm:h-14 md:w-12 md:h-12 lg:w-14 lg:h-14 gradient-primary rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 animate-glow"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
      </button>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          projectId={state.selectedProject}
        />
      )}
    </div>
  );
}