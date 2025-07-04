import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export default function Analytics() {
  const { state, exportData } = useApp();

  const analytics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const lastWeekStart = subDays(weekStart, 7);
    
    const completedTasks = state.tasks.filter(task => task.status === 'completed');
    const thisWeekTasks = completedTasks.filter(task => 
      task.completedAt && task.completedAt >= weekStart && task.completedAt <= weekEnd
    );
    const lastWeekTasks = completedTasks.filter(task => 
      task.completedAt && task.completedAt >= lastWeekStart && task.completedAt < weekStart
    );

    const totalTimeSpent = state.tasks.reduce((sum, task) => sum + task.actualTime, 0);
    const totalEstimatedTime = state.tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const averageTaskTime = completedTasks.length > 0 
      ? totalTimeSpent / completedTasks.length 
      : 0;

    const projectStats = state.projects.map(project => {
      const projectTasks = state.tasks.filter(task => task.projectId === project.id);
      const completedProjectTasks = projectTasks.filter(task => task.status === 'completed');
      const totalTime = projectTasks.reduce((sum, task) => sum + task.actualTime, 0);
      
      return {
        ...project,
        taskCount: projectTasks.length,
        completedCount: completedProjectTasks.length,
        totalTime,
        completionRate: projectTasks.length > 0 
          ? (completedProjectTasks.length / projectTasks.length) * 100 
          : 0,
      };
    });

    const dailyStats = eachDayOfInterval({ start: subDays(now, 6), end: now }).map(date => {
      const dayTasks = completedTasks.filter(task => 
        task.completedAt && format(task.completedAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const dayTime = dayTasks.reduce((sum, task) => sum + task.actualTime, 0);
      
      return {
        date,
        tasks: dayTasks.length,
        time: dayTime,
      };
    });

    const efficiency = totalEstimatedTime > 0 
      ? (totalTimeSpent / totalEstimatedTime) * 100 
      : 0;

    return {
      totalTasks: state.tasks.length,
      completedTasks: completedTasks.length,
      completionRate: state.tasks.length > 0 
        ? (completedTasks.length / state.tasks.length) * 100 
        : 0,
      totalTimeSpent,
      averageTaskTime,
      efficiency,
      thisWeekTasks: thisWeekTasks.length,
      lastWeekTasks: lastWeekTasks.length,
      weeklyGrowth: lastWeekTasks.length > 0 
        ? ((thisWeekTasks.length - lastWeekTasks.length) / lastWeekTasks.length) * 100 
        : 0,
      projectStats,
      dailyStats,
    };
  }, [state.tasks, state.projects]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 mt-1">Insights into your productivity</p>
          </div>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tasks</p>
                <p className="text-2xl font-bold text-white">{analytics.totalTasks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <div className="text-sm text-gray-400">
                {analytics.completedTasks} completed
              </div>
              <div className="text-sm text-green-400">
                {analytics.completionRate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Time Spent</p>
                <p className="text-2xl font-bold text-white">{formatTime(analytics.totalTimeSpent)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <div className="text-sm text-gray-400">
                Avg: {formatTime(Math.round(analytics.averageTaskTime))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Efficiency</p>
                <p className="text-2xl font-bold text-white">{analytics.efficiency.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <div className={`text-sm ${analytics.efficiency < 100 ? 'text-green-400' : 'text-red-400'}`}>
                {analytics.efficiency < 100 ? 'Under estimate' : 'Over estimate'}
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-white">{analytics.thisWeekTasks}</p>
              </div>
              <div className="w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <div className={`text-sm ${analytics.weeklyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {analytics.weeklyGrowth >= 0 ? '+' : ''}{analytics.weeklyGrowth.toFixed(1)}% vs last week
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Activity */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Daily Activity</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analytics.dailyStats.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-400 w-16">
                      {format(day.date, 'MMM d')}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (day.tasks / Math.max(...analytics.dailyStats.map(d => d.tasks))) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 ml-4">
                    {day.tasks} tasks
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Distribution */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Project Distribution</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analytics.projectStats.map((project, index) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-white">{project.name}</div>
                      <div className="text-xs text-gray-400">
                        {project.completedCount}/{project.taskCount} tasks
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {project.completionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(project.totalTime)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Project Performance</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">Project</th>
                  <th className="pb-3">Tasks</th>
                  <th className="pb-3">Completed</th>
                  <th className="pb-3">Time Spent</th>
                  <th className="pb-3">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {analytics.projectStats.map((project, index) => (
                  <tr key={project.id} className="border-t border-gray-700/50">
                    <td className="py-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-white font-medium">{project.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-400">{project.taskCount}</td>
                    <td className="py-3 text-gray-400">{project.completedCount}</td>
                    <td className="py-3 text-gray-400">{formatTime(project.totalTime)}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{project.completionRate.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}