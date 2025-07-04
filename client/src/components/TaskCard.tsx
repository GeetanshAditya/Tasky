import React, { useState } from 'react';
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
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'active': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500/50 bg-green-600/5';
      case 'active': return 'border-yellow-500/50 bg-yellow-600/5';
      case 'overdue': return 'border-red-500/50 bg-red-600/5';
      default: return 'border-gray-600/50';
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
    <div className={`bg-white/5 backdrop-blur-xl rounded-xl border transition-all hover:bg-white/10 ${
      isRunning ? 'border-purple-500/50 bg-purple-600/10' : 'border-white/20'
    } ${task.status === 'completed' ? 'opacity-60' : ''}`} 
    style={{ marginLeft: `${level * 24}px` }}>
      
      <div className="p-4">
        <div className="flex items-start space-x-4">
          {/* Status Toggle */}
          <button
            onClick={handleToggleComplete}
            className="mt-1 hover:scale-110 transition-transform"
          >
            {getStatusIcon(task.status)}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  rows={2}
                  placeholder="Task description..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {task.subtasks.length > 0 && (
                        <button
                          onClick={() => setShowSubtasks(!showSubtasks)}
                          className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                        >
                          {showSubtasks ? 
                            <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                      )}
                      <h3 className={`font-semibold text-white ${
                        task.status === 'completed' ? 'line-through text-gray-400' : ''
                      }`}>
                        {task.title}
                      </h3>
                    </div>
                    {task.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {task.status !== 'completed' && task.status !== 'active' && (
                      <button
                        onClick={handleStartTimer}
                        className="p-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-all"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-gray-800 border border-gray-600/50 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowAddSubtask(true);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Subtask</span>
                          </button>
                          <button
                            onClick={() => {
                              deleteTask(task.id);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-700 transition-colors text-left text-red-400"
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
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4">
                    {/* Priority */}
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      <Flag className="w-3 h-3" />
                      <span className="capitalize">{task.priority}</span>
                    </div>

                    {/* Project */}
                    {project && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                      </div>
                    )}

                    {/* Due Date */}
                    {task.dueDate && (
                      <div className={`flex items-center space-x-1 text-xs ${
                        isOverdue ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        <span>
                          {isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM d')}
                        </span>
                        {isOverdue && <AlertCircle className="w-3 h-3" />}
                      </div>
                    )}
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    {task.estimatedTime > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedTime}m est</span>
                      </div>
                    )}
                    {task.actualTime > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.actualTime}m actual</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {task.estimatedTime > 0 && task.actualTime > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((task.actualTime / task.estimatedTime) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          task.actualTime > task.estimatedTime
                            ? 'bg-gradient-to-r from-red-500 to-orange-500'
                            : 'bg-gradient-to-r from-purple-500 to-blue-500'
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
          <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Subtask title"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask();
                if (e.key === 'Escape') setShowAddSubtask(false);
              }}
              autoFocus
            />
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleAddSubtask}
                className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddSubtask(false)}
                className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subtasks */}
      {showSubtasks && task.subtasks.length > 0 && (
        <div className="space-y-2 pb-4">
          {task.subtasks.map(subtask => (
            <TaskCard key={subtask.id} task={subtask} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}