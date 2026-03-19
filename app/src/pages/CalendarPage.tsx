import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCalendarWeeks, formatDueDate } from '../utils/dateUtils';
import { formatPriority } from '../utils/formatters';

interface CalendarTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string;
  project_name: string;
  project_color: string;
  assigned_user_name?: string;
  assigned_user_avatar?: string;
}

const CalendarPage = () => {
  const { api } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const calendarWeeks = getCalendarWeeks(year, month);

  useEffect(() => {
    fetchTasks();
  }, [year, month]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/tasks/calendar?year=${year}&month=${month + 1}`);
      setTasks(response.data.data.tasks);
    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTasksForDay = (day: number | null): CalendarTask[] => {
    if (!day) return [];
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr));
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const today = new Date();
  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate.getDate()) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your tasks by due date.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-semibold text-gray-900 dark:text-white min-w-[140px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Link
            to="/board"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {calendarWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
                  {week.map((day, dayIndex) => {
                    const dayTasks = getTasksForDay(day);
                    const isTodayDate = isToday(day);
                    const isSelected = selectedDate && day === selectedDate.getDate();

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => day && setSelectedDate(new Date(year, month, day))}
                        className={`min-h-[100px] p-2 cursor-pointer transition-colors ${
                          day ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
                        } ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      >
                        {day && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                                  isTodayDate
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {day}
                              </span>
                              {dayTasks.length > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {dayTasks.slice(0, 3).map((task) => (
                                <Link
                                  key={task.id}
                                  to={`/tasks/${task.id}`}
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  className="block text-xs p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors truncate"
                                  style={{ borderLeft: `3px solid ${task.project_color}` }}
                                >
                                  {task.title}
                                </Link>
                              ))}
                              {dayTasks.length > 3 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 pl-1.5">
                                  +{dayTasks.length - 3} more
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Day Tasks */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDate ? (
                  <>Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</>
                ) : (
                  'Select a date'
                )}
              </h2>
            </div>
            <div className="p-4">
              {!selectedDate ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Click on a date to view tasks</p>
                </div>
              ) : selectedDayTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No tasks due on this date</p>
                  <Link
                    to="/board"
                    className="inline-block mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    Create a task
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayTasks.map((task) => {
                    const priority = formatPriority(task.priority);
                    const dueDate = formatDueDate(task.due_date);

                    return (
                      <Link
                        key={task.id}
                        to={`/tasks/${task.id}`}
                        className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.project_color }}
                          />
                          {task.project_name}
                        </div>
                        {dueDate.isOverdue && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            Overdue
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Overdue Tasks Summary */}
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-red-900 dark:text-red-400 mb-2">
              Overdue Tasks
            </h3>
            {(() => {
              const overdueTasks = tasks.filter(task => {
                if (!task.due_date || task.status === 'completed') return false;
                const dueDate = new Date(task.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return dueDate < today;
              });

              return overdueTasks.length === 0 ? (
                <p className="text-sm text-red-600 dark:text-red-400">No overdue tasks! Great job!</p>
              ) : (
                <>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                    You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {overdueTasks.slice(0, 3).map(task => (
                      <Link
                        key={task.id}
                        to={`/tasks/${task.id}`}
                        className="block text-sm text-red-700 dark:text-red-300 hover:underline"
                      >
                        {task.title}
                      </Link>
                    ))}
                    {overdueTasks.length > 3 && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        +{overdueTasks.length - 3} more
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
