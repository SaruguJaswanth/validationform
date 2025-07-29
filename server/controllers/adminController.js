/**
 * Admin Controller
 * Handles admin-only operations like course and module management
 */

const courseService = require('../services/courseService');
const { supabaseAdmin, TABLES } = require('../config/database');

/**
 * Create a new course (Admin only)
 * POST /api/admin/courses
 */
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      price,
      imageUrl,
      isPublished
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and difficulty are required'
      });
    }

    const result = await courseService.createCourse({
      title,
      description,
      category,
      difficulty,
      duration,
      price,
      imageUrl,
      isPublished
    }, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Create course admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update a course (Admin only)
 * PUT /api/admin/courses/:id
 */
const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const result = await courseService.updateCourse(courseId, updateData, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Update course admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all courses (including unpublished) for admin
 * GET /api/admin/courses
 */
const getAllCourses = async (req, res) => {
  try {
    const { data: courses, error } = await supabaseAdmin
      .from(TABLES.COURSES)
      .select(`
        *,
        profiles:created_by(first_name, last_name),
        modules:modules(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch courses'
      });
    }

    res.json({
      success: true,
      data: courses
    });

  } catch (error) {
    console.error('Get all courses admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a course (Admin only)
 * DELETE /api/admin/courses/:id
 */
const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Delete related records first (cascade delete)
    await supabaseAdmin.from(TABLES.PROGRESS).delete().eq('course_id', courseId);
    await supabaseAdmin.from(TABLES.ENROLLMENTS).delete().eq('course_id', courseId);
    await supabaseAdmin.from(TABLES.MODULES).delete().eq('course_id', courseId);

    // Delete the course
    const { error } = await supabaseAdmin
      .from(TABLES.COURSES)
      .delete()
      .eq('id', courseId)
      .eq('created_by', req.user.id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete course or course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create a new module for a course
 * POST /api/admin/courses/:courseId/modules
 */
const createModule = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const {
      title,
      description,
      content,
      videoUrl,
      duration,
      orderIndex,
      isPublished = false
    } = req.body;

    if (!courseId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, and description are required'
      });
    }

    // Verify course exists and is owned by admin
    const { data: course, error: courseError } = await supabaseAdmin
      .from(TABLES.COURSES)
      .select('id')
      .eq('id', courseId)
      .eq('created_by', req.user.id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Create module
    const { data: module, error } = await supabaseAdmin
      .from(TABLES.MODULES)
      .insert([
        {
          course_id: courseId,
          title,
          description,
          content,
          video_url: videoUrl,
          duration,
          order_index: orderIndex || 0,
          is_published: isPublished,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
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
      data: module
    });

  } catch (error) {
    console.error('Create module admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update a module
 * PUT /api/admin/modules/:id
 */
const updateModule = async (req, res) => {
  try {
    const moduleId = req.params.id;
    const updateData = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Module ID is required'
      });
    }

    const allowedFields = [
      'title', 'description', 'content', 'video_url', 
      'duration', 'order_index', 'is_published'
    ];
    
    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    updates.updated_at = new Date().toISOString();

    // Update module (verify ownership through course)
    const { data: module, error } = await supabaseAdmin
      .from(TABLES.MODULES)
      .update(updates)
      .eq('id', moduleId)
      .eq('course_id', supabaseAdmin
        .from(TABLES.COURSES)
        .select('id')
        .eq('created_by', req.user.id)
      )
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update module or module not found'
      });
    }

    res.json({
      success: true,
      message: 'Module updated successfully',
      data: module
    });

  } catch (error) {
    console.error('Update module admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a module
 * DELETE /api/admin/modules/:id
 */
const deleteModule = async (req, res) => {
  try {
    const moduleId = req.params.id;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Module ID is required'
      });
    }

    // Delete progress records for this module
    await supabaseAdmin.from(TABLES.PROGRESS).delete().eq('module_id', moduleId);

    // Delete the module (verify ownership through course)
    const { error } = await supabaseAdmin
      .from(TABLES.MODULES)
      .delete()
      .eq('id', moduleId)
      .eq('course_id', supabaseAdmin
        .from(TABLES.COURSES)
        .select('id')
        .eq('created_by', req.user.id)
      );

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete module or module not found'
      });
    }

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });

  } catch (error) {
    console.error('Delete module admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all users with enrollment stats
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .select(`
        *,
        enrollments:course_enrollments(count),
        progress:user_progress(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get all users admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const [usersResult, coursesResult, enrollmentsResult] = await Promise.all([
      supabaseAdmin.from(TABLES.PROFILES).select('id', { count: 'exact' }),
      supabaseAdmin.from(TABLES.COURSES).select('id', { count: 'exact' }),
      supabaseAdmin.from(TABLES.ENROLLMENTS).select('id', { count: 'exact' })
    ]);

    // Get recent enrollments
    const { data: recentEnrollments } = await supabaseAdmin
      .from(TABLES.ENROLLMENTS)
      .select(`
        *,
        profiles(first_name, last_name),
        courses(title)
      `)
      .order('enrolled_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalUsers: usersResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalEnrollments: enrollmentsResult.count || 0,
        recentEnrollments: recentEnrollments || []
      }
    });

  } catch (error) {
    console.error('Get dashboard stats admin controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  getAllCourses,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  getAllUsers,
  getDashboardStats
};