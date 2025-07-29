/**
 * Supabase Database Configuration
 * Handles connection to Supabase database and provides client instances
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

/**
 * Public Supabase client for client-side operations
 * Uses anonymous key with Row Level Security
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

/**
 * Admin Supabase client for server-side operations
 * Uses service role key to bypass Row Level Security
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Database table names
 */
const TABLES = {
  PROFILES: 'profiles',
  COURSES: 'courses',
  MODULES: 'modules',
  PROGRESS: 'user_progress',
  ENROLLMENTS: 'course_enrollments'
};

module.exports = {
  supabase,
  supabaseAdmin,
  TABLES
};