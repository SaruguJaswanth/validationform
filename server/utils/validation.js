/**
 * Validation Utilities
 * Common validation functions for request data
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 100) {
    return { isValid: false, message: 'Password must be less than 100 characters' };
  }
  
  return { isValid: true, message: 'Password is valid' };
};

/**
 * Validate course difficulty levels
 * @param {string} difficulty - Difficulty level to validate
 * @returns {boolean} - True if valid difficulty
 */
const isValidDifficulty = (difficulty) => {
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  return validDifficulties.includes(difficulty?.toLowerCase());
};

/**
 * Validate course categories
 * @param {string} category - Category to validate
 * @returns {boolean} - True if valid category
 */
const isValidCategory = (category) => {
  const validCategories = [
    'programming',
    'web-development',
    'mobile-development',
    'data-science',
    'machine-learning',
    'design',
    'business',
    'marketing',
    'other'
  ];
  return validCategories.includes(category?.toLowerCase());
};

/**
 * Validate user roles
 * @param {string} role - Role to validate
 * @returns {boolean} - True if valid role
 */
const isValidRole = (role) => {
  const validRoles = ['student', 'admin'];
  return validRoles.includes(role?.toLowerCase());
};

/**
 * Validate progress percentage
 * @param {number} progress - Progress value to validate
 * @returns {boolean} - True if valid progress value
 */
const isValidProgress = (progress) => {
  return typeof progress === 'number' && progress >= 0 && progress <= 100;
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, maxLength = 1000) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.trim().substring(0, maxLength);
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID format
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate positive integer
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value (default: 1)
 * @param {number} max - Maximum value (default: Number.MAX_SAFE_INTEGER)
 * @returns {boolean} - True if valid positive integer
 */
const isValidPositiveInteger = (value, min = 1, max = Number.MAX_SAFE_INTEGER) => {
  const num = parseInt(value);
  return Number.isInteger(num) && num >= min && num <= max;
};

/**
 * Validate file type for uploads
 * @param {string} mimetype - MIME type to validate
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if valid file type
 */
const isValidFileType = (mimetype, allowedTypes = []) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate required fields in an object
 * @param {object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {object} - { isValid: boolean, missingFields: Array }
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

module.exports = {
  isValidEmail,
  validatePassword,
  isValidDifficulty,
  isValidCategory,
  isValidRole,
  isValidProgress,
  sanitizeString,
  isValidUUID,
  isValidPositiveInteger,
  isValidFileType,
  validateRequiredFields
};