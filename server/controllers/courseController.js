/**
 * Course Controller
 * Handles course-related HTTP requests
 */

const courseService = require('../services/courseService');

/**
 * Get all published courses with filters
 * GET /api/courses
 */
const getCourses = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      difficulty: req.query.difficulty,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await courseService.getCourses(filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get courses controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get course by ID with modules and user progress
 * GET /api/courses/:id
 */
const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user ? req.user.id : null;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const result = await courseService.getCourseById(courseId, userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get course controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Enroll in a course
 * POST /api/courses/:id/enroll
 */
const enrollInCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const result = await courseService.enrollInCourse(userId, courseId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Enroll course controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update progress for a module
 * PUT /api/courses/:courseId/modules/:moduleId/progress
 */
const updateProgress = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { progress } = req.body;
    const userId = req.user.id;

    if (!courseId || !moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and Module ID are required'
      });
    }

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be a number between 0 and 100'
      });
    }

    const result = await courseService.updateProgress(userId, courseId, moduleId, progress);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Update progress controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user's enrolled courses
 * GET /api/courses/my-courses
 */
const getUserCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await courseService.getUserCourses(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get user courses controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  enrollInCourse,
  updateProgress,
  getUserCourses
};