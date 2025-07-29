/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */

const authService = require('../services/authService');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate role
    const validRoles = ['student', 'admin'];
    const userRole = role || 'student';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const result = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
      role: userRole
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await authService.loginUser({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await authService.getUserProfile(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get profile controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }

    const result = await authService.updateUserProfile(userId, {
      first_name: firstName,
      last_name: lastName
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Update profile controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Verify token (middleware endpoint)
 * GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticated by middleware)
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });

  } catch (error) {
    console.error('Verify token controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side
    // This endpoint just confirms the logout action
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyToken,
  logout
};