import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  Target, 
  Award,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Users,
  CheckCircle2,
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
    <div className="h-full overflow-auto">
      <div className="p-3 sm:p-4 md:p-3 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 sm:mb-6 md:mb-4 lg:mb-8">
            <div className="animate-slide-in mb-3 lg:mb-0">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-2 lg:space-x-3 mb-1 sm:mb-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-7 md:h-7 lg:w-10 lg:h-10 gradient-secondary rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-5 lg:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl md:text-xl lg:text-3xl font-bold text-white text-shadow">Analytics Dashboard</h1>
                  <p className="text-indigo-300 font-medium text-xs sm:text-sm md:text-xs lg:text-base">Insights into your productivity journey</p>
                </div>
              </div>
            </div>
            <button
              onClick={exportData}
              className="flex items-center space-x-1.5 px-3 sm:px-4 md:px-3 lg:px-4 py-2 glass border border-white/20 rounded-xl transition-all duration-300 hover:scale-105 card-hover w-full lg:w-auto justify-center"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4" />
              <span className="font-medium text-xs sm:text-sm md:text-xs lg:text-sm">Export Data</span>
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-2 lg:gap-4 mb-4 sm:mb-6 md:mb-4 lg:mb-8">
            <div className="glass rounded-xl p-3 sm:p-4 md:p-3 lg:p-4 border border-white/20 card-hover animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-xl md:text-lg lg:text-2xl font-bold text-white">{analytics.totalTasks}</p>
                  <p className="text-xs text-gray-400">Total Tasks</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {analytics.completedTasks} completed
                </div>
                <div className="text-xs font-bold gradient-primary text-transparent bg-clip-text">
                  {analytics.completionRate.toFixed(1)}%
                </div>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                <div 
                  className="gradient-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.completionRate}%` }}
                />
              </div>
            </div>

            <div className="glass rounded-xl p-3 sm:p-4 md:p-3 lg:p-4 border border-white/20 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-xl md:text-lg lg:text-2xl font-bold text-white">{formatTime(analytics.totalTimeSpent)}</p>
                  <p className="text-xs text-gray-400">Time Invested</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Avg: {formatTime(Math.round(analytics.averageTaskTime))}
                </div>
                <div className="text-xs font-bold text-purple-400">
                  per task
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-3 sm:p-4 md:p-3 lg:p-4 border border-white/20 card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-xl md:text-lg lg:text-2xl font-bold text-white">{analytics.efficiency.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Efficiency</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-xs font-medium ${analytics.efficiency < 100 ? 'text-green-400' : 'text-red-400'}`}>
                  {analytics.efficiency < 100 ? '🎯 Under estimate' : '⚠️ Over estimate'}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-3 sm:p-4 md:p-3 lg:p-4 border border-white/20 card-hover animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-xl md:text-lg lg:text-2xl font-bold text-white">{analytics.thisWeekTasks}</p>
                  <p className="text-xs text-gray-400">This Week</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-xs font-medium ${analytics.weeklyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {analytics.weeklyGrowth >= 0 ? '📈' : '📉'} {analytics.weeklyGrowth >= 0 ? '+' : ''}{analytics.weeklyGrowth.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">vs last week</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-3 lg:gap-6 mb-4 sm:mb-6 md:mb-4 lg:mb-8">
            {/* Daily Activity */}
            <div className="glass rounded-xl p-3 sm:p-4 md:p-3 lg:p-4 border border-white/20 animate-fade-in">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-sm lg:text-lg font-bold text-white">Daily Activity</h3>
                </div>
                <div className="text-xs text-gray-400">Last 7 days</div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {analytics.dailyStats.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="text-xs font-medium text-gray-300 w-12 sm:w-16">
                        {format(day.date, 'EEE, MMM d')}
                      </div>
                      <div className="flex-1 w-20 sm:w-32">
                        <div className="w-full bg-gray-700/50 rounded-full h-1.5 sm:h-2">
                          <div 
                            className="gradient-primary h-1.5 sm:h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, (day.tasks / Math.max(...analytics.dailyStats.map(d => d.tasks), 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-white ml-2">
                      {day.tasks} tasks
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Distribution */}
            <div className="glass rounded-xl p-3 sm:p-4 md:p-3 lg:p-4 border border-white/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <PieChart className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-purple-400" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-sm lg:text-lg font-bold text-white">Project Overview</h3>
                </div>
                <div className="text-xs text-gray-400">{analytics.projectStats.length} projects</div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {analytics.projectStats.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-lg"
                        style={{ backgroundColor: project.color, boxShadow: `0 0 10px ${project.color}40` }}
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{project.name}</div>
                        <div className="text-xs text-gray-400">
                          {project.completedCount}/{project.taskCount} tasks • {formatTime(project.totalTime)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">
                        {project.completionRate.toFixed(1)}%
                      </div>
                      <div className="w-10 sm:w-12 bg-gray-700/50 rounded-full h-1.5 mt-1">
                        <div 
                          className="gradient-primary h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${project.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Performance Table */}
          <div className="glass rounded-xl p-3 sm:p-4 md:p-3 lg:p-4 border border-white/20 animate-fade-in">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm sm:text-base md:text-sm lg:text-lg font-bold text-white">Project Performance</h3>
              </div>
              <div className="text-xs text-gray-400">Detailed breakdown</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-xs border-b border-white/10">
                    <th className="pb-2 font-bold">Project</th>
                    <th className="pb-2 font-bold">Tasks</th>
                    <th className="pb-2 font-bold">Completed</th>
                    <th className="pb-2 font-bold">Time Spent</th>
                    <th className="pb-2 font-bold">Completion Rate</th>
                    <th className="pb-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {analytics.projectStats.map((project) => (
                    <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full shadow-lg"
                            style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}40` }}
                          />
                          <span className="text-white font-bold text-xs">{project.name}</span>
                        </div>
                      </td>
                      <td className="py-2 text-gray-300 font-medium text-xs">{project.taskCount}</td>
                      <td className="py-2">
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 font-bold text-xs">{project.completedCount}</span>
                        </div>
                      </td>
                      <td className="py-2 text-gray-300 font-medium text-xs">{formatTime(project.totalTime)}</td>
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 sm:w-16 bg-gray-700/50 rounded-full h-1.5">
                            <div 
                              className="gradient-primary h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${project.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white">{project.completionRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          project.completionRate === 100 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : project.completionRate > 50 
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {project.completionRate === 100 ? '✅ Complete' : project.completionRate > 50 ? '🚀 In Progress' : '📋 Planning'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}