import React from 'react';
import { Search, Filter } from 'lucide-react';

const CoursesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Explore Courses
          </h1>
          <p className="text-lg text-gray-600">
            Discover courses to expand your knowledge and skills
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="input pl-10"
                />
              </div>
            </div>
            <button className="btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-hover">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Course Title {i}
              </h3>
              <p className="text-gray-600 mb-4">
                Course description goes here...
              </p>
              <div className="flex items-center justify-between">
                <span className="badge-primary">Programming</span>
                <span className="text-lg font-semibold text-gray-900">Free</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;