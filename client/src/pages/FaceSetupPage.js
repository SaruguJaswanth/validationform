import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FaceDetection from '../components/FaceDetection';

const FaceSetupPage = () => {
  const { setupFace } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFaceSetup = async (faceDescriptor) => {
    setIsLoading(true);
    setError('');

    const result = await setupFace(faceDescriptor);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4">
            Face ID Setup Complete!
          </h2>
          <p className="text-green-700">
            You can now use Face ID to log into your account. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Setup Face ID</h1>
        <p className="mt-2 text-gray-600">
          Configure face recognition for secure and convenient login
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <FaceDetection
          mode="setup"
          onFaceDetected={handleFaceSetup}
          onError={handleError}
        >
          {isLoading && (
            <div className="flex items-center justify-center mt-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Setting up Face ID...</span>
            </div>
          )}
        </FaceDetection>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default FaceSetupPage;