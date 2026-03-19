/**
 * Project Routes
 * Handles project CRUD operations and member management
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const projectController = require('../controllers/projectController');
const { authenticate, requireProjectAdmin, requireProjectRole } = require('../middleware/auth');

// Validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Project name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code')
];

const updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Project name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
  body('is_archived')
    .optional()
    .isBoolean()
    .withMessage('is_archived must be a boolean')
];

const addMemberValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('role')
    .optional()
    .isIn(['admin', 'member', 'viewer'])
    .withMessage('Role must be one of: admin, member, viewer')
];

const updateMemberValidation = [
  body('role')
    .isIn(['admin', 'member', 'viewer'])
    .withMessage('Role must be one of: admin, member, viewer')
];

// All routes require authentication
router.use(authenticate);

// Project routes
router.get('/', projectController.getProjects);
router.post('/', createProjectValidation, projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', requireProjectAdmin, updateProjectValidation, projectController.updateProject);
router.delete('/:id', requireProjectAdmin, projectController.deleteProject);

// Member management routes
router.post('/:id/members', requireProjectAdmin, addMemberValidation, projectController.addMember);
router.delete('/:id/members/:userId', requireProjectAdmin, projectController.removeMember);
router.put('/:id/members/:userId', requireProjectAdmin, updateMemberValidation, projectController.updateMemberRole);

module.exports = router;
