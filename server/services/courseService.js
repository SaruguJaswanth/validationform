/**
 * Course Service
 * Handles course management, modules, and user progress tracking
 */

const { supabaseAdmin, TABLES } = require('../config/database');

/**
 * Create a new course (Admin only)
 * @param {Object} courseData - Course data
 * @param {string} adminId - Admin user ID
 * @returns {Object} Result object with success status and data
 */
const createCourse = async (courseData, adminId) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      price = 0,
      imageUrl,
      isPublished = false
    } = courseData;

    const { data: course, error } = await supabaseAdmin
      .from(TABLES.COURSES)
      .insert([
        {
          title,
          description,
          category,
          difficulty,
          duration,
          price,
          image_url: imageUrl,
          is_published: isPublished,
          created_by: adminId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: 'Failed to create course'
      };
    }

    return {
      success: true,
      message: 'Course created successfully',
      data: course
    };

  } catch (error) {
    console.error('Create course error:', error);
    return {
      success: false,
      message: 'Failed to create course'
    };
  }
};

/**
 * Update a course (Admin only)
 * @param {string} courseId - Course ID
 * @param {Object} updateData - Data to update
 * @param {string} adminId - Admin user ID
 * @returns {Object} Result object with success status and data
 */
const updateCourse = async (courseId, updateData, adminId) => {
  try {
    const allowedFields = [
      'title', 'description', 'category', 'difficulty', 
      'duration', 'price', 'image_url', 'is_published'
    ];
    
    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    updates.updated_at = new Date().toISOString();

    const { data: course, error } = await supabaseAdmin
      .from(TABLES.COURSES)
      .update(updates)
      .eq('id', courseId)
      .eq('created_by', adminId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: 'Failed to update course or course not found'
      };
    }

    return {
      success: true,
      message: 'Course updated successfully',
      data: course
    };

  } catch (error) {
    console.error('Update course error:', error);
    return {
      success: false,
      message: 'Failed to update course'
    };
  }
};

/**
 * Get all published courses
 * @param {Object} filters - Filter options
 * @returns {Object} Result object with success status and data
 */
const getCourses = async (filters = {}) => {
  try {
    let query = supabaseAdmin
      .from(TABLES.COURSES)
      .select(`
        *,
        profiles:created_by(first_name, last_name),
        modules:modules(count)
      `)
      .eq('is_published', true);

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data: courses, error } = await query;

    if (error) {
      return {
        success: false,
        message: 'Failed to fetch courses'
      };
    }

    return {
      success: true,
      data: {
        courses,
        pagination: {
          page,
          limit,
          hasMore: courses.length === limit
        }
      }
    };

  } catch (error) {
    console.error('Get courses error:', error);
    return {
      success: false,
      message: 'Failed to fetch courses'
    };
  }
};

/**
 * Get course by ID with modules
 * @param {string} courseId - Course ID
 * @param {string} userId - User ID (optional)
 * @returns {Object} Result object with success status and data
 */
const getCourseById = async (courseId, userId = null) => {
  try {
    const { data: course, error } = await supabaseAdmin
      .from(TABLES.COURSES)
      .select(`
        *,
        profiles:created_by(first_name, last_name),
        modules(
          id, title, description, order_index, 
          duration, video_url, content, is_published
        )
      `)
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (error || !course) {
      return {
        success: false,
        message: 'Course not found'
      };
    }

    // Sort modules by order_index
    if (course.modules) {
      course.modules = course.modules
        .filter(module => module.is_published)
        .sort((a, b) => a.order_index - b.order_index);
    }

    // Get user enrollment and progress if userId provided
    let enrollment = null;
    let progress = [];

    if (userId) {
      const { data: enrollmentData } = await supabaseAdmin
        .from(TABLES.ENROLLMENTS)
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      enrollment = enrollmentData;

      if (enrollment) {
        const { data: progressData } = await supabaseAdmin
          .from(TABLES.PROGRESS)
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', courseId);

        progress = progressData || [];
      }
    }

    return {
      success: true,
      data: {
        course,
        enrollment,
        progress
      }
    };

  } catch (error) {
    console.error('Get course error:', error);
    return {
      success: false,
      message: 'Failed to fetch course'
    };
  }
};

