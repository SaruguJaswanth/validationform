import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  fallbackPath = '/login' 
}) => {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return (
      <Navigate 
        to="/dashboard" 
        replace 
      />
    );
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;