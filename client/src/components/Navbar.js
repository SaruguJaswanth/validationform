import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  BookOpenIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Courses', href: '/courses', icon: BookOpenIcon },
    ...(user?.role === 'admin' ? [
      { name: 'Admin Panel', href: '/admin', icon: Cog6ToothIcon }
    ] : [])
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">JL Learning Studio</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/admin' && location.pathname.startsWith('/admin'));
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            {/* Face detection indicator */}
            {user?.faceEnabled && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Face ID Enabled
              </div>
            )}
            
            {/* User role badge */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              user?.role === 'admin' 
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user?.role === 'admin' ? 'Admin' : 'Student'}
            </div>

            {/* User menu dropdown */}
            <div className="relative">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors duration-200">
                <UserCircleIcon className="h-6 w-6" />
                <span className="text-sm font-medium">{user?.fullName || user?.email}</span>
              </button>
            </div>

            {/* Face setup link */}
            {!user?.faceEnabled && (
              <Link
                to="/face-setup"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
              >
                Setup Face ID
              </Link>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href === '/admin' && location.pathname.startsWith('/admin'));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-2 text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Mobile user info */}
            <div className="px-4 py-2 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              
              {!user?.faceEnabled && (
                <Link
                  to="/face-setup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 block text-blue-600 text-sm font-medium"
                >
                  Setup Face ID
                </Link>
              )}
              
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="mt-2 flex items-center space-x-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;