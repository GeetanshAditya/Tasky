import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  Clock, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Play,
  CheckCircle,
  Circle,
  AlertCircle,
  Flag,
  Plus,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  level?: number;
}

export default function TaskCard({ task, level = 0 }: TaskCardProps) {
  const { state, updateTask, deleteTask, startTimer, createSubtask } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const project = state.projects.find(p => p.id === task.projectId);
  const isRunning = state.timer.isRunning && state.timer.currentTaskId === task.id;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'active': return <Clock className="w-6 h-6 text-yellow-400" />;
      case 'overdue': return <AlertCircle className="w-6 h-6 text-red-400" />;
      default: return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const handleToggleComplete = () => {
    if (task.status === 'completed') {
      updateTask(task.id, { status: 'todo' });
    } else {
      updateTask(task.id, { 
        status: task.isOverdue ? 'overdue' : 'completed',
        completedAt: new Date(),
      });
    }
  };

  const handleSaveEdit = () => {
    updateTask(task.id, {
      title: editTitle,
      description: editDescription,
    });
    setIsEditing(false);
  };

  const handleStartTimer = () => {
    startTimer(task.id);
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      createSubtask(task.id, {
        title: newSubtaskTitle,
        description: '',
        projectId: task.projectId,
        priority: 'medium',
        status: 'todo',
        estimatedTime: 30,
        tags: [],
      });
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
    }
  };

  const isOverdue = task.dueDate && isPast(task.dueDate) && task.status !== 'completed';

  return (
    <div className={`glass rounded-xl border transition-all duration-300 card-hover animate-fade-in ${
      isRunning ? 'border-indigo-500/50 bg-indigo-500/10 animate-glow' : 'border-white/20'
    } ${task.status === 'completed' ? 'opacity-70' : ''}`} 
    style={{ marginLeft: `${level * 24}px` }}>
      
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Status Toggle */}
          <button
            onClick={handleToggleComplete}
            className="mt-1 hover:scale-110 transition-all duration-300"
          >
            {getStatusIcon(task.status)}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 glass border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 glass border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  rows={3}
                  placeholder="Task description..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2 gradient-primary rounded-lg transition-all duration-300 hover:scale-105 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {task.subtasks.length > 0 && (
                        <button
                          onClick={() => setShowSubtasks(!showSubtasks)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {showSubtasks ? 
                            <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                      )}
                      <h3 className={`text-lg font-bold text-white ${
                        task.status === 'completed' ? 'line-through text-gray-400' : ''
                      }`}>
                        {task.title}
                      </h3>
                      {isRunning && (
                        <div className="flex items-center space-x-2 px-3 py-1 gradient-primary rounded-full">
                          <Zap className="w-3 h-3 text-white" />
                          <span className="text-xs font-bold text-white">ACTIVE</span>
                        </div>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {task.status !== 'completed' && task.status !== 'active' && (
                      <button
                        onClick={handleStartTimer}
                        className="p-3 gradient-success rounded-xl transition-all duration-300 hover:scale-110 shadow-lg"
                      >
                        <Play className="w-4 h-4 text-white" />
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-44 glass border border-white/20 rounded-xl shadow-2xl z-20 animate-fade-in">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 transition-colors text-left first:rounded-t-xl"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit Task</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowAddSubtask(true);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Subtask</span>
                          </button>
                          <button
                            onClick={() => {
                              deleteTask(task.id);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 transition-colors text-left text-red-400 last:rounded-b-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {task.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-medium border border-indigo-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    {/* Priority */}
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                      <Flag className="w-3 h-3" />
                      <span className="capitalize">{task.priority}</span>
                    </div>

                    {/* Project */}
                    {project && (
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <div 
                          className="w-3 h-3 rounded-full shadow-lg"
                          style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}40` }}
                        />
                        <span className="font-medium">{project.name}</span>
                      </div>
                    )}

                    {/* Due Date */}
                    {task.dueDate && (
                      <div className={`flex items-center space-x-2 text-xs px-3 py-1 rounded-full ${
                        isOverdue ? 'text-red-400 bg-red-500/20 border border-red-500/30' : 'text-gray-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        <span className="font-medium">
                          {isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM d')}
                        </span>
                        {isOverdue && <AlertCircle className="w-3 h-3" />}
                      </div>
                    )}
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    {task.estimatedTime > 0 && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-lg">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{task.estimatedTime}m est</span>
                      </div>
                    )}
                    {task.actualTime > 0 && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-lg">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{task.actualTime}m actual</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {task.estimatedTime > 0 && task.actualTime > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="font-bold">{Math.round((task.actualTime / task.estimatedTime) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          task.actualTime > task.estimatedTime
                            ? 'gradient-danger'
                            : 'gradient-primary'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (task.actualTime / task.estimatedTime) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Subtask Form */}
        {showAddSubtask && (
          <div className="mt-6 p-4 glass rounded-xl border border-white/20 animate-fade-in">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Subtask title"
              className="w-full px-4 py-3 glass border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask();
                if (e.key === 'Escape') setShowAddSubtask(false);
              }}
              autoFocus
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddSubtask}
                className="px-6 py-2 gradient-primary rounded-lg transition-all duration-300 hover:scale-105 font-medium"
              >
                Add Subtask
              </button>
              <button
                onClick={() => setShowAddSubtask(false)}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subtasks */}
      {showSubtasks && task.subtasks.length > 0 && (
        <div className="space-y-3 pb-6">
          {task.subtasks.map(subtask => (
            <TaskCard key={subtask.id} task={subtask} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}