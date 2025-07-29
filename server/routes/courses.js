/**
 * Course Routes
 * Handles course browsing, enrollment, and progress tracking for students
 */

const express = require('express');
const router = express.Router();

const courseController = require('../controllers/courseController');
const { authenticateToken, requireStudent, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/courses
 * @desc    Get all published courses with optional filters
 * @access  Public
 * @query   category, difficulty, search, page, limit
 */
router.get('/', optionalAuth, courseController.getCourses);

/**
 * @route   GET /api/courses/my-courses
 * @desc    Get user's enrolled courses with progress
 * @access  Private (Student+)
 * @headers Authorization: Bearer <token>
 */
router.get('/my-courses', authenticateToken, requireStudent, courseController.getUserCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get course details with modules and user progress
 * @access  Public (enhanced with auth)
 * @headers Authorization: Bearer <token> (optional)
 * @params  id - Course ID
 */
router.get('/:id', optionalAuth, courseController.getCourseById);

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll in a course
 * @access  Private (Student+)
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID
 */
router.post('/:id/enroll', authenticateToken, requireStudent, courseController.enrollInCourse);

/**
 * @route   PUT /api/courses/:courseId/modules/:moduleId/progress
 * @desc    Update progress for a specific module
 * @access  Private (Student+)
 * @headers Authorization: Bearer <token>
 * @params  courseId - Course ID, moduleId - Module ID
 * @body    { progress } - Progress percentage (0-100)
 */
router.put('/:courseId/modules/:moduleId/progress', 
  authenticateToken, 
  requireStudent, 
  courseController.updateProgress
);

module.exports = router;