/**
 * Admin Routes
 * Handles admin-only operations for course and user management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|wmv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Apply admin authentication to all routes
router.use(authenticateToken, requireAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with enrollment statistics
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses (including unpublished)
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 */
router.get('/courses', adminController.getAllCourses);

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @body    { title, description, category, difficulty, duration?, price?, imageUrl?, isPublished? }
 */
router.post('/courses', adminController.createCourse);

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Update a course
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID
 * @body    Course data to update
 */
router.put('/courses/:id', adminController.updateCourse);

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete a course and all related data
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID
 */
router.delete('/courses/:id', adminController.deleteCourse);

/**
 * @route   POST /api/admin/courses/:courseId/modules
 * @desc    Create a new module for a course
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @params  courseId - Course ID
 * @body    { title, description, content?, videoUrl?, duration?, orderIndex?, isPublished? }
 */
router.post('/courses/:courseId/modules', adminController.createModule);

/**
 * @route   PUT /api/admin/modules/:id
 * @desc    Update a module
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @params  id - Module ID
 * @body    Module data to update
 */
router.put('/modules/:id', adminController.updateModule);

/**
 * @route   DELETE /api/admin/modules/:id
 * @desc    Delete a module
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @params  id - Module ID
 */
router.delete('/modules/:id', adminController.deleteModule);

/**
 * @route   POST /api/admin/upload
 * @desc    Upload files (images, videos)
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @body    Form-data with file field
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

module.exports = router;