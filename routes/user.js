/**
 * User Routes
 * User dashboard and progress tracking
 */

const express = require('express');
const { param, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler } = require('../server/middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/user/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user enrollments with course details
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        *,
        course:course_id (
          id,
          title,
          description,
          thumbnail_url,
          difficulty_level,
          estimated_duration,
          instructor:instructor_id (
            full_name
          )
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (enrollmentError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch enrollments'
      });
    }

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabaseAdmin
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) {
      console.error('Activity fetch error:', activityError);
    }

    // Calculate statistics
    const totalEnrollments = enrollments.length;
    const completedCourses = enrollments.filter(e => e.completed_at).length;
    const inProgressCourses = enrollments.filter(e => e.started_at && !e.completed_at).length;
    const averageProgress = totalEnrollments > 0 
      ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / totalEnrollments
      : 0;

    // Get certificates earned (for completed courses)
    const certificates = enrollments
      .filter(e => e.completed_at)
      .map(e => ({
        courseId: e.course_id,
        courseTitle: e.course.title,
        completedAt: e.completed_at,
        certificateId: `CERT-${e.id.substring(0, 8).toUpperCase()}`
      }));

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        },
        statistics: {
          totalEnrollments,
          completedCourses,
          inProgressCourses,
          averageProgress: Math.round(averageProgress * 100) / 100
        },
        enrollments,
        recentActivity: recentActivity || [],
        certificates
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
 * @route   GET /api/user/courses
 * @desc    Get user's enrolled courses
 * @access  Private
 */
router.get('/courses', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  try {
    let query = supabaseAdmin
      .from('enrollments')
      .select(`
        *,
        course:course_id (
          id,
          title,
          description,
          thumbnail_url,
          difficulty_level,
          estimated_duration,
          tags,
          instructor:instructor_id (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    // Filter by status
    if (status === 'completed') {
      query = query.not('completed_at', 'is', null);
    } else if (status === 'in_progress') {
      query = query.not('started_at', 'is', null).is('completed_at', null);
    } else if (status === 'not_started') {
      query = query.is('started_at', null);
    }

    const { data: enrollments, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch courses'
      });
    }

    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('User courses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
}));

/**
 * @route   GET /api/user/progress
 * @desc    Get user's overall learning progress
 * @access  Private
 */
router.get('/progress', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Get all user progress
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select(`
        *,
        module:module_id (
          title,
          course:course_id (
            title
          )
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (progressError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch progress'
      });
    }

    // Get learning streaks (consecutive days with activity)
    const { data: activityDays, error: activityError } = await supabaseAdmin
      .from('user_activity')
      .select('created_at')
      .eq('user_id', userId)
      .in('activity_type', ['module_complete', 'course_start'])
      .order('created_at', { ascending: false });

    let currentStreak = 0;
    let longestStreak = 0;
    
    if (activityDays && activityDays.length > 0) {
      const today = new Date();
      const activityDates = [...new Set(activityDays.map(a => 
        new Date(a.created_at).toDateString()
      ))];
      
      // Calculate current streak
      for (let i = 0; i < activityDates.length; i++) {
        const activityDate = new Date(activityDates[i]);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        if (activityDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Calculate longest streak
      let tempStreak = 1;
      for (let i = 1; i < activityDates.length; i++) {
        const currentDate = new Date(activityDates[i]);
        const previousDate = new Date(activityDates[i - 1]);
        const dayDiff = (previousDate - currentDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
    }

    // Calculate time spent (in hours)
    const totalTimeSpent = progress.reduce((total, p) => total + (p.time_spent || 0), 0);
    const timeSpentHours = Math.round((totalTimeSpent / 3600) * 100) / 100;

    // Get completion stats
    const completedItems = progress.filter(p => p.status === 'completed').length;
    const inProgressItems = progress.filter(p => p.status === 'in_progress').length;

    res.json({
      success: true,
      data: {
        progress,
        statistics: {
          totalProgress: progress.length,
          completedItems,
          inProgressItems,
          timeSpentHours,
          currentStreak,
          longestStreak
        }
      }
    });

  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress'
    });
  }
}));

/**
 * @route   GET /api/user/certificates
 * @desc    Get user's certificates
 * @access  Private
 */
router.get('/certificates', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Get completed courses
    const { data: completedCourses, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        *,
        course:course_id (
          id,
          title,
          description,
          instructor:instructor_id (
            full_name
          )
        )
      `)
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch certificates'
      });
    }

    // Generate certificate data
    const certificates = completedCourses.map(enrollment => ({
      id: `CERT-${enrollment.id.substring(0, 8).toUpperCase()}`,
      courseId: enrollment.course_id,
      courseTitle: enrollment.course.title,
      courseDescription: enrollment.course.description,
      instructorName: enrollment.course.instructor?.full_name,
      enrolledAt: enrollment.enrolled_at,
      completedAt: enrollment.completed_at,
      progressPercentage: enrollment.progress_percentage,
      downloadUrl: `/api/user/certificates/${enrollment.id}/download`
    }));

    res.json({
      success: true,
      data: certificates
    });

  } catch (error) {
    console.error('Certificates fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates'
    });
  }
}));

/**
 * @route   GET /api/user/activity
 * @desc    Get user's activity history
 * @access  Private
 */
router.get('/activity', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, type } = req.query;

  try {
    let query = supabaseAdmin
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('activity_type', type);
    }

    const { data: activities, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch activity'
      });
    }

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Activity fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity'
    });
  }
}));

/**
 * @route   GET /api/user/recommendations
 * @desc    Get course recommendations for user
 * @access  Private
 */
router.get('/recommendations', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's enrolled courses to understand preferences
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select(`
        course:course_id (
          tags,
          difficulty_level
        )
      `)
      .eq('user_id', userId);

    // Extract user preferences
    const userTags = [];
    const userDifficulties = [];
    
    enrollments?.forEach(enrollment => {
      if (enrollment.course.tags) {
        userTags.push(...enrollment.course.tags);
      }
      if (enrollment.course.difficulty_level) {
        userDifficulties.push(enrollment.course.difficulty_level);
      }
    });

    const mostCommonTags = [...new Set(userTags)].slice(0, 5);
    const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

    // Get recommended courses
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
        instructor:instructor_id (
          full_name
        )
      `)
      .eq('status', 'published')
      .not('id', 'in', `(${enrolledCourseIds.join(',')})`)
      .limit(10);

    // If user has preferences, filter by them
    if (mostCommonTags.length > 0) {
      query = query.overlaps('tags', mostCommonTags);
    }

    const { data: recommendations, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch recommendations'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        basedOn: {
          tags: mostCommonTags,
          difficulties: [...new Set(userDifficulties)]
        }
      }
    });

  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations'
    });
  }
}));

module.exports = router;