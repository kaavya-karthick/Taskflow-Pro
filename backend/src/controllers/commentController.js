/**
 * Comment Controller
 * Handles task comments and threaded discussions
 */
const { validationResult } = require('express-validator');
const { query } = require('../config/database');

/**
 * Get comments for a task
 * GET /api/tasks/:taskId/comments
 */
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the task's project
    const accessCheck = await query(
      `SELECT 1 FROM tasks t
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE t.id = $1 AND pm.user_id = $2`,
      [taskId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task.',
        code: 'ACCESS_DENIED'
      });
    }

    // Get all comments with user info
    const commentsResult = await query(
      `SELECT 
        c.id,
        c.task_id,
        c.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        c.message,
        c.parent_id,
        c.is_edited,
        c.created_at,
        c.updated_at
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC`,
      [taskId]
    );

    // Organize comments into threaded structure
    const comments = commentsResult.rows;
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    // Second pass: organize into tree structure
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    res.json({
      success: true,
      data: {
        comments: rootComments,
        totalCount: comments.length
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments.',
      code: 'FETCH_COMMENTS_ERROR'
    });
  }
};

/**
 * Create a new comment
 * POST /api/tasks/:taskId/comments
 */
const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { taskId } = req.params;
    const userId = req.user.id;
    const { message, parent_id } = req.body;

    // Check if user has access to the task's project
    const accessCheck = await query(
      `SELECT t.project_id, t.title, t.assigned_user, t.created_by 
       FROM tasks t
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE t.id = $1 AND pm.user_id = $2`,
      [taskId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task.',
        code: 'ACCESS_DENIED'
      });
    }

    const task = accessCheck.rows[0];

    // If parent_id is provided, verify it exists and belongs to the same task
    if (parent_id) {
      const parentCheck = await query(
        'SELECT id FROM comments WHERE id = $1 AND task_id = $2',
        [parent_id, taskId]
      );

      if (parentCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment not found.',
          code: 'PARENT_NOT_FOUND'
        });
      }
    }

    // Create comment
    const commentResult = await query(
      `INSERT INTO comments (task_id, user_id, message, parent_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [taskId, userId, message, parent_id || null]
    );

    const comment = commentResult.rows[0];

    // Get user info for response
    const userResult = await query(
      'SELECT name, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    // Create notifications
    const notifiedUsers = new Set();

    // Notify task assignee (if not the commenter)
    if (task.assigned_user && task.assigned_user !== userId) {
      notifiedUsers.add(task.assigned_user);
    }

    // Notify task creator (if not the commenter)
    if (task.created_by && task.created_by !== userId) {
      notifiedUsers.add(task.created_by);
    }

    // If it's a reply, notify parent comment author
    if (parent_id) {
      const parentResult = await query(
        'SELECT user_id FROM comments WHERE id = $1',
        [parent_id]
      );
      if (parentResult.rows.length > 0 && parentResult.rows[0].user_id !== userId) {
        notifiedUsers.add(parentResult.rows[0].user_id);
      }
    }

    // Create notifications
    for (const notifyUserId of notifiedUsers) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, related_task_id, related_project_id) 
         VALUES ($1, 'comment_added', 'New Comment', $2, $3, $4)`,
        [notifyUserId, `New comment on task: ${task.title}`, taskId, task.project_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully.',
      data: {
        comment: {
          ...comment,
          user_name: userResult.rows[0]?.name,
          user_avatar: userResult.rows[0]?.avatar_url,
          replies: []
        }
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment.',
      code: 'CREATE_COMMENT_ERROR'
    });
  }
};

/**
 * Update a comment
 * PUT /api/comments/:id
 */
const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    // Check if comment exists and belongs to user
    const commentCheck = await query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
        code: 'COMMENT_NOT_FOUND'
      });
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments.',
        code: 'NOT_AUTHORIZED'
      });
    }

    const updateResult = await query(
      `UPDATE comments 
       SET message = $1, is_edited = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [message, id]
    );

    res.json({
      success: true,
      message: 'Comment updated successfully.',
      data: {
        comment: updateResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment.',
      code: 'UPDATE_COMMENT_ERROR'
    });
  }
};

/**
 * Delete a comment
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment exists
    const commentCheck = await query(
      `SELECT c.user_id, t.project_id 
       FROM comments c
       INNER JOIN tasks t ON c.task_id = t.id
       WHERE c.id = $1`,
      [id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
        code: 'COMMENT_NOT_FOUND'
      });
    }

    const comment = commentCheck.rows[0];

    // Check if user is comment author or project admin/owner
    if (comment.user_id !== userId) {
      // Check if user is project admin or owner
      const roleCheck = await query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [comment.project_id, userId]
      );

      if (roleCheck.rows.length === 0 || 
          (roleCheck.rows[0].role !== 'owner' && roleCheck.rows[0].role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this comment.',
          code: 'NOT_AUTHORIZED'
        });
      }
    }

    // Delete comment (cascade will delete replies)
    await query('DELETE FROM comments WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Comment deleted successfully.'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment.',
      code: 'DELETE_COMMENT_ERROR'
    });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment
};
