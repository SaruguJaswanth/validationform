/**
 * Course Routes
 * Public course access and student enrollment
 */

const express = require('express');
const { param, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler } = require('../server/middleware/errorHandler');
const { authenticateToken, requireStudent } = require('../server/middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/courses
 * @desc    Get all published courses
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, search, tags } = req.query;
    
    let query = supabaseAdmin
      .from('courses')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        difficulty_level,
        estimated_duration,
        tags,
        created_at,
        published_at,
        instructor:instructor_id (
          full_name
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (tags) {
      const tagArray = tags.split(',');
      query = query.overlaps('tags', tagArray);
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
 * @route   GET /api/courses/:id
 * @desc    Get course details
 * @access  Public
 */
router.get('/:id', [
  param('id').isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid course ID'
    });
  }

  const { id } = req.params;

  try {
    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        instructor:instructor_id (
          full_name,
          avatar_url
        ),
        modules:modules (
          id,
          title,
          description,
          order_index,
          duration,
          content:module_content (
            id,
            title,
            content_type,
            order_index,
            duration,
            is_required
          )
        )
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Sort modules and content by order_index
    if (course.modules) {
      course.modules = course.modules
        .sort((a, b) => a.order_index - b.order_index)
        .map(module => ({
          ...module,
          content: module.content?.sort((a, b) => a.order_index - b.order_index) || []
        }));
    }

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Course fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course'
    });
  }
}));

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll in a course
 * @access  Private (Student/Admin)
 */
router.post('/:id/enroll', authenticateToken, requireStudent, [
  param('id').isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid course ID'
    });
  }

  const { id: courseId } = req.params;
  const userId = req.user.id;

  try {
    // Check if course exists and is published
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, status')
      .eq('id', courseId)
      .eq('status', 'published')
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available'
      });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create enrollment
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to enroll in course'
      });
    }

    // Log activity
    await supabaseAdmin
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: 'course_enrollment',
        activity_data: { course_id: courseId, course_title: course.title }
      });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course'
    });
  }
}));

/**
 * @route   GET /api/courses/:id/progress
 * @desc    Get user's progress for a specific course
 * @access  Private (Student/Admin)
 */
router.get('/:id/progress', authenticateToken, [
  param('id').isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid course ID'
    });
  }

  const { id: courseId } = req.params;
  const userId = req.user.id;

  try {
    // Get enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError || !enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Get course modules and progress
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select(`
        id,
        title,
        order_index,
        duration,
        content:module_content (
          id,
          title,
          content_type,
          order_index,
          duration,
          is_required
        )
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (modulesError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch course modules'
      });
    }

    // Get user progress
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .in('module_id', modules.map(m => m.id));

    if (progressError) {
      console.error('Progress fetch error:', progressError);
    }

    // Combine modules with progress data
    const modulesWithProgress = modules.map(module => {
      const moduleProgress = progress?.filter(p => p.module_id === module.id) || [];
      const completedContent = moduleProgress.filter(p => p.status === 'completed').length;
      const totalContent = module.content?.length || 0;
      
      return {
        ...module,
        progress: moduleProgress,
        completionPercentage: totalContent > 0 ? (completedContent / totalContent) * 100 : 0,
        isCompleted: completedContent === totalContent && totalContent > 0
      };
    });

    // Calculate overall progress
    const totalModules = modules.length;
    const completedModules = modulesWithProgress.filter(m => m.isCompleted).length;
    const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    res.json({
      success: true,
      data: {
        enrollment,
        modules: modulesWithProgress,
        overallProgress,
        completedModules,
        totalModules
      }
    });

  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course progress'
    });
  }
}));

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/progress
 * @desc    Update progress for a specific module
 * @access  Private (Student/Admin)
 */
router.post('/:courseId/modules/:moduleId/progress', authenticateToken, [
  param('courseId').isUUID(),
  param('moduleId').isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid course or module ID'
    });
  }

  const { courseId, moduleId } = req.params;
  const { contentId, status, timeSpent = 0, progressData = {} } = req.body;
  const userId = req.user.id;

  try {
    // Verify enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Update or create progress record
    const progressRecord = {
      user_id: userId,
      module_id: moduleId,
      content_id: contentId,
      status,
      time_spent: timeSpent,
      progress_data: progressData
    };

    if (status === 'completed') {
      progressRecord.completed_at = new Date().toISOString();
    } else if (status === 'in_progress') {
      progressRecord.started_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .upsert(progressRecord, {
        onConflict: 'user_id,module_id,content_id'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update progress'
      });
    }

    // Update enrollment progress percentage
    await updateEnrollmentProgress(userId, courseId);

    // Log activity
    if (status === 'completed') {
      await supabaseAdmin
        .from('user_activity')
        .insert({
          user_id: userId,
          activity_type: 'module_complete',
          activity_data: { course_id: courseId, module_id: moduleId, content_id: contentId }
        });
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data
    });

  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
}));

/**
 * Helper function to update enrollment progress percentage
 */
async function updateEnrollmentProgress(userId, courseId) {
  try {
    // Get all modules for the course
    const { data: modules } = await supabaseAdmin
      .from('modules')
      .select(`
        id,
        content:module_content(id, is_required)
      `)
      .eq('course_id', courseId);

    if (!modules) return;

    // Count total required content items
    const totalRequiredContent = modules.reduce((total, module) => {
      return total + (module.content?.filter(c => c.is_required).length || 0);
    }, 0);

    if (totalRequiredContent === 0) return;

    // Count completed required content items
    const { data: completedProgress } = await supabaseAdmin
      .from('user_progress')
      .select('content_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('module_id', modules.map(m => m.id));

    const completedRequiredContent = completedProgress?.length || 0;
    const progressPercentage = (completedRequiredContent / totalRequiredContent) * 100;

    // Update enrollment
    await supabaseAdmin
      .from('enrollments')
      .update({
        progress_percentage: progressPercentage,
        started_at: progressPercentage > 0 ? new Date().toISOString() : null,
        completed_at: progressPercentage >= 100 ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('course_id', courseId);

  } catch (error) {
    console.error('Error updating enrollment progress:', error);
  }
}

module.exports = router;