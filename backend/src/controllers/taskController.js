/**
 * Task Controller
 * Handles task CRUD operations and task management
 */
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { format, startOfWeek, endOfWeek } = require('date-fns');

/**
 * Get all tasks with filtering
 * GET /api/tasks
 */
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      project_id,
      status,
      priority,
      assigned_to,
      search,
      due_before,
      due_after,
      page = 1,
      limit = 50
    } = req.query;

    let sql = `
      SELECT 
        t.id,
        t.project_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.due_date,
        t.position,
        t.estimated_hours,
        t.actual_hours,
        t.tags,
        t.created_at,
        t.updated_at,
        t.completed_at,
        t.created_by,
        cb.name as created_by_name,
        t.assigned_user,
        au.name as assigned_user_name,
        au.avatar_url as assigned_user_avatar,
        p.name as project_name,
        p.color as project_color
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users cb ON t.created_by = cb.id
      LEFT JOIN users au ON t.assigned_user = au.id
      WHERE pm.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    // Apply filters
    if (project_id) {
      sql += ` AND t.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    if (status) {
      const statuses = status.split(',');
      sql += ` AND t.status = ANY($${paramIndex++}::varchar[])`;
      params.push(statuses);
    }

    if (priority) {
      const priorities = priority.split(',');
      sql += ` AND t.priority = ANY($${paramIndex++}::varchar[])`;
      params.push(priorities);
    }

    if (assigned_to) {
      if (assigned_to === 'me') {
        sql += ` AND t.assigned_user = $${paramIndex++}`;
        params.push(userId);
      } else {
        sql += ` AND t.assigned_user = $${paramIndex++}`;
        params.push(assigned_to);
      }
    }

    if (due_before) {
      sql += ` AND t.due_date <= $${paramIndex++}`;
      params.push(due_before);
    }

    if (due_after) {
      sql += ` AND t.due_date >= $${paramIndex++}`;
      params.push(due_after);
    }

    if (search) {
      sql += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` ORDER BY t.position ASC, t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const tasksResult = await query(sql, params);

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) 
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
    `;
    const countParams = [userId];
    let countParamIndex = 2;

    if (project_id) {
      countSql += ` AND t.project_id = $${countParamIndex++}`;
      countParams.push(project_id);
    }
    if (status) {
      countSql += ` AND t.status = ANY($${countParamIndex++}::varchar[])`;
      countParams.push(status.split(','));
    }
    if (priority) {
      countSql += ` AND t.priority = ANY($${countParamIndex++}::varchar[])`;
      countParams.push(priority.split(','));
    }
    if (assigned_to === 'me') {
      countSql += ` AND t.assigned_user = $${countParamIndex++}`;
      countParams.push(userId);
    } else if (assigned_to) {
      countSql += ` AND t.assigned_user = $${countParamIndex++}`;
      countParams.push(assigned_to);
    }
    if (search) {
      countSql += ` AND (t.title ILIKE $${countParamIndex} OR t.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countSql, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        tasks: tasksResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks.',
      code: 'FETCH_TASKS_ERROR'
    });
  }
};

/**
 * Get single task by ID
 * GET /api/tasks/:id
 */
const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const taskResult = await query(
      `SELECT 
        t.id,
        t.project_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.due_date,
        t.position,
        t.estimated_hours,
        t.actual_hours,
        t.tags,
        t.created_at,
        t.updated_at,
        t.completed_at,
        t.created_by,
        cb.name as created_by_name,
        t.assigned_user,
        au.name as assigned_user_name,
        au.avatar_url as assigned_user_avatar,
        p.name as project_name,
        p.color as project_color
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users cb ON t.created_by = cb.id
      LEFT JOIN users au ON t.assigned_user = au.id
      WHERE t.id = $1 AND pm.user_id = $2`,
      [id, userId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied.',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Get comments count
    const commentsResult = await query(
      'SELECT COUNT(*) as count FROM comments WHERE task_id = $1',
      [id]
    );

    // Get attachments
    const attachmentsResult = await query(
      `SELECT 
        a.id,
        a.filename,
        a.original_name,
        a.mime_type,
        a.file_size,
        a.file_url,
        a.created_at,
        u.name as uploaded_by_name
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.task_id = $1
      ORDER BY a.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        task: {
          ...taskResult.rows[0],
          comments_count: parseInt(commentsResult.rows[0].count),
          attachments: attachmentsResult.rows
        }
      }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task.',
      code: 'FETCH_TASK_ERROR'
    });
  }
};

/**
 * Create new task
 * POST /api/tasks
 */
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const {
      project_id,
      title,
      description,
      priority = 'medium',
      status = 'todo',
      due_date,
      assigned_user,
      estimated_hours,
      tags
    } = req.body;

    // Check if user has access to project
    const projectCheck = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [project_id, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project.',
        code: 'ACCESS_DENIED'
      });
    }

    // Get max position for the status column
    const positionResult = await query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE project_id = $1 AND status = $2',
      [project_id, status]
    );
    const position = positionResult.rows[0].next_position;

    const taskResult = await query(
      `INSERT INTO tasks 
       (project_id, title, description, priority, status, due_date, assigned_user, created_by, position, estimated_hours, tags) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [project_id, title, description, priority, status, due_date, assigned_user, userId, position, estimated_hours, tags]
    );

    const task = taskResult.rows[0];

    // Create notification for assigned user if different from creator
    if (assigned_user && assigned_user !== userId) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, related_task_id, related_project_id) 
         VALUES ($1, 'task_assigned', 'New Task Assigned', $2, $3, $4)`,
        [assigned_user, `You have been assigned to task: ${title}`, task.id, project_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task.',
      code: 'CREATE_TASK_ERROR'
    });
  }
};

