import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName || user?.email}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's your learning dashboard
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
          <p className="text-gray-600">View and continue your enrolled courses</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress</h3>
          <p className="text-gray-600">Track your learning progress</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Certificates</h3>
          <p className="text-gray-600">View your earned certificates</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;