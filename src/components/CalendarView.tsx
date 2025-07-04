import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  List,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';

export default function CalendarView() {
  const { state, dispatch, getTasksForDate } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const tasksForMonth = useMemo(() => {
    const tasks: { [key: string]: any[] } = {};
    calendarDays.forEach(day => {
      const dayTasks = getTasksForDate(day);
      if (dayTasks.length > 0) {
        tasks[format(day, 'yyyy-MM-dd')] = dayTasks;
      }
    });
    return tasks;
  }, [calendarDays, getTasksForDate]);

  const selectedDateTasks = state.selectedDate ? getTasksForDate(state.selectedDate) : [];

  const handleDateClick = (date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50 bg-gray-800/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendar</h1>
            <p className="text-gray-400 mt-1">View completed tasks by date</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'tasks' })}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors"
          >
            <List className="w-4 h-4" />
            <span>Task View</span>
          </button>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-xl font-semibold text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50 h-full">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const dayTasks = tasksForMonth[dayKey] || [];
                  const isSelected = state.selectedDate && isSameDay(day, state.selectedDate);
                  
                  return (
                    <button
                      key={dayKey}
                      onClick={() => handleDateClick(day)}
                      className={`
                        relative p-3 rounded-lg border transition-all hover:bg-gray-700/50
                        ${isSelected 
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' 
                          : 'border-gray-600/50 text-gray-300'
                        }
                        ${isToday(day) ? 'ring-2 ring-blue-500/50' : ''}
                        ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="text-sm font-medium">
                        {format(day, 'd')}
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Tasks */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50 h-full">
              <div className="flex items-center space-x-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">
                  {state.selectedDate 
                    ? format(state.selectedDate, 'MMM d, yyyy')
                    : 'Select a date'
                  }
                </h3>
              </div>

              {state.selectedDate ? (
                selectedDateTasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateTasks.map(task => (
                      <div key={task.id} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                              {task.actualTime > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.actualTime}m</span>
                                </div>
                              )}
                              {task.completedAt && (
                                <span>
                                  Completed at {format(task.completedAt, 'h:mm a')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      No tasks completed on this date
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm">
                    Click on a date to view completed tasks
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}