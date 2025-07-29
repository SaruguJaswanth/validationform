import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage courses, users, and platform settings
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Management</h3>
          <p className="text-gray-600">Create and manage courses</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
          <p className="text-gray-600">Manage student and admin accounts</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600">View platform statistics and reports</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;