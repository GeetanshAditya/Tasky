import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, X, Clock, Zap, Pause, Play, Maximize2 } from 'lucide-react';

interface TimerPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

function TimerPopup({ isOpen, onClose }: TimerPopupProps) {
  const { state, completeTask, cancelTask, pauseTimer, resumeTimer } = useApp();
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (state.timer.isRunning && state.timer.currentTaskId) {
        const elapsed = state.timer.elapsedTime;
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
  }, [state.timer]);

  const handleComplete = () => {
    if (currentTask) {
      completeTask(currentTask.id);
      onClose();
    }
  };

  const handleCancel = () => {
    if (currentTask) {
      cancelTask(currentTask.id);
      onClose();
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="w-6 h-6" />
            <span>Timer</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {currentTask ? (
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-2">{currentTask.title}</h3>
              {currentTask.description && (
                <p className="text-gray-400 text-sm">{currentTask.description}</p>
              )}
            </div>

            <div className="w-48 h-48 rounded-full border-8 border-purple-500/30 flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm mx-auto mb-6">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-white mb-2">
                  {timerDisplay}
                </div>
                <div className="text-gray-400 text-sm">
                  {state.timer.isRunning ? 'Running' : state.timer.isPaused ? 'Paused' : 'Ready'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-center space-x-3">
                {state.timer.isRunning ? (
                  <button
                    onClick={handlePause}
                    className="flex items-center justify-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </button>
                ) : state.timer.isPaused ? (
                  <button
                    onClick={() => resumeTimer(currentTask.id)}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </button>
                ) : null}
                
                <button
                  onClick={handleComplete}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </button>
              </div>
              
              <button
                onClick={handleCancel}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No active timer</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Timer() {
  const { state, completeTask, cancelTask, pauseTimer, resumeTimer, enterFullscreen } = useApp();
  const [notification, setNotification] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

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
  const pausedTasksCount = Object.keys(state.timer.pausedTasks).length;

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

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    if (currentTask) {
      resumeTimer(currentTask.id);
    }
  };

  return (
    <>
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
            <div className="flex items-center space-x-1">
              <button
                onClick={enterFullscreen}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Enter Fullscreen"
              >
                <Maximize2 className="w-3 h-3 text-gray-400" />
              </button>
              <button
                onClick={() => setShowPopup(true)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Open Timer Popup"
              >
                <Clock className="w-3 h-3 text-gray-400" />
              </button>
              {state.timer.isRunning && (
                <div className="w-2.5 h-2.5 gradient-success rounded-full animate-pulse shadow-lg" />
              )}
            </div>
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
                onClick={handlePause}
                className="flex items-center justify-center px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all duration-300 text-xs font-bold hover:scale-105 shadow-lg"
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </button>
              <button
                onClick={handleComplete}
                className="flex items-center justify-center px-3 py-1.5 gradient-success rounded-lg transition-all duration-300 text-xs font-bold hover:scale-105 shadow-lg"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </button>
            </div>
          ) : state.timer.isPaused && currentTask ? (
            <div className="flex justify-center space-x-1.5">
              <button
                onClick={handleResume}
                className="flex items-center justify-center px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all duration-300 text-xs font-bold hover:scale-105 shadow-lg"
              >
                <Play className="w-3 h-3 mr-1" />
                Resume
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
              {pausedTasksCount > 0 && (
                <div className="text-xs text-yellow-400 mt-1">
                  {pausedTasksCount} paused task{pausedTasksCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TimerPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />
    </>
  );
}