/* eslint-disable no-unused-vars */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
// import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';

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
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Start camera stream
    const startCamera = useCallback(async () => {
      // Start camera stream
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
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error('Failed to access camera. Please check permissions.');
        return;
      }
    }, [facingMode]);

    // Stop camera stream
    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsStreaming(false);
      }
    }, []);

    // Capture photo from video stream
    const capturePhoto = useCallback(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror the image horizontally for selfie mode
        context.save();
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();

        // Convert to base64 JPEG
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);

        // If hideConfirmOnCapture is true, immediately send the image
        if (hideConfirmOnCapture && onCapture) {
          onCapture(imageDataUrl);
          // Reset for next capture
          setCapturedImage(null);
          return;
        }

        // Stop camera after capture for review
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
            // Reset for next capture
            setCapturedImage(null);
            startCamera();
          }
        } catch (error) {
          console.error('Error processing image:', error);
          toast.error('Failed to process image');
        } finally {
          setIsLoading(false);
        }
      }
    }, [capturedImage, onCapture, hideConfirmOnCapture, startCamera]);

    // Handle modal close
    const handleClose = useCallback(() => {
      stopCamera();
      setCapturedImage(null);
      if (onClose) onClose();
    }, [stopCamera, onClose]);

    // Start camera when modal opens
    useEffect(() => {
      if (isOpen && !capturedImage) {
        startCamera();
      }
      return () => {
        stopCamera();
      };
    }, [isOpen]);

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
            <p>Position your face in the center of the frame and capture when ready.</p>
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
                Capture
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
