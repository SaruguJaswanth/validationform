import React from 'react';
import { useParams } from 'react-router-dom';

const CourseDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Course Details</h1>
        <p className="text-gray-600">Course ID: {id}</p>
        <p className="text-gray-600 mt-2">Course details and modules will be implemented here</p>
      </div>
    </div>
  );
};

export default CourseDetailsPage;