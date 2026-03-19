/**
 * Authentication Controller
 * Handles user registration, login, profile management
 */
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const {
  hashPassword,
  comparePassword,
  createAuthResponse,
  generateToken,
  verifyToken
} = require('../utils/auth');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, avatar_url, timezone, language, created_at`,
      [name, email.toLowerCase(), passwordHash]
    );

    const user = newUser.rows[0];

    // Create auth response with tokens
    const authResponse = createAuthResponse(user);

    res.status(201).json(authResponse);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user account.',
      code: 'REGISTRATION_ERROR'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const userResult = await query(
      'SELECT id, name, email, password_hash, avatar_url, timezone, language, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Remove password_hash from user object
    delete user.password_hash;

    // Create auth response with tokens
    const authResponse = createAuthResponse(user);

    res.json(authResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in.',
      code: 'LOGIN_ERROR'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.timezone, u.language,
              u.email_notifications, u.push_notifications, u.weekly_digest,
              u.created_at, u.last_login,
              COUNT(DISTINCT pm.project_id) as total_projects
       FROM users u
       LEFT JOIN project_members pm ON u.id = pm.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: userResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile.',
      code: 'PROFILE_ERROR'
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
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
      name,
      avatar_url,
      timezone,
      language,
      email_notifications,
      push_notifications,
      weekly_digest
    } = req.body;

    const updateResult = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           avatar_url = COALESCE($2, avatar_url),
           timezone = COALESCE($3, timezone),
           language = COALESCE($4, language),
           email_notifications = COALESCE($5, email_notifications),
           push_notifications = COALESCE($6, push_notifications),
           weekly_digest = COALESCE($7, weekly_digest),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, name, email, avatar_url, timezone, language, 
                 email_notifications, push_notifications, weekly_digest, updated_at`,
      [name, avatar_url, timezone, language, email_notifications, 
       push_notifications, weekly_digest, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: updateResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile.',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
};

/**
 * Change user password
 * PUT /api/auth/password
 */
const changePassword = async (req, res) => {
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
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isCurrentValid = await comparePassword(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password.',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Check if user still exists
    const userResult = await query(
      'SELECT id, name, email, avatar_url, timezone, language FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new tokens
    const authResponse = createAuthResponse(userResult.rows[0]);

    res.json(authResponse);
  } catch (error) {
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please login again.',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token.',
      code: 'REFRESH_ERROR'
    });
  }
};

/**
 * Logout user (optional - for token blacklist)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // Here we could add token to a blacklist if needed
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout
};