/**
 * Update task
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res) => {
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
    const {
      title,
      description,
      priority,
      status,
      due_date,
      assigned_user,
      estimated_hours,
      actual_hours,
      tags,
      position
    } = req.body;

    // Get current task data for comparison
    const currentTaskResult = await query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (currentTaskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
        code: 'TASK_NOT_FOUND'
      });
    }

    const currentTask = currentTaskResult.rows[0];

    const updateResult = await query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           priority = COALESCE($3, priority),
           status = COALESCE($4, status),
           due_date = COALESCE($5, due_date),
           assigned_user = COALESCE($6, assigned_user),
           estimated_hours = COALESCE($7, estimated_hours),
           actual_hours = COALESCE($8, actual_hours),
           tags = COALESCE($9, tags),
           position = COALESCE($10, position),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [title, description, priority, status, due_date, assigned_user, 
       estimated_hours, actual_hours, tags, position, id]
    );

    const updatedTask = updateResult.rows[0];

    // Create notifications for changes
    // Notify if assigned to new user
    if (assigned_user && assigned_user !== currentTask.assigned_user && assigned_user !== userId) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, related_task_id, related_project_id) 
         VALUES ($1, 'task_assigned', 'Task Assigned to You', $2, $3, $4)`,
        [assigned_user, `You have been assigned to task: ${updatedTask.title}`, id, updatedTask.project_id]
      );
    }

    // Notify if task is completed
    if (status === 'completed' && currentTask.status !== 'completed') {
      // Notify task creator
      if (currentTask.created_by !== userId) {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, related_task_id, related_project_id) 
           VALUES ($1, 'task_completed', 'Task Completed', $2, $3, $4)`,
          [currentTask.created_by, `Task "${updatedTask.title}" has been completed`, id, updatedTask.project_id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task.',
      code: 'UPDATE_TASK_ERROR'
    });
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteResult = await query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
        code: 'TASK_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task.',
      code: 'DELETE_TASK_ERROR'
    });
  }
};

/**
 * Update task positions (for drag and drop)
 * PUT /api/tasks/positions
 */
const updatePositions = async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tasks array is required.',
        code: 'INVALID_DATA'
      });
    }

    await transaction(async (client) => {
      for (const task of tasks) {
        await client.query(
          'UPDATE tasks SET status = $1, position = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [task.status, task.position, task.id]
        );
      }
    });

    res.json({
      success: true,
      message: 'Task positions updated successfully.'
    });
  } catch (error) {
    console.error('Update positions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task positions.',
      code: 'UPDATE_POSITIONS_ERROR'
    });
  }
};

/**
 * Get tasks for calendar view
 * GET /api/tasks/calendar
 */
const getCalendarTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const tasksResult = await query(
      `SELECT 
        t.id,
        t.title,
        t.priority,
        t.status,
        t.due_date,
        t.project_id,
        p.name as project_name,
        p.color as project_color,
        au.name as assigned_user_name,
        au.avatar_url as assigned_user_avatar
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users au ON t.assigned_user = au.id
      WHERE pm.user_id = $1
        AND t.due_date >= $2
        AND t.due_date <= $3
      ORDER BY t.due_date ASC`,
      [userId, startDate, endDate]
    );

    res.json({
      success: true,
      data: {
        tasks: tasksResult.rows
      }
    });
  } catch (error) {
    console.error('Get calendar tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar tasks.',
      code: 'FETCH_CALENDAR_ERROR'
    });
  }
};

/**
 * Get task statistics
 * GET /api/tasks/statistics/overview
 */
const getTaskStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id } = req.query;

    // Base query conditions
    let projectCondition = 'pm.user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (project_id) {
      projectCondition += ` AND t.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    // Overall statistics
    const overallStats = await query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_count,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN t.priority = 'low' THEN 1 END) as low_priority_count,
        COUNT(CASE WHEN t.priority = 'medium' THEN 1 END) as medium_priority_count,
        COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN t.priority = 'urgent' THEN 1 END) as urgent_priority_count,
        COUNT(CASE WHEN t.due_date < CURRENT_TIMESTAMP AND t.status != 'completed' THEN 1 END) as overdue_count
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN project_members pm ON p.id = pm.project_id
      WHERE ${projectCondition}`,
      params
    );

    // Tasks completed per week (last 4 weeks)
    const weeklyStats = await query(
      `SELECT 
        DATE_TRUNC('week', completed_at) as week,
        COUNT(*) as completed_count
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN project_members pm ON p.id = pm.project_id
      WHERE ${projectCondition}
        AND t.status = 'completed'
        AND t.completed_at >= CURRENT_DATE - INTERVAL '4 weeks'
      GROUP BY DATE_TRUNC('week', completed_at)
      ORDER BY week ASC`,
      params
    );

    // Tasks by project
    const projectStats = await query(
      `SELECT 
        p.id as project_id,
        p.name as project_name,
        p.color as project_color,
        COUNT(*) as task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
      GROUP BY p.id, p.name, p.color
      ORDER BY task_count DESC
      LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        overall: overallStats.rows[0],
        weekly: weeklyStats.rows,
        byProject: projectStats.rows
      }
    });
  } catch (error) {
    console.error('Get task statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task statistics.',
      code: 'FETCH_STATISTICS_ERROR'
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updatePositions,
  getCalendarTasks,
  getTaskStatistics
};
