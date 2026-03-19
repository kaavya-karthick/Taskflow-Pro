/**
 * Task Routes
 * Handles task CRUD operations and management
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const createTaskValidation = [
  body('project_id')
    .isUUID()
    .withMessage('Valid project ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Task title must be between 1 and 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'in_review', 'completed', 'cancelled'])
    .withMessage('Status must be one of: todo, in_progress, in_review, completed, cancelled'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('assigned_user')
    .optional()
    .isUUID()
    .withMessage('Assigned user must be a valid user ID'),
  body('estimated_hours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated hours must be a positive integer'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Task title must be between 1 and 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'in_review', 'completed', 'cancelled'])
    .withMessage('Status must be one of: todo, in_progress, in_review, completed, cancelled'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('assigned_user')
    .optional()
    .isUUID()
    .withMessage('Assigned user must be a valid user ID'),
  body('estimated_hours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated hours must be a positive integer'),
  body('actual_hours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Actual hours must be a positive integer'),
  body('position')
    .optional()
    .isInt()
    .withMessage('Position must be an integer')
];

const updatePositionsValidation = [
  body('tasks')
    .isArray({ min: 1 })
    .withMessage('Tasks array is required'),
  body('tasks.*.id')
    .isUUID()
    .withMessage('Each task must have a valid ID'),
  body('tasks.*.status')
    .isIn(['todo', 'in_progress', 'in_review', 'completed', 'cancelled'])
    .withMessage('Each task must have a valid status'),
  body('tasks.*.position')
    .isInt()
    .withMessage('Each task must have a valid position')
];

const getCalendarValidation = [
  query('year')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Valid year is required'),
  query('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Valid month is required (1-12)')
];

// All routes require authentication
router.use(authenticate);

// Task routes
router.get('/', taskController.getTasks);
router.post('/', createTaskValidation, taskController.createTask);
router.get('/calendar', getCalendarValidation, taskController.getCalendarTasks);
router.get('/statistics/overview', taskController.getTaskStatistics);
router.get('/:id', taskController.getTask);
router.put('/:id', updateTaskValidation, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.put('/positions', updatePositionsValidation, taskController.updatePositions);

module.exports = router;
