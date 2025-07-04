import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, CheckCircle, X, Clock } from 'lucide-react';

export default function Timer() {
  const { state, startTimer, completeTask, cancelTask } = useApp();
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
        <div className="absolute -top-16 left-0 right-0 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium z-10 animate-pulse">
          {notification}
        </div>
      )}

      <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-600/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">
              {currentTask ? 'Working on' : 'Timer'}
            </span>
          </div>
          {state.timer.isRunning && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>

        {currentTask && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-white truncate">
              {currentTask.title}
            </h4>
            {currentTask.estimatedTime > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {Math.min(100, Math.round((state.timer.elapsedTime / (currentTask.estimatedTime * 60)) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      state.timer.elapsedTime > (currentTask.estimatedTime * 60)
                        ? 'bg-gradient-to-r from-red-500 to-orange-500'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
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

        <div className="text-center mb-4">
          <div className="text-3xl font-mono font-bold text-white">
            {formatTime(state.timer.elapsedTime)}
          </div>
          {currentTask && currentTask.estimatedTime > 0 && (
            <div className="text-sm text-gray-400">
              of {formatTime(currentTask.estimatedTime * 60)} estimated
            </div>
          )}
        </div>

        {state.timer.isRunning && currentTask ? (
          <div className="flex justify-center space-x-2">
            <button
              onClick={handleComplete}
              className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-sm font-medium"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-400">
            Select a task to start timer
          </div>
        )}
      </div>
    </div>
  );
}