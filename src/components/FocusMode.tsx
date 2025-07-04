import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Clock, CheckCircle, Flag } from 'lucide-react';
import { Task } from '../types';

interface FocusModeProps {
  onClose: () => void;
}

export default function FocusMode({ onClose }: FocusModeProps) {
  const { state, updateTask, startTimer } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');

  // Get all incomplete tasks
  const getAllTasks = (tasks: Task[]): Task[] => {
    const result: Task[] = [];
    for (const task of tasks) {
      result.push(task);
      result.push(...getAllTasks(task.subtasks));
    }
    return result;
  };

  const incompleteTasks = getAllTasks(state.tasks).filter(
    task => task.status !== 'completed'
  );

  // Timer display effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.timer.isRunning && state.timer.currentTaskId === selectedTask?.id) {
        const elapsed = Math.floor((Date.now() - (state.timer.startTime?.getTime() || 0)) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setTimerDisplay(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.timer, selectedTask]);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    startTimer(task.id);
  };

  const handleCompleteTask = (task: Task) => {
    updateTask(task.id, { 
      status: 'completed',
      completedAt: new Date(),
    });
    setSelectedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const project = selectedTask ? state.projects.find(p => p.id === selectedTask.projectId) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto border border-gray-600/50 shadow-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <span>Focus Mode</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 md:p-3 hover:bg-gray-700/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Task List */}
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Select a task to focus on:</h3>
            <div className="space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
              {incompleteTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleTaskSelect(task)}
                  className={`w-full text-left p-3 md:p-4 rounded-xl border transition-all hover:bg-gray-700/30 ${
                    selectedTask?.id === task.id
                      ? 'border-purple-500/50 bg-purple-600/10'
                      : 'border-gray-600/50 bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate text-sm md:text-base">{task.title}</h4>
                      {task.description && (
                        <p className="text-gray-400 text-xs md:text-sm mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          <Flag className="w-3 h-3" />
                          <span className="capitalize">{task.priority}</span>
                        </div>
                        {project && (
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <span>{project.name}</span>
                          </div>
                        )}
                        {task.estimatedTime > 0 && (
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedTime}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {incompleteTasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-400">All tasks completed! 🎉</p>
                </div>
              )}
            </div>
          </div>

          {/* Timer Display */}
          <div className="flex flex-col items-center justify-center">
            {selectedTask ? (
              <div className="text-center">
                <div className="mb-6 md:mb-8">
                  <h4 className="text-xl md:text-2xl font-bold text-white mb-2">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="text-gray-400 text-sm md:text-base">{selectedTask.description}</p>
                  )}
                </div>

                {/* Large Timer Display */}
                <div className="mb-6 md:mb-8">
                  <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-purple-500/30 flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-4xl md:text-6xl font-mono font-bold text-white mb-2">
                        {timerDisplay}
                      </div>
                      <div className="text-gray-400 text-sm md:text-base">
                        {state.timer.isRunning && state.timer.currentTaskId === selectedTask.id
                          ? 'Timer Running'
                          : 'Ready to Start'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={() => handleCompleteTask(selectedTask)}
                    className="w-full px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">Mark Complete</span>
                  </button>
                  
                  {selectedTask.estimatedTime > 0 && (
                    <div className="text-center text-xs md:text-sm text-gray-400">
                      Estimated: {selectedTask.estimatedTime} minutes
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-gray-600/30 flex items-center justify-center bg-gray-800/30">
                  <div className="text-center">
                    <Clock className="w-12 h-12 md:w-16 md:h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-base md:text-lg">Select a task to begin</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}