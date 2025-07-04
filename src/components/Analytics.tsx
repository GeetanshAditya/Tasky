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
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 lg:mb-10">
            <div className="animate-slide-in mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 md:space-x-4 mb-2">
                <div className="w-10 h-10 md:w-12 md:h-12 gradient-secondary rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-shadow">Analytics Dashboard</h1>
                  <p className="text-indigo-300 font-medium text-sm md:text-base">Insights into your productivity journey</p>
                </div>
              </div>
            </div>
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 glass border border-white/20 rounded-xl transition-all duration-300 hover:scale-105 card-hover w-full lg:w-auto justify-center"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium text-sm md:text-base">Export Data</span>
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 lg:mb-10">
            <div className="glass rounded-xl p-4 md:p-6 border border-white/20 card-hover animate-fade-in">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-white">{analytics.totalTasks}</p>
                  <p className="text-xs md:text-sm text-gray-400">Total Tasks</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs md:text-sm text-gray-400">
                  {analytics.completedTasks} completed
                </div>
                <div className="text-xs md:text-sm font-bold gradient-primary text-transparent bg-clip-text">
                  {analytics.completionRate.toFixed(1)}%
                </div>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2 mt-3">
                <div 
                  className="gradient-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.completionRate}%` }}
                />
              </div>
            </div>

            <div className="glass rounded-xl p-4 md:p-6 border border-white/20 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-white">{formatTime(analytics.totalTimeSpent)}</p>
                  <p className="text-xs md:text-sm text-gray-400">Time Invested</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs md:text-sm text-gray-400">
                  Avg: {formatTime(Math.round(analytics.averageTaskTime))}
                </div>
                <div className="text-xs md:text-sm font-bold text-purple-400">
                  per task
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 md:p-6 border border-white/20 card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-white">{analytics.efficiency.toFixed(1)}%</p>
                  <p className="text-xs md:text-sm text-gray-400">Efficiency</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-xs md:text-sm font-medium ${analytics.efficiency < 100 ? 'text-green-400' : 'text-red-400'}`}>
                  {analytics.efficiency < 100 ? '🎯 Under estimate' : '⚠️ Over estimate'}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 md:p-6 border border-white/20 card-hover animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-white">{analytics.thisWeekTasks}</p>
                  <p className="text-xs md:text-sm text-gray-400">This Week</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-xs md:text-sm font-medium ${analytics.weeklyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {analytics.weeklyGrowth >= 0 ? '📈' : '📉'} {analytics.weeklyGrowth >= 0 ? '+' : ''}{analytics.weeklyGrowth.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">vs last week</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 lg:mb-10">
            {/* Daily Activity */}
            <div className="glass rounded-xl p-4 md:p-6 border border-white/20 animate-fade-in">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white">Daily Activity</h3>
                </div>
                <div className="text-xs md:text-sm text-gray-400">Last 7 days</div>
              </div>
              <div className="space-y-3 md:space-y-4">
                {analytics.dailyStats.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="text-xs md:text-sm font-medium text-gray-300 w-16 md:w-20">
                        {format(day.date, 'EEE, MMM d')}
                      </div>
                      <div className="flex-1 w-32 md:w-40">
                        <div className="w-full bg-gray-700/50 rounded-full h-2 md:h-3">
                          <div 
                            className="gradient-primary h-2 md:h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, (day.tasks / Math.max(...analytics.dailyStats.map(d => d.tasks), 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs md:text-sm font-bold text-white ml-4">
                      {day.tasks} tasks
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Distribution */}
            <div className="glass rounded-xl p-4 md:p-6 border border-white/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <PieChart className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white">Project Overview</h3>
                </div>
                <div className="text-xs md:text-sm text-gray-400">{analytics.projectStats.length} projects</div>
              </div>
              <div className="space-y-3 md:space-y-4">
                {analytics.projectStats.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 md:w-4 md:h-4 rounded-full shadow-lg"
                        style={{ backgroundColor: project.color, boxShadow: `0 0 10px ${project.color}40` }}
                      />
                      <div>
                        <div className="text-xs md:text-sm font-bold text-white">{project.name}</div>
                        <div className="text-xs text-gray-400">
                          {project.completedCount}/{project.taskCount} tasks • {formatTime(project.totalTime)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs md:text-sm font-bold text-white">
                        {project.completionRate.toFixed(1)}%
                      </div>
                      <div className="w-12 md:w-16 bg-gray-700/50 rounded-full h-2 mt-1">
                        <div 
                          className="gradient-primary h-2 rounded-full transition-all duration-500"
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
          <div className="glass rounded-xl p-4 md:p-6 border border-white/20 animate-fade-in">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white">Project Performance</h3>
              </div>
              <div className="text-xs md:text-sm text-gray-400">Detailed breakdown</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-xs md:text-sm border-b border-white/10">
                    <th className="pb-3 md:pb-4 font-bold">Project</th>
                    <th className="pb-3 md:pb-4 font-bold">Tasks</th>
                    <th className="pb-3 md:pb-4 font-bold">Completed</th>
                    <th className="pb-3 md:pb-4 font-bold">Time Spent</th>
                    <th className="pb-3 md:pb-4 font-bold">Completion Rate</th>
                    <th className="pb-3 md:pb-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {analytics.projectStats.map((project) => (
                    <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 md:py-4">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div 
                            className="w-3 h-3 md:w-4 md:h-4 rounded-full shadow-lg"
                            style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}40` }}
                          />
                          <span className="text-white font-bold text-xs md:text-sm">{project.name}</span>
                        </div>
                      </td>
                      <td className="py-3 md:py-4 text-gray-300 font-medium text-xs md:text-sm">{project.taskCount}</td>
                      <td className="py-3 md:py-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                          <span className="text-green-400 font-bold text-xs md:text-sm">{project.completedCount}</span>
                        </div>
                      </td>
                      <td className="py-3 md:py-4 text-gray-300 font-medium text-xs md:text-sm">{formatTime(project.totalTime)}</td>
                      <td className="py-3 md:py-4">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-16 md:w-20 bg-gray-700/50 rounded-full h-2">
                            <div 
                              className="gradient-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${project.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs md:text-sm font-bold text-white">{project.completionRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 md:py-4">
                        <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-bold ${
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