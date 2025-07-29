/**
 * Admin Routes
 * Course management and admin operations
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, param } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler } = require('../server/middleware/errorHandler');
const { requireAdmin } = require('../server/middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    // Get statistics
    const [
      { count: totalUsers },
      { count: totalCourses },
      { count: totalEnrollments },
      { count: activeCourses }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published')
    ]);

    // Get recent activities
    const { data: recentActivities } = await supabaseAdmin
      .from('user_activity')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get enrollment trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: enrollmentTrends } = await supabaseAdmin
      .from('enrollments')
      .select('enrolled_at')
      .gte('enrolled_at', thirtyDaysAgo)
      .order('enrolled_at', { ascending: true });

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalCourses,
          totalEnrollments,
          activeCourses
        },
        recentActivities,
        enrollmentTrends
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
}));

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course
 * @access  Private (Admin)
 */
router.post('/courses', [
  body('title').trim().isLength({ min: 3 }),
  body('description').trim().isLength({ min: 10 }),
  body('difficultyLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('estimatedDuration').optional().isInt({ min: 1 }),
  body('tags').optional().isArray(),
  body('prerequisites').optional().isArray(),
  body('learningObjectives').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    title,
    description,
    difficultyLevel = 'beginner',
    estimatedDuration,
    tags = [],
    prerequisites = [],
    learningObjectives = []
  } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        title,
        description,
        instructor_id: req.user.id,
        difficulty_level: difficultyLevel,
        estimated_duration: estimatedDuration,
        tags,
        prerequisites,
        learning_objectives: learningObjectives
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create course'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data
    });

  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
}));

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses for admin
 * @access  Private (Admin)
 */
router.get('/courses', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    let query = supabaseAdmin
      .from('courses')
      .select(`
        *,
        instructor:instructor_id (
          full_name,
          email
        ),
        modules:modules (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: courses, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch courses'
      });
    }

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Courses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
}));

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Update a course
 * @access  Private (Admin)
 */
router.put('/courses/:id', [
  param('id').isUUID(),
  body('title').optional().trim().isLength({ min: 3 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('difficultyLevel').optional().isIn(['beginner', 'intermediate', 'advanced'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = {};

  // Build update object
  const allowedFields = [
    'title', 'description', 'status', 'difficultyLevel', 
    'estimatedDuration', 'tags', 'prerequisites', 'learningObjectives', 'thumbnailUrl'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      // Convert camelCase to snake_case for database
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      updateData[dbField] = req.body[field];
    }
  }

  if (req.body.status === 'published' && !updateData.published_at) {
    updateData.published_at = new Date().toISOString();
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update course'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data
    });

  } catch (error) {
    console.error('Course update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
}));

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete a course
 * @access  Private (Admin)
 */
router.delete('/courses/:id', [
  param('id').isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete course'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Course deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course'
    });
  }
}));

/**
 * @route   POST /api/admin/courses/:courseId/modules
 * @desc    Create a new module for a course
 * @access  Private (Admin)
 */
router.post('/courses/:courseId/modules', [
  param('courseId').isUUID(),
  body('title').trim().isLength({ min: 3 }),
  body('description').optional().trim(),
  body('orderIndex').isInt({ min: 0 }),
  body('duration').optional().isInt({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { courseId } = req.params;
  const { title, description, orderIndex, duration } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('modules')
      .insert({
        course_id: courseId,
        title,
        description,
        order_index: orderIndex,
        duration
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create module'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data
    });

  } catch (error) {
    console.error('Module creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create module'
    });
  }
}));

/**
 * @route   POST /api/admin/modules/:moduleId/content
 * @desc    Add content to a module
 * @access  Private (Admin)
 */
router.post('/modules/:moduleId/content', [
  param('moduleId').isUUID(),
  body('title').trim().isLength({ min: 3 }),
  body('contentType').isIn(['video', 'document', 'quiz', 'text']),
  body('orderIndex').isInt({ min: 0 }),
  body('contentUrl').optional().isURL(),
  body('contentData').optional().isObject(),
  body('duration').optional().isInt({ min: 1 }),
  body('isRequired').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { moduleId } = req.params;
  const {
    title,
    contentType,
    orderIndex,
    contentUrl,
    contentData,
    duration,
    isRequired = true
  } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('module_content')
      .insert({
        module_id: moduleId,
        title,
        content_type: contentType,
        content_url: contentUrl,
        content_data: contentData,
        order_index: orderIndex,
        duration,
        is_required: isRequired
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create module content'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Module content created successfully',
      data
    });

  } catch (error) {
    console.error('Module content creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create module content'
    });
  }
}));

/**
 * @route   POST /api/admin/upload
 * @desc    Upload files (images, videos, documents)
 * @access  Private (Admin)
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const { purpose = 'general' } = req.body;

  try {
    // Store file information in database
    const fileUrl = `/uploads/${req.file.filename}`;
    
    const { data, error } = await supabaseAdmin
      .from('uploads')
      .insert({
        filename: req.file.filename,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        file_url: fileUrl,
        uploaded_by: req.user.id,
        upload_purpose: purpose
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to record file upload'
      });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: data.id,
        filename: data.filename,
        originalName: data.original_name,
        mimeType: data.mime_type,
        fileSize: data.file_size,
        fileUrl: data.file_url,
        purpose: data.upload_purpose
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
}));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users for admin management
 * @access  Private (Admin)
 */
router.get('/users', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
}));

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (admin can change roles, activate/deactivate)
 * @access  Private (Admin)
 */
router.put('/users/:id', [
  param('id').isUUID(),
  body('role').optional().isIn(['admin', 'student']),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { role, isActive } = req.body;

  try {
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update user'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data
    });

  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
}));

module.exports = router;