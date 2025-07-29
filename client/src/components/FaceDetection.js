import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const FaceDetection = ({ onFaceDetected, onError, mode = 'login', children }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setModelLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setError('Failed to load face detection models');
        setIsLoading(false);
        onError?.('Failed to load face detection models');
      }
    };

    loadModels();
  }, [onError]);

  // Face detection function
  const detectFace = async () => {
    if (!webcamRef.current || !modelLoaded || isDetecting) return;

    setIsDetecting(true);
    setError(null);

    try {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      // Detect faces with landmarks and descriptors
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setError('No face detected. Please position your face in the camera.');
        return;
      }

      if (detections.length > 1) {
        setError('Multiple faces detected. Please ensure only one face is visible.');
        return;
      }

      const detection = detections[0];
      const descriptor = Array.from(detection.descriptor);

      // Clear canvas and draw detection
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw bounding box
      const box = resizedDetections[0].detection.box;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      setFaceDescriptor(descriptor);
      onFaceDetected?.(descriptor);

    } catch (error) {
      console.error('Face detection error:', error);
      setError('Face detection failed. Please try again.');
      onError?.('Face detection failed');
    } finally {
      setIsDetecting(false);
    }
  };

  // Auto-detect faces when in login mode
  useEffect(() => {
    if (!modelLoaded || mode !== 'login') return;

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [modelLoaded, mode]);

  const handleManualDetect = () => {
    detectFace();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading face detection...</p>
      </div>
    );
  }

  return (
    <div className="face-detection-container">
      <div className="relative inline-block">
        <Webcam
          ref={webcamRef}
          audio={false}
          width={640}
          height={480}
          screenshotFormat="image/jpeg"
          className="rounded-lg shadow-lg"
          onUserMediaError={(error) => {
            console.error('Webcam error:', error);
            setError('Camera access denied. Please allow camera access.');
            onError?.('Camera access denied');
          }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 rounded-lg"
          style={{ pointerEvents: 'none' }}
        />
        
        {/* Status overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
          
          {faceDescriptor && !error && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
              Face detected successfully!
            </div>
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div className="mt-4 flex justify-center space-x-4">
        {mode === 'setup' && (
          <button
            onClick={handleManualDetect}
            disabled={isDetecting || !modelLoaded}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDetecting ? 'Detecting...' : 'Capture Face'}
          </button>
        )}
        
        {children}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-600 max-w-md">
        <p className="mb-2">
          {mode === 'login' 
            ? 'Position your face in the camera for automatic detection'
            : 'Position your face in the camera and click "Capture Face" to set up Face ID'
          }
        </p>
        <ul className="text-xs space-y-1">
          <li>• Ensure good lighting</li>
          <li>• Keep your face centered</li>
          <li>• Remove glasses if possible</li>
          <li>• Stay still during detection</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceDetection;