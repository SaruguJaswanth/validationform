import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/api';

// Authentication states
const AuthState = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  status: AuthState.LOADING,
  error: null
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        status: AuthState.LOADING,
        error: null
      };

    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        status: AuthState.AUTHENTICATED,
        error: null
      };

    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        status: AuthState.UNAUTHENTICATED,
        error: null
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        status: AuthState.ERROR,
        error: action.payload
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: ActionTypes.LOGOUT });
        return;
      }

      try {
        // Verify token and get user data
        const response = await apiService.auth.verify();
        
        if (response.success) {
          dispatch({
            type: ActionTypes.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token: token
            }
          });
        } else {
          // Invalid token
          localStorage.removeItem('token');
          dispatch({ type: ActionTypes.LOGOUT });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        dispatch({ type: ActionTypes.LOGOUT });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: ActionTypes.SET_LOADING });

    try {
      const response = await apiService.auth.login(credentials);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: response.data
        });
        return { success: true };
      } else {
        dispatch({
          type: ActionTypes.SET_ERROR,
          payload: response.message
        });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: message
      });
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: ActionTypes.SET_LOADING });

    try {
      const response = await apiService.auth.register(userData);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: response.data
        });
        return { success: true };
      } else {
        dispatch({
          type: ActionTypes.SET_ERROR,
          payload: response.message
        });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: message
      });
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: ActionTypes.LOGOUT });
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.auth.updateProfile(profileData);
      
      if (response.success) {
        dispatch({
          type: ActionTypes.UPDATE_USER,
          payload: response.data
        });
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, message };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Helper functions
  const isAuthenticated = state.status === AuthState.AUTHENTICATED;
  const isLoading = state.status === AuthState.LOADING;
  const isAdmin = state.user?.role === 'admin';
  const isStudent = state.user?.role === 'student';

  const value = {
    // State
    user: state.user,
    token: state.token,
    status: state.status,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    clearError,

    // Helpers
    isAuthenticated,
    isLoading,
    isAdmin,
    isStudent,

    // Constants
    AuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;