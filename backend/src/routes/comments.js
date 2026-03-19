/**
 * Comment Routes
 * Handles task comments and threaded discussions
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const createCommentValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID')
];

const updateCommentValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters')
];

// All routes require authentication
router.use(authenticate);

// Comment routes
router.get('/tasks/:taskId/comments', commentController.getComments);
router.post('/tasks/:taskId/comments', createCommentValidation, commentController.createComment);
router.put('/comments/:id', updateCommentValidation, commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;
