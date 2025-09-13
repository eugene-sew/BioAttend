import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';

// Global face-api.js models loading state
let modelsLoadingPromise = null;
let areModelsLoaded = false;

const CameraCapture = forwardRef(
  (
    {
      onCapture,
      onClose,
      isOpen = true,
      allowRetake = true,
      showControls = true,
      hideConfirmOnCapture = false,
    },
    ref
  ) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [capturedCount, setCapturedCount] = useState(0);
    const [detectionStatus, setDetectionStatus] = useState('Loading models...');
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectionIntervalRef = useRef(null);

    // Load face-api.js models (singleton pattern for global caching)
    const loadModels = useCallback(async () => {
      try {
        // If models are already loaded globally, just update local state
        if (areModelsLoaded) {
          setModelsLoaded(true);
          setDetectionStatus('Models ready');
          return;
        }

        // If models are currently being loaded, wait for that promise
        if (modelsLoadingPromise) {
          setDetectionStatus('Loading face detection models...');
          await modelsLoadingPromise;
          setModelsLoaded(true);
          setDetectionStatus('Models ready');
          return;
        }

        // Start loading models and cache the promise globally
        setDetectionStatus('Loading face detection models...');
        modelsLoadingPromise = Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);

        await modelsLoadingPromise;
        areModelsLoaded = true;
        setModelsLoaded(true);
        setDetectionStatus('Models ready');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setDetectionStatus('Failed to load face detection models');
        toast.error('Failed to load face detection models. Some features may not work.');
        // Reset global state on error
        modelsLoadingPromise = null;
        areModelsLoaded = false;
      }
    }, []);

    // Start face detection loop
    const startFaceDetection = useCallback(() => {
      if (!modelsLoaded || !videoRef.current || !overlayCanvasRef.current) return;

      const video = videoRef.current;
      const canvas = overlayCanvasRef.current;
      
      const ctx = canvas.getContext('2d');
      let consecutiveDetections = 0;
      let lastDetectionTime = 0;
      
      detectionIntervalRef.current = setInterval(async () => {
        try {
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            // Update canvas dimensions to match video on each frame
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            // Use more sensitive detection options for better accuracy with darker skin tones
            const detectionOptions = new faceapi.TinyFaceDetectorOptions({
              inputSize: 416, // Higher input size for better accuracy
              scoreThreshold: 0.3 // Lower threshold for more sensitive detection
            });

            const detections = await faceapi
              .detectSingleFace(video, detectionOptions)
              .withFaceLandmarks()
              .withFaceExpressions();

            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const currentTime = Date.now();

            if (detections) {
              consecutiveDetections++;
              lastDetectionTime = currentTime;
              
              // Only update state after 2 consecutive detections to reduce flickering
              if (consecutiveDetections >= 2) {
                setFaceDetected(true);
                setDetectionStatus('Face detected!');
              }
              
              // Draw detection box and landmarks with better visibility
              const displaySize = { width: canvas.width, height: canvas.height };
              faceapi.matchDimensions(canvas, displaySize);
              
              // Resize detections to match canvas
              const resizedDetections = faceapi.resizeResults(detections, displaySize);
              
              // Draw detection box
              ctx.strokeStyle = '#00ff00'; // Bright green
              ctx.lineWidth = 3;
              faceapi.draw.drawDetections(canvas, resizedDetections);
              
              // Draw landmarks with better visibility
              ctx.fillStyle = '#00ff00';
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
              
              // Keep face detection for visual feedback only - no auto-capture
            } else {
              // Only reset face detected state if we haven't detected a face for 2 seconds
              if (currentTime - lastDetectionTime > 2000) {
                consecutiveDetections = 0;
                setFaceDetected(false);
                setDetectionStatus('Adjusting lighting...');
              }
            }
          }
        } catch (error) {
          console.error('Face detection error:', error);
          setDetectionStatus('Face detection error - try adjusting lighting');
        }
      }, 500); // Run detection twice per second for smoother experience
    }, [modelsLoaded]);

    // Stop face detection
    const stopFaceDetection = useCallback(() => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      
      // Clear overlay canvas
      if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
      
      setFaceDetected(false);
      setCapturedCount(0);
    }, []);

    // Start camera stream
    const startCamera = useCallback(async () => {
      try {
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: facingMode,
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsStreaming(true);
          
          // Start face detection when video is ready
          videoRef.current.addEventListener('loadeddata', () => {
            if (modelsLoaded) {
              startFaceDetection();
            }
          });
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error('Failed to access camera. Please check permissions.');
        return;
      }
    }, [facingMode, modelsLoaded, startFaceDetection]);

    // Stop camera stream
    const stopCamera = useCallback(() => {
      stopFaceDetection();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsStreaming(false);
      }
    }, [stopFaceDetection]);

    // Capture photo from video stream
    const capturePhoto = useCallback(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to canvas (mirrored)
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.scale(-1, 1); // Reset scale

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(dataUrl);

      // For enrollment mode, increment capture count and auto-process
      if (hideConfirmOnCapture) {
        setCapturedCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 5) {
            setDetectionStatus('5 images captured! Processing...');
            // Only stop camera when all 5 images are captured
            stopCamera();
          } else {
            setDetectionStatus('Image captured! Click capture for next image.');
          }
          return newCount;
        });
        
        // Auto-process the image in enrollment mode
        setTimeout(() => {
          if (onCapture) {
            onCapture(dataUrl).then(() => {
              setCapturedImage(null); // Clear for next capture
            }).catch(error => {
              console.error('Error processing image:', error);
              toast.error('Failed to process image');
              setCapturedImage(null);
            });
          }
        }, 100); // Small delay to ensure state updates
      } else {
        // For single capture mode (attendance), stop camera for review
        stopCamera();
      }
    }, [stopCamera, hideConfirmOnCapture, onCapture]);

    // Expose imperative API to parent
    useImperativeHandle(
      ref,
      () => ({
        capture: () => capturePhoto(),
        start: () => startCamera(),
        stop: () => stopCamera(),
      }),
      [capturePhoto, startCamera, stopCamera]
    );

    // Retake photo
    const retakePhoto = useCallback(() => {
      setCapturedImage(null);
      startCamera();
    }, [startCamera]);

    // Switch camera (front/back)
    const switchCamera = useCallback(() => {
      stopCamera();
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    }, [stopCamera]);

    // Load models on component mount
    useEffect(() => {
      loadModels();
    }, [loadModels]);

    // Start face detection when models are loaded and camera is streaming
    useEffect(() => {
      if (modelsLoaded && isStreaming && videoRef.current) {
        startFaceDetection();
      }
      return () => {
        stopFaceDetection();
      };
    }, [modelsLoaded, isStreaming, startFaceDetection, stopFaceDetection]);

    // Handle modal close
    const handleClose = useCallback(() => {
      stopCamera();
      setCapturedImage(null);
      if (onClose) onClose();
    }, [stopCamera, onClose]);

    // Confirm and send captured image
    const confirmCapture = useCallback(async () => {
      if (capturedImage && onCapture) {
        setIsLoading(true);
        try {
          // Send the full data URL so the callee can convert to Blob reliably
          await onCapture(capturedImage);
          if (!hideConfirmOnCapture) {
            handleClose();
          } else {
            // For enrollment mode, just clear the captured image
            // Camera should already be running for next capture
            setCapturedImage(null);
          }
        } catch (error) {
          console.error('Error processing image:', error);
          toast.error('Failed to process image');
        } finally {
          setIsLoading(false);
        }
      }
    }, [capturedImage, onCapture, hideConfirmOnCapture, handleClose]);

    // Start camera when modal opens
    useEffect(() => {
      if (isOpen && (!capturedImage || hideConfirmOnCapture)) {
        startCamera();
      }
      return () => {
        stopCamera();
      };
    }, [isOpen, capturedImage, hideConfirmOnCapture, startCamera, stopCamera]);

    // Update camera when facing mode changes
    useEffect(() => {
      if (isStreaming) {
        stopCamera();
        startCamera();
      }
    }, [facingMode]);

    // Render as embedded component or modal based on isOpen prop
    const renderContent = () => (
      <>
        {/* Camera/Image Display */}
        <div
          className="relative overflow-hidden rounded-lg bg-black"
          style={{ aspectRatio: '4/3' }}
        >
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {/* Face detection overlay canvas */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 h-full w-full pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />
              {/* Camera controls overlay */}
              {showControls && (
                <div className="absolute bottom-4 right-4">
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="rounded-full bg-white bg-opacity-80 p-2 transition-opacity hover:bg-opacity-100"
                    title="Switch Camera"
                  >
                    <svg
                      className="h-5 w-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {/* Face detection status */}
              {modelsLoaded && (
                <div className="absolute top-4 left-4 right-4">
                  <div className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    faceDetected 
                      ? 'bg-green-500 bg-opacity-90 text-white' 
                      : 'bg-yellow-500 bg-opacity-90 text-white'
                  }`}>
                    {detectionStatus}
                  </div>
                </div>
              )}
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Instructions */}
        {!capturedImage && showControls && (
          <div className="mt-3 text-sm text-gray-600">
            {modelsLoaded ? (
              <div>
                <p>
                  {faceDetected 
                    ? 'Great! Your face is detected. Click capture when ready.' 
                    : 'Position your face in the center of the frame. Try adjusting lighting if needed.'}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  💡 Tips: Face the camera directly, ensure good lighting, avoid shadows on your face
                </p>
              </div>
            ) : (
              <p>Loading face detection models...</p>
            )}
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="mt-4 flex justify-center gap-2">
            {!capturedImage ? (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!isStreaming}
                className="inline-flex justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {hideConfirmOnCapture && capturedCount < 5
                  ? `Capture ${capturedCount + 1}/5`
                  : 'Capture'}
              </button>
            ) : (
              !hideConfirmOnCapture && (
                <>
                  <button
                    type="button"
                    onClick={confirmCapture}
                    disabled={isLoading}
                    className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Confirm'}
                  </button>
                  {allowRetake && (
                    <button
                      type="button"
                      onClick={retakePhoto}
                      disabled={isLoading}
                      className="inline-flex justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 disabled:opacity-50"
                    >
                      Retake
                    </button>
                  )}
                </>
              )
            )}
          </div>
        )}
      </>
    );

    // If not open, return null (for modal mode)
    if (!isOpen) return null;

    // If this is being used as a modal (has onClose), render modal wrapper
    if (onClose) {
      return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <h3 className="mb-4 text-lg font-semibold leading-6 text-gray-900">
                      Capture Photo for Attendance
                    </h3>
                    {renderContent()}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="gap-2 bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Otherwise, render as embedded component
    return <div className="w-full">{renderContent()}</div>;
  }
);

export default CameraCapture;