/**
 * Enroll user in a course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Object} Result object with success status and data
 */
const enrollInCourse = async (userId, courseId) => {
  try {
    // Check if course exists and is published
    const { data: course, error: courseError } = await supabaseAdmin
      .from(TABLES.COURSES)
      .select('id, title, price')
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      return {
        success: false,
        message: 'Course not found or not available'
      };
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from(TABLES.ENROLLMENTS)
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return {
        success: false,
        message: 'Already enrolled in this course'
      };
    }

    // Create enrollment
    const { data: enrollment, error } = await supabaseAdmin
      .from(TABLES.ENROLLMENTS)
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress: 0
        }
      ])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: 'Failed to enroll in course'
      };
    }

    return {
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    };

  } catch (error) {
    console.error('Enroll course error:', error);
    return {
      success: false,
      message: 'Failed to enroll in course'
    };
  }
};

/**
 * Update user progress for a module
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {string} moduleId - Module ID
 * @param {number} progress - Progress percentage (0-100)
 * @returns {Object} Result object with success status and data
 */
const updateProgress = async (userId, courseId, moduleId, progress) => {
  try {
    // Check if user is enrolled
    const { data: enrollment } = await supabaseAdmin
      .from(TABLES.ENROLLMENTS)
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) {
      return {
        success: false,
        message: 'Not enrolled in this course'
      };
    }

    // Upsert progress record
    const { data: progressRecord, error } = await supabaseAdmin
      .from(TABLES.PROGRESS)
      .upsert([
        {
          user_id: userId,
          course_id: courseId,
          module_id: moduleId,
          progress: Math.min(100, Math.max(0, progress)),
          completed: progress >= 100,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: 'Failed to update progress'
      };
    }

    // Calculate overall course progress
    const { data: allProgress } = await supabaseAdmin
      .from(TABLES.PROGRESS)
      .select('progress')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    const { data: totalModules } = await supabaseAdmin
      .from(TABLES.MODULES)
      .select('id')
      .eq('course_id', courseId)
      .eq('is_published', true);

    let overallProgress = 0;
    if (allProgress && totalModules && totalModules.length > 0) {
      const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
      overallProgress = Math.round(totalProgress / totalModules.length);
    }

    // Update enrollment progress
    await supabaseAdmin
      .from(TABLES.ENROLLMENTS)
      .update({ 
        progress: overallProgress,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    return {
      success: true,
      message: 'Progress updated successfully',
      data: {
        moduleProgress: progressRecord,
        overallProgress
      }
    };

  } catch (error) {
    console.error('Update progress error:', error);
    return {
      success: false,
      message: 'Failed to update progress'
    };
  }
};

/**
 * Get user's enrolled courses with progress
 * @param {string} userId - User ID
 * @returns {Object} Result object with success status and data
 */
const getUserCourses = async (userId) => {
  try {
    const { data: enrollments, error } = await supabaseAdmin
      .from(TABLES.ENROLLMENTS)
      .select(`
        *,
        courses(
          id, title, description, category, 
          difficulty, duration, image_url,
          profiles:created_by(first_name, last_name)
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      return {
        success: false,
        message: 'Failed to fetch user courses'
      };
    }

    return {
      success: true,
      data: enrollments
    };

  } catch (error) {
    console.error('Get user courses error:', error);
    return {
      success: false,
      message: 'Failed to fetch user courses'
    };
  }
};

module.exports = {
  createCourse,
  updateCourse,
  getCourses,
  getCourseById,
  enrollInCourse,
  updateProgress,
  getUserCourses
};