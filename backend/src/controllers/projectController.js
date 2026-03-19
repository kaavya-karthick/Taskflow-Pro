/**
 * Project Controller
 * Handles project CRUD operations and member management
 */
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all projects for current user
 * GET /api/projects
 */
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeArchived } = req.query;

    let sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.color,
        p.owner_id,
        p.is_archived,
        p.created_at,
        p.updated_at,
        u.name as owner_name,
        u.avatar_url as owner_avatar,
        pm.role as user_role,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status != 'completed' THEN t.id END) as pending_tasks,
        COUNT(DISTINCT pm2.user_id) as member_count
      FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      WHERE pm.user_id = $1
    `;

    const params = [userId];

    if (includeArchived !== 'true') {
      sql += ` AND p.is_archived = false`;
    }

    sql += `
      GROUP BY p.id, p.name, p.description, p.color, p.owner_id, p.is_archived, 
               p.created_at, p.updated_at, u.name, u.avatar_url, pm.role
      ORDER BY p.updated_at DESC
    `;

    const projectsResult = await query(sql, params);

    res.json({
      success: true,
      data: {
        projects: projectsResult.rows
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects.',
      code: 'FETCH_PROJECTS_ERROR'
    });
  }
};

/**
 * Get single project by ID
 * GET /api/projects/:id
 */
const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const projectResult = await query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.color,
        p.owner_id,
        p.is_archived,
        p.created_at,
        p.updated_at,
        u.name as owner_name,
        u.avatar_url as owner_avatar,
        pm.role as user_role
      FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1 AND pm.user_id = $2`,
      [id, userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied.',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Get project members
    const membersResult = await query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        pm.role,
        pm.joined_at
      FROM project_members pm
      INNER JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.joined_at ASC`,
      [id]
    );

    // Get project statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN priority IN ('high', 'urgent') THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'completed' THEN 1 END) as overdue_count
      FROM tasks
      WHERE project_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        project: {
          ...projectResult.rows[0],
          members: membersResult.rows,
          statistics: statsResult.rows[0]
        }
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project.',
      code: 'FETCH_PROJECT_ERROR'
    });
  }
};

/**
 * Create new project
 * POST /api/projects
 */
const createProject = async (req, res) => {
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
    const { name, description, color } = req.body;

    const result = await transaction(async (client) => {
      // Create project
      const projectResult = await client.query(
        `INSERT INTO projects (name, description, color, owner_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, description, color || '#6366F1', userId]
      );

      const project = projectResult.rows[0];

      // Add creator as owner in project_members
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role) 
         VALUES ($1, $2, 'owner')`,
        [project.id, userId]
      );

      return project;
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: {
        project: result
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project.',
      code: 'CREATE_PROJECT_ERROR'
    });
  }
};

/**
 * Update project
 * PUT /api/projects/:id
 */
const updateProject = async (req, res) => {
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
    const { name, description, color, is_archived } = req.body;

    const updateResult = await query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           is_archived = COALESCE($4, is_archived),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, description, color, is_archived, id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: {
        project: updateResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project.',
      code: 'UPDATE_PROJECT_ERROR'
    });
  }
};

/**
 * Delete project
 * DELETE /api/projects/:id
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteResult = await query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully.'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project.',
      code: 'DELETE_PROJECT_ERROR'
    });
  }
};

/**
 * Add member to project
 * POST /api/projects/:id/members
 */
const addMember = async (req, res) => {
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
    const { email, role = 'member' } = req.body;

    // Find user by email
    const userResult = await query(
      'SELECT id, name, email, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email.',
        code: 'USER_NOT_FOUND'
      });
    }

    const userToAdd = userResult.rows[0];

    // Check if user is already a member
    const existingMember = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userToAdd.id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project.',
        code: 'ALREADY_MEMBER'
      });
    }

    // Add member
    await query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, $3)`,
      [id, userToAdd.id, role]
    );

    res.status(201).json({
      success: true,
      message: 'Member added successfully.',
      data: {
        member: {
          ...userToAdd,
          role
        }
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member.',
      code: 'ADD_MEMBER_ERROR'
    });
  }
};

/**
 * Remove member from project
 * DELETE /api/projects/:id/members/:userId
 */
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user.id;

    // Prevent removing yourself if you're the owner
    const projectResult = await query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    if (projectResult.rows[0].owner_id === userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove the project owner.',
        code: 'CANNOT_REMOVE_OWNER'
      });
    }

    const deleteResult = await query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project.',
        code: 'MEMBER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Member removed successfully.'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member.',
      code: 'REMOVE_MEMBER_ERROR'
    });
  }
};

/**
 * Update member role
 * PUT /api/projects/:id/members/:userId
 */
const updateMemberRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id, userId } = req.params;
    const { role } = req.body;

    // Prevent changing owner's role
    const projectResult = await query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    if (projectResult.rows[0].owner_id === userId && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change the project owner\'s role.',
        code: 'CANNOT_CHANGE_OWNER_ROLE'
      });
    }

    const updateResult = await query(
      `UPDATE project_members 
       SET role = $1
       WHERE project_id = $2 AND user_id = $3
       RETURNING *`,
      [role, id, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project.',
        code: 'MEMBER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Member role updated successfully.',
      data: {
        member: updateResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member role.',
      code: 'UPDATE_ROLE_ERROR'
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole
};
