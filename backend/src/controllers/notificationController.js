/**
 * Notification Controller
 * Handles user notifications
 */
const { validationResult } = require('express-validator');
const { query } = require('../config/database');

/**
 * Get notifications for current user
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only, page = 1, limit = 20 } = req.query;

    let sql = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.related_task_id,
        n.related_project_id,
        n.is_read,
        n.read_at,
        n.created_at,
        t.title as task_title,
        p.name as project_name
      FROM notifications n
      LEFT JOIN tasks t ON n.related_task_id = t.id
      LEFT JOIN projects p ON n.related_project_id = p.id
      WHERE n.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (unread_only === 'true') {
      sql += ` AND n.is_read = false`;
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` ORDER BY n.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const notificationsResult = await query(sql, params);

    // Get unread count
    const unreadResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    // Get total count
    const totalResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        notifications: notificationsResult.rows,
        unreadCount: parseInt(unreadResult.rows[0].count),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalResult.rows[0].count),
          totalPages: Math.ceil(parseInt(totalResult.rows[0].count) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications.',
      code: 'FETCH_NOTIFICATIONS_ERROR'
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updateResult = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read.',
      data: {
        notification: updateResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read.',
      code: 'MARK_READ_ERROR'
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read.',
      code: 'MARK_ALL_READ_ERROR'
    });
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleteResult = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification.',
      code: 'DELETE_NOTIFICATION_ERROR'
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
        COUNT(*) as total_unread,
        COUNT(CASE WHEN type = 'task_assigned' THEN 1 END) as task_assigned_count,
        COUNT(CASE WHEN type = 'task_due_soon' THEN 1 END) as task_due_soon_count,
        COUNT(CASE WHEN type = 'comment_added' THEN 1 END) as comment_count
      FROM notifications 
      WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        unreadCounts: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count.',
      code: 'FETCH_UNREAD_COUNT_ERROR'
    });
  }
};

/**
 * Create a notification (internal use)
 * @param {string} userId - User ID to notify
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} relatedTaskId - Related task ID (optional)
 * @param {string} relatedProjectId - Related project ID (optional)
 */
const createNotification = async (userId, type, title, message, relatedTaskId = null, relatedProjectId = null) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, related_task_id, related_project_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, relatedTaskId, relatedProjectId]
    );
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification
};
