import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Folder,
  TrendingUp,
  Calendar,
  ArrowRight,
  Plus,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDueDate } from '../utils/dateUtils';
import { formatPriority } from '../utils/formatters';

interface DashboardStats {
  totalProjects: number;
  assignedTasks: number;
  pendingTasks: number;
  dueSoonTasks: number;
  completedTasks: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  project_name: string;
  project_color: string;
}

interface RecentProject {
  id: string;
  name: string;
  color: string;
  total_tasks: number;
  pending_tasks: number;
}

const Dashboard = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch tasks statistics
        const statsResponse = await api.get('/tasks/statistics/overview');
        const taskStats = statsResponse.data.data.overall;
        
        // Fetch recent tasks
        const tasksResponse = await api.get('/tasks?limit=5');
        
        // Fetch projects
        const projectsResponse = await api.get('/projects?limit=4');
        
        setStats({
          totalProjects: projectsResponse.data.data.projects.length,
          assignedTasks: taskStats.total_tasks || 0,
          pendingTasks: (taskStats.todo_count || 0) + (taskStats.in_progress_count || 0),
          dueSoonTasks: taskStats.overdue_count || 0,
          completedTasks: taskStats.completed_count || 0,
        });
        
        setRecentTasks(tasksResponse.data.data.tasks || []);
        setRecentProjects(projectsResponse.data.data.projects || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [api]);

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: Folder,
      color: 'bg-blue-500',
      link: '/projects',
    },
    {
      title: 'Assigned Tasks',
      value: stats?.assignedTasks || 0,
      icon: CheckSquare,
      color: 'bg-indigo-500',
      link: '/board',
    },
    {
      title: 'Pending Tasks',
      value: stats?.pendingTasks || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/board',
    },
    {
      title: 'Due Soon',
      value: stats?.dueSoonTasks || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      link: '/calendar',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
              <Link
                to="/board"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentTasks.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks yet</p>
                  <Link
                    to="/board"
                    className="inline-block mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    Create your first task
                  </Link>
                </div>
              ) : (
                recentTasks.map((task) => {
                  const dueDate = formatDueDate(task.due_date);
                  const priority = formatPriority(task.priority);
                  
                  return (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: task.project_color || '#6366F1' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {task.project_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${priority.color}`}>
                          {priority.label}
                        </span>
                        <span className={`text-sm ${
                          dueDate.isOverdue 
                            ? 'text-red-600 dark:text-red-400' 
                            : dueDate.isToday 
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {dueDate.text}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Projects</h2>
              <Link
                to="/projects"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentProjects.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No projects yet</p>
                  <Link
                    to="/projects/new"
                    className="inline-block mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    Create your first project
                  </Link>
                </div>
              ) : (
                recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: project.color + '20' }}
                      >
                        <Folder className="w-5 h-5" style={{ color: project.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {project.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>{project.total_tasks} tasks</span>
                          {project.pending_tasks > 0 && (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {project.pending_tasks} pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="font-semibold mb-2">Boost Your Productivity</h3>
            <p className="text-indigo-100 text-sm mb-4">
              Try our Kanban board to visualize your workflow and get more done.
            </p>
            <Link
              to="/board"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Open Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
