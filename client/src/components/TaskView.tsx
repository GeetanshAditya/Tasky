import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Download, 
  Upload,
  BarChart3,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  List,
} from 'lucide-react';
import { format, isToday, isThisWeek, isPast } from 'date-fns';
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
      const allTasks = getAllTasks(tasks);
      const matchingTasks = allTasks.filter(task => 
        task.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
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

  const priorityFilters = [
    { label: 'All Priorities', value: 'all' },
    { label: 'High Priority', value: 'high' },
    { label: 'Medium Priority', value: 'medium' },
    { label: 'Low Priority', value: 'low' },
  ];

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
    return "All Tasks";
  };





  const getViewSubtitle = () => {
    if (selectedProject) {
      return `${taskStats.total} tasks`;
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
      <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {getViewTitle()}
            </h1>
            <p className="text-white/70">
              {getViewSubtitle()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-white/60">Progress</div>
              <div className="text-xl font-bold text-white">
                {taskStats.total > 0 ? `${taskStats.completed}/${taskStats.total} tasks ${taskStats.completionRate}%` : '0 tasks'}
              </div>
            </div>

            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/20"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <button
              onClick={() => dispatch({ type: 'SET_SELECTED_PROJECT', payload: 'analytics' })}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/50 rounded-xl transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/70">All</span>
              <div className="text-xs bg-white/20 px-2 py-1 rounded-full">{taskStats.total}</div>
            </div>
            <div className="text-2xl font-bold text-white">{taskStats.total}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/70">Todo</span>
              <div className="text-xs bg-blue-500/30 text-blue-200 px-2 py-1 rounded-full">{taskStats.todo}</div>
            </div>
            <div className="text-2xl font-bold text-white">{taskStats.todo}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/70">In Progress</span>
              <div className="text-xs bg-yellow-500/30 text-yellow-200 px-2 py-1 rounded-full">{taskStats.active}</div>
            </div>
            <div className="text-2xl font-bold text-white">{taskStats.active}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/70">Completed</span>
              <div className="text-xs bg-green-500/30 text-green-200 px-2 py-1 rounded-full">{taskStats.completed}</div>
            </div>
            <div className="text-2xl font-bold text-white">{taskStats.completed}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-sm"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <Filter className="w-4 h-4" />
              <span>All Priorities</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {filterDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg z-[9999]">
                {statusFilters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      dispatch({ type: 'SET_FILTER_STATUS', payload: filter.value as any });
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      state.filterStatus === filter.value ? 'bg-purple-600/30 text-purple-200' : 'text-white'
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
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl transition-colors shadow-lg text-white font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-6">
              {state.searchQuery ? 'Try adjusting your search or filters' : 'Create your first task to get started'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Todo Tasks */}
            {groupedTasks.todo.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Circle className="w-5 h-5 text-blue-400" />
                  <span>Todo ({groupedTasks.todo.length})</span>
                </h2>
                <div className="space-y-4">
                  {groupedTasks.todo.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Active Tasks */}
            {groupedTasks.active.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span>Active ({groupedTasks.active.length})</span>
                </h2>
                <div className="space-y-4">
                  {groupedTasks.active.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Tasks */}
            {groupedTasks.overdue.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span>Overdue ({groupedTasks.overdue.length})</span>
                </h2>
                <div className="space-y-4">
                  {groupedTasks.overdue.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {groupedTasks.completed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Completed ({groupedTasks.completed.length})</span>
                </h2>
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
      >
        <Plus className="w-6 h-6 text-white" />
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