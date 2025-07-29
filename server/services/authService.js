/**
 * Authentication Service
 * Handles user registration, login, and profile management with Supabase Auth
 */

const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin, TABLES } = require('../config/database');

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Result object with success status and data
 */
const registerUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, role = 'student' } = userData;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      }
    });

    if (authError) {
      return {
        success: false,
        message: authError.message
      };
    }

    // Create user profile in database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          first_name: firstName,
          last_name: lastName,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, try to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        message: 'Failed to create user profile'
      };
    }

    // Generate JWT token
    const token = generateToken(profile.id, profile.email, profile.role);

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role
        },
        token
      }
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed'
    };
  }
};

/**
 * Login user
 * @param {Object} credentials - User login credentials
 * @returns {Object} Result object with success status and data
 */
const loginUser = async (credentials) => {
  try {
    const { email, password } = credentials;

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: 'User profile not found'
      };
    }

    // Update last login time
    await supabaseAdmin
      .from(TABLES.PROFILES)
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    // Generate JWT token
    const token = generateToken(profile.id, profile.email, profile.role);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role
        },
        token
      }
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed'
    };
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Object} Result object with success status and data
 */
const getUserProfile = async (userId) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return {
        success: false,
        message: 'User profile not found'
      };
    }

    return {
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
        createdAt: profile.created_at,
        lastLogin: profile.last_login
      }
    };

  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      message: 'Failed to get user profile'
    };
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Result object with success status and data
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    const allowedFields = ['first_name', 'last_name'];
    const updates = {};

    // Filter allowed fields
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role
      }
    };

  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: 'Failed to update profile'
    };
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  generateToken
};