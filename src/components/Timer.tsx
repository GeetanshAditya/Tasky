import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, X, Clock, Zap } from 'lucide-react';

export default function Timer() {
  const { state, completeTask, cancelTask } = useApp();
  const [notification, setNotification] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTask = () => {
    if (state.timer.currentTaskId) {
      return findTaskById(state.tasks, state.timer.currentTaskId);
    }
    return null;
  };

  const findTaskById = (tasks: any[], id: string): any => {
    for (const task of tasks) {
      if (task.id === id) return task;
      const found = findTaskById(task.subtasks, id);
      if (found) return found;
    }
    return null;
  };

  const currentTask = getCurrentTask();

  // Check for timer completion notifications
  useEffect(() => {
    if (currentTask && currentTask.estimatedTime > 0) {
      const estimatedSeconds = currentTask.estimatedTime * 60;
      if (state.timer.elapsedTime >= estimatedSeconds && state.timer.isRunning) {
        setNotification(`Time's up for "${currentTask.title}"!`);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('TaskFlow Pro', {
            body: `Time's up for "${currentTask.title}"!`,
            icon: '/favicon.ico',
          });
        }
      }
    }
  }, [state.timer.elapsedTime, currentTask, state.timer.isRunning]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleComplete = () => {
    if (currentTask) {
      completeTask(currentTask.id);
    }
  };

  const handleCancel = () => {
    if (currentTask) {
      cancelTask(currentTask.id);
    }
  };

  return (
    <div className="relative">
      {/* Notification */}
      {notification && (
        <div className="absolute -top-12 left-0 right-0 gradient-primary text-white px-3 py-1.5 rounded-xl text-xs font-medium z-10 animate-pulse shadow-lg">
          {notification}
        </div>
      )}

      <div className="glass rounded-xl p-3 border border-white/20 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <div className="w-6 h-6 gradient-primary rounded-lg flex items-center justify-center">
              <Clock className="w-3 h-3 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-white">
                {currentTask ? 'Active Session' : 'Timer Ready'}
              </span>
              <p className="text-xs text-gray-400">
                {currentTask ? 'Working on task' : 'Select a task to start'}
              </p>
            </div>
          </div>
          {state.timer.isRunning && (
            <div className="w-2.5 h-2.5 gradient-success rounded-full animate-pulse shadow-lg" />
          )}
        </div>

        {currentTask && (
          <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-xs font-bold text-white truncate mb-1">
              {currentTask.title}
            </h4>
            {currentTask.estimatedTime > 0 && (
              <div className="mt-1.5">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {Math.min(100, Math.round((state.timer.elapsedTime / (currentTask.estimatedTime * 60)) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      state.timer.elapsedTime > (currentTask.estimatedTime * 60)
                        ? 'gradient-danger'
                        : 'gradient-primary'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (state.timer.elapsedTime / (currentTask.estimatedTime * 60)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-3">
          <div className="text-xl sm:text-2xl md:text-xl lg:text-2xl font-mono font-bold text-white text-shadow mb-0.5">
            {formatTime(state.timer.elapsedTime)}
          </div>
          {currentTask && currentTask.estimatedTime > 0 && (
            <div className="text-xs text-gray-400">
              of {formatTime(currentTask.estimatedTime * 60)} estimated
            </div>
          )}
        </div>

        {state.timer.isRunning && currentTask ? (
          <div className="flex justify-center space-x-1.5">
            <button
              onClick={handleComplete}
              className="flex items-center justify-center px-3 py-1.5 gradient-success rounded-lg transition-all duration-300 text-xs font-bold hover:scale-105 shadow-lg"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center px-3 py-1.5 gradient-danger rounded-lg transition-all duration-300 text-xs font-bold hover:scale-105 shadow-lg"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-400">
              <Zap className="w-3 h-3" />
              <span>Ready to boost productivity</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}