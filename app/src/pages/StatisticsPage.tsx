import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  CheckSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TaskStats {
  overall: {
    total_tasks: number;
    todo_count: number;
    in_progress_count: number;
    completed_count: number;
    low_priority_count: number;
    medium_priority_count: number;
    high_priority_count: number;
    urgent_priority_count: number;
    overdue_count: number;
  };
  weekly: Array<{
    week: string;
    completed_count: number;
  }>;
  byProject: Array<{
    project_id: string;
    project_name: string;
    project_color: string;
    task_count: number;
    completed_count: number;
  }>;
}

const StatisticsPage = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tasks/statistics/overview');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusData = stats ? [
    { name: 'To Do', value: stats.overall.todo_count, color: '#9CA3AF' },
    { name: 'In Progress', value: stats.overall.in_progress_count, color: '#3B82F6' },
    { name: 'Completed', value: stats.overall.completed_count, color: '#10B981' },
  ] : [];

  const priorityData = stats ? [
    { name: 'Low', value: stats.overall.low_priority_count, color: '#9CA3AF' },
    { name: 'Medium', value: stats.overall.medium_priority_count, color: '#3B82F6' },
    { name: 'High', value: stats.overall.high_priority_count, color: '#F97316' },
    { name: 'Urgent', value: stats.overall.urgent_priority_count, color: '#EF4444' },
  ] : [];

  const weeklyData = stats?.weekly.map(w => ({
    week: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: parseInt(w.completed_count as unknown as string),
  })) || [];

  const projectData = stats?.byProject.map(p => ({
    name: p.project_name,
    total: p.task_count,
    completed: p.completed_count,
    color: p.project_color,
  })) || [];

  const completionRate = stats && stats.overall.total_tasks > 0
    ? Math.round((stats.overall.completed_count / stats.overall.total_tasks) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your productivity and task completion metrics.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.overall.total_tasks || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {completionRate}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {(stats?.overall.todo_count || 0) + (stats?.overall.in_progress_count || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {stats?.overall.overdue_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Task Status Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Task Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Tasks by Priority
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Completion Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Tasks Completed Per Week
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="week" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Project */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Tasks by Project
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="name" type="category" stroke="#6B7280" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total Tasks" stackId="a" fill="#6366F1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Productivity Insights</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <p className="text-indigo-100 text-sm mb-1">This Week</p>
            <p className="text-2xl font-bold">
              {weeklyData[weeklyData.length - 1]?.completed || 0} tasks
            </p>
            <p className="text-indigo-200 text-sm">completed</p>
          </div>
          <div>
            <p className="text-indigo-100 text-sm mb-1">Average</p>
            <p className="text-2xl font-bold">
              {weeklyData.length > 0
                ? Math.round(weeklyData.reduce((acc, w) => acc + w.completed, 0) / weeklyData.length)
                : 0} tasks
            </p>
            <p className="text-indigo-200 text-sm">per week</p>
          </div>
          <div>
            <p className="text-indigo-100 text-sm mb-1">Trend</p>
            <p className="text-2xl font-bold">
              {weeklyData.length >= 2 &&
              (weeklyData[weeklyData.length - 1]?.completed || 0) >=
                (weeklyData[weeklyData.length - 2]?.completed || 0)
                ? '↗ Up'
                : '↘ Down'}
            </p>
            <p className="text-indigo-200 text-sm">from last week</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
