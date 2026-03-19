/**
 * Authentication Middleware
 * JWT verification and route protection
 */
const { verifyToken, extractTokenFromHeader } = require('../utils/auth');
const { query } = require('../config/database');

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user still exists in database
    const userResult = await query(
      'SELECT id, name, email, avatar_url, timezone, language, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Attach user to request object
    req.user = userResult.rows[0];
    req.token = token;
    
    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to optionally authenticate (attach user if token exists)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (token) {
      const decoded = verifyToken(token);
      const userResult = await query(
        'SELECT id, name, email, avatar_url FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (userResult.rows.length > 0) {
        req.user = userResult.rows[0];
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Middleware to check if user has specific role in project
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} - Express middleware
 */
const requireProjectRole = (allowedRoles = ['owner', 'admin', 'member']) => {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required.',
          code: 'MISSING_PROJECT_ID'
        });
      }
      
      // Check user's role in project
      const memberResult = await query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      
      if (memberResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this project.',
          code: 'ACCESS_DENIED'
        });
      }
      
      const userRole = memberResult.rows[0].role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Attach role to request for later use
      req.projectRole = userRole;
      
      next();
    } catch (error) {
      console.error('Project role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking project permissions.',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user is project owner or admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireProjectAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    const memberResult = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project.',
        code: 'ACCESS_DENIED'
      });
    }
    
    const userRole = memberResult.rows[0].role;
    
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'This action requires owner or admin privileges.',
        code: 'ADMIN_REQUIRED'
      });
    }
    
    req.projectRole = userRole;
    next();
  } catch (error) {
    console.error('Project admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking project permissions.',
      code: 'PERMISSION_CHECK_ERROR'
    });
  }
};

/**
 * Middleware to check if user owns the resource or is admin
 * @param {string} resourceTable - Database table name
 * @param {string} resourceIdParam - Parameter name for resource ID
 * @param {string} ownerColumn - Column name for owner ID
 * @returns {Function} - Express middleware
 */
const requireOwnership = (resourceTable, resourceIdParam = 'id', ownerColumn = 'created_by') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;
      
      const result = await query(
        `SELECT ${ownerColumn} FROM ${resourceTable} WHERE id = $1`,
        [resourceId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.',
          code: 'RESOURCE_NOT_FOUND'
        });
      }
      
      const ownerId = result.rows[0][ownerColumn];
      
      if (ownerId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to modify this resource.',
          code: 'OWNERSHIP_REQUIRED'
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership.',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireProjectRole,
  requireProjectAdmin,
  requireOwnership
};
