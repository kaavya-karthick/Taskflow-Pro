import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Check,
  Clock,
  Flag,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  X,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatDueDate } from '../utils/dateUtils';
import { formatPriority, formatStatus } from '../utils/formatters';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at: string;
  created_by: string;
  created_by_name: string;
  assigned_user: string;
  assigned_user_name: string;
  assigned_user_avatar: string;
  project_id: string;
  project_name: string;
  project_color: string;
  comments_count: number;
}

interface Comment {
  id: string;
  message: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  is_edited: boolean;
  created_at: string;
  replies: Comment[];
}

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editData, setEditData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (id) {
      fetchTask();
      fetchComments();
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/tasks/${id}`);
      const taskData = response.data.data.task;
      setTask(taskData);
      setEditData(taskData);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${id}/comments`);
      setComments(response.data.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {await api.put(`/tasks/${id}`, {
    title: editData.title || task?.title,
    description: editData.description || task?.description,
    priority: (editData.priority || task?.priority)?.toLowerCase(),
    status: (editData.status || task?.status)?.toLowerCase().replace(" ", "_"),
    due_date: editData.due_date || task?.due_date
    });
      
      setShowEditModal(false);
      fetchTask();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      navigate('/board');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/tasks/${id}`, { status: newStatus });
      fetchTask();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(`/tasks/${id}/comments`, { message: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">Task not found</p>
        <Link to="/board" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
          Back to board
        </Link>
      </div>
    );
  }

  const dueDate = formatDueDate(task.due_date);
  const priority = formatPriority(task.priority);
  const status = formatStatus(task.status);
  const isCompleted = task.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/board"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to board
      </Link>

      {/* Task Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to={`/projects/${task.project_id}`}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.project_color }}
              />
              {task.project_name}
            </Link>
          </div>
          <h1 className={`text-2xl font-bold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
            {task.title}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleStatusChange(isCompleted ? 'todo' : 'completed')}
            className={`inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors ${
              isCompleted
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDeleteTask}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({comments.length})
              </h3>
            </div>
            <div className="p-6">
              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
                <img
                  src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={comment.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_name}`}
                        alt={comment.user_name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">{comment.user_name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDateTime(comment.created_at)}
                            </span>
                            {comment.is_edited && (
                              <span className="text-xs text-gray-400">(edited)</span>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{comment.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Priority
                </label>
                <span className={`inline-block mt-1 px-2.5 py-1 text-sm font-medium rounded-full ${priority.color}`}>
                  {priority.label}
                </span>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Status
                </label>
                <span className={`inline-block mt-1 px-2.5 py-1 text-sm font-medium rounded-full ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </label>
                <p className={`mt-1 ${dueDate.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {dueDate.text}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assigned To
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {task.assigned_user_avatar ? (
                    <img
                      src={task.assigned_user_avatar}
                      alt={task.assigned_user_name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                  <span className="text-gray-900 dark:text-white">
                    {task.assigned_user_name || 'Unassigned'}
                  </span>
                </div>
              </div>
              {task.estimated_hours && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Estimated Hours
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">{task.estimated_hours}h</p>
                </div>
              )}
            </div>
          </div>

          {/* Created Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Created</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By <span className="font-medium text-gray-900 dark:text-white">{task.created_by_name}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatDateTime(task.created_at)}
            </p>
            {task.completed_at && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Completed on {formatDateTime(task.completed_at)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={editData.due_date?.split('T')[0] || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;
