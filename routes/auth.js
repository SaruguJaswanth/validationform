/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin, supabaseClient } = require('../config/supabase');
const { asyncHandler } = require('../server/middleware/errorHandler');
const { authenticateToken } = require('../server/middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('role').optional().isIn(['admin', 'student'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password, fullName, role = 'student' } = req.body;

  try {
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // Update profile with role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name: fullName,
        role: role 
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: authData.user.id,
        email: authData.user.email,
        role: role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Log user activity
    await supabaseAdmin
      .from('user_activity')
      .insert({
        user_id: authData.user.id,
        activity_type: 'registration',
        activity_data: { ip_address: req.ip, user_agent: req.get('User-Agent') },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName: fullName,
          role: role
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or inactive'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: authData.user.id,
        email: authData.user.email,
        role: profile.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login
    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Log user activity
    await supabaseAdmin
      .from('user_activity')
      .insert({
        user_id: authData.user.id,
        activity_type: 'login',
        activity_data: { ip_address: req.ip, user_agent: req.get('User-Agent') },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
          avatarUrl: profile.avatar_url,
          faceEnabled: profile.face_enabled
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
}));

/**
 * @route   POST /api/auth/face-login
 * @desc    Login user with face recognition
 * @access  Public
 */
router.post('/face-login', [
  body('faceDescriptor').isArray(),
  body('email').optional().isEmail().normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { faceDescriptor, email } = req.body;

  try {
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('face_enabled', true)
      .not('face_descriptor', 'is', null);

    if (email) {
      query = query.eq('email', email);
    }

    const { data: profiles, error: profileError } = await query;

    if (profileError || !profiles.length) {
      return res.status(401).json({
        success: false,
        message: 'Face recognition not enabled or no matching profile'
      });
    }

    // Find matching face (simplified - in production, use proper face matching algorithm)
    let matchedProfile = null;
    const threshold = 0.6; // Face similarity threshold

    for (const profile of profiles) {
      if (profile.face_descriptor) {
        // Calculate Euclidean distance between face descriptors
        const storedDescriptor = profile.face_descriptor;
        const distance = calculateFaceDistance(faceDescriptor, storedDescriptor);
        
        if (distance < threshold) {
          matchedProfile = profile;
          break;
        }
      }
    }

    if (!matchedProfile) {
      return res.status(401).json({
        success: false,
        message: 'Face not recognized'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: matchedProfile.id,
        email: matchedProfile.email,
        role: matchedProfile.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login
    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', matchedProfile.id);

    // Log user activity
    await supabaseAdmin
      .from('user_activity')
      .insert({
        user_id: matchedProfile.id,
        activity_type: 'face_login',
        activity_data: { ip_address: req.ip, user_agent: req.get('User-Agent') },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    res.json({
      success: true,
      message: 'Face login successful',
      data: {
        user: {
          id: matchedProfile.id,
          email: matchedProfile.email,
          fullName: matchedProfile.full_name,
          role: matchedProfile.role,
          avatarUrl: matchedProfile.avatar_url,
          faceEnabled: matchedProfile.face_enabled
        },
        token
      }
    });

  } catch (error) {
    console.error('Face login error:', error);
    res.status(500).json({
      success: false,
      message: 'Face login failed'
    });
  }
}));

/**
 * @route   POST /api/auth/setup-face
 * @desc    Setup face recognition for user
 * @access  Private
 */
router.post('/setup-face', authenticateToken, [
  body('faceDescriptor').isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { faceDescriptor } = req.body;

  try {
    // Update user profile with face descriptor
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        face_descriptor: faceDescriptor,
        face_enabled: true
      })
      .eq('id', req.user.id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to setup face recognition'
      });
    }

    res.json({
      success: true,
      message: 'Face recognition setup successfully'
    });

  } catch (error) {
    console.error('Face setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Face setup failed'
    });
  }
}));

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        avatarUrl: profile.avatar_url,
        faceEnabled: profile.face_enabled,
        createdAt: profile.created_at,
        lastLogin: profile.last_login
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, [
  body('fullName').optional().trim().isLength({ min: 2 }),
  body('avatarUrl').optional().isURL()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { fullName, avatarUrl } = req.body;

  try {
    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (avatarUrl) updateData.avatar_url = avatarUrl;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        avatarUrl: data.avatar_url,
        faceEnabled: data.face_enabled
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Log user activity
    await supabaseAdmin
      .from('user_activity')
      .insert({
        user_id: req.user.id,
        activity_type: 'logout',
        activity_data: { ip_address: req.ip, user_agent: req.get('User-Agent') },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
}));

/**
 * Helper function to calculate distance between face descriptors
 * @param {Array} descriptor1 - First face descriptor
 * @param {Array} descriptor2 - Second face descriptor
 * @returns {number} - Euclidean distance
 */
function calculateFaceDistance(descriptor1, descriptor2) {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
  }
  return Math.sqrt(sum);
}

module.exports = router;