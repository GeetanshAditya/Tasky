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
    const overdueTasks = allTasks.filter(task => task.status === 'overdue').length;

    return {
      total: totalTasks,
      completed: completedTasks,
      todo: todoTasks,
      active: activeTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [filteredTasks]);

  const statusFilters = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Todo', value: 'todo' },
    { label: 'Active', value: 'active' },
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
      <div className="p-8 border-b border-white/10 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-slide-in">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white text-shadow">
                  {getViewTitle()}
                </h1>
                <p className="text-indigo-300 font-medium">
                  {getViewSubtitle()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="text-sm text-indigo-300 font-medium">Overall Progress</div>
              <div className="text-2xl font-bold text-white">
                {taskStats.total > 0 ? `${taskStats.completionRate}%` : '0%'}
              </div>
              <div className="text-sm text-gray-400">
                {taskStats.completed}/{taskStats.total} completed
              </div>
            </div>

            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-6 py-3 glass rounded-xl transition-all duration-300 hover:scale-105 border border-white/20 card-hover"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Export</span>
            </button>

            <button
              onClick={() => dispatch({ type: 'SET_SELECTED_PROJECT', payload: 'analytics' })}
              className="flex items-center space-x-2 px-6 py-3 gradient-secondary rounded-xl transition-all duration-300 hover:scale-105 shadow-lg font-medium"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-xl border border-white/20 p-6 card-hover animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-xs gradient-primary text-transparent bg-clip-text font-bold px-3 py-1 bg-white/10 rounded-full">
                {taskStats.total}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{taskStats.total}</div>
            <div className="text-sm text-gray-400">Total Tasks</div>
          </div>

          <div className="glass rounded-xl border border-white/20 p-6 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Circle className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full">
                {taskStats.todo}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{taskStats.todo}</div>
            <div className="text-sm text-gray-400">To Do</div>
          </div>

          <div className="glass rounded-xl border border-white/20 p-6 card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-xs bg-yellow-500/20 text-yellow-300 font-bold px-3 py-1 rounded-full">
                {taskStats.active}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{taskStats.active}</div>
            <div className="text-sm text-gray-400">In Progress</div>
          </div>

          <div className="glass rounded-xl border border-white/20 p-6 card-hover animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-xs bg-green-500/20 text-green-300 font-bold px-3 py-1 rounded-full">
                {taskStats.completed}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{taskStats.completed}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
              className="w-full pl-12 pr-4 py-4 glass border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center space-x-2 px-6 py-4 glass border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300 card-hover"
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {filterDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 glass border border-white/20 rounded-xl shadow-2xl z-50 animate-fade-in">
                {statusFilters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      dispatch({ type: 'SET_FILTER_STATUS', payload: filter.value as any });
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl font-medium ${
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
            className="flex items-center space-x-2 px-8 py-4 gradient-primary rounded-xl transition-all duration-300 hover:scale-105 shadow-lg font-bold"
          >
            <Plus className="w-5 h-5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Zap className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No tasks found</h3>
            <p className="text-gray-400 mb-8 text-lg">
              {state.searchQuery ? 'Try adjusting your search or filters' : 'Create your first task to get started'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-8 py-4 gradient-primary rounded-xl transition-all duration-300 hover:scale-105 shadow-lg font-bold"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Todo Tasks */}
            {groupedTasks.todo.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Circle className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    To Do ({groupedTasks.todo.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                </div>
                <div className="space-y-4">
                  {groupedTasks.todo.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Active Tasks */}
            {groupedTasks.active.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    In Progress ({groupedTasks.active.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
                </div>
                <div className="space-y-4">
                  {groupedTasks.active.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Tasks */}
            {groupedTasks.overdue.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Overdue ({groupedTasks.overdue.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-red-500/50 to-transparent"></div>
                </div>
                <div className="space-y-4">
                  {groupedTasks.overdue.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {groupedTasks.completed.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Completed ({groupedTasks.completed.length})
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent"></div>
                </div>
                <div className="space-y-4">
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
        className="fixed bottom-8 right-8 w-16 h-16 gradient-primary rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 animate-glow"
      >
        <Plus className="w-8 h-8 text-white" />
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