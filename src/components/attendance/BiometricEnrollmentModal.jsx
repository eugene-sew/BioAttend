/* eslint-disable tailwindcss/classnames-order */
import { useCallback, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import CameraCapture from './CameraCapture';
import JSZip from 'jszip';
import { facialApi } from '../../api/axios';
import { toast } from 'react-hot-toast';

const MAX_IMAGES = 5;

const Step = ({ index, label, active }) => (
  <div className="flex items-center gap-2">
    <div
      className={`flex h-6 w-6 items-center justify-center rounded-full text-sm text-white ${active ? 'bg-black' : 'bg-gray-300'}`}
    >
      {index}
    </div>
    <span className={`text-sm ${active ? 'text-gray-900' : 'text-gray-500'}`}>
      {label}
    </span>
  </div>
);

const StepsHeader = ({ step }) => (
  <div className="flex items-center justify-between">
    <Step index={1} label="Setup" active={step === 1} />
    <Step index={2} label="Capture" active={step === 2} />
    <Step index={3} label="Process" active={step === 3} />
    <Step index={4} label="Complete" active={step === 4} />
  </div>
);

export default function BiometricEnrollmentModal({
  isOpen,
  onClose,
  studentName,
  studentId,
  onEnrolled,
}) {
  console.debug('[BiometricEnrollmentModal] rendered', { isOpen, studentName, studentId });
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]); // data URLs
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);
  

  const progressPct = useMemo(
    () => Math.round((images.length / MAX_IMAGES) * 100),
    [images.length]
  );

  const reset = useCallback(() => {
    setStep(1);
    setImages([]);
    setIsProcessing(false);
    
  }, []);

  const handleStart = () => {
    console.debug('[BiometricEnrollmentModal] starting capture process');
    setStep(2);
  };

  const handleCapture = async (dataUrl) => {
    if (!dataUrl) return;
    setImages((prev) =>
      prev.length >= MAX_IMAGES ? prev : [...prev, dataUrl]
    );
  };

  const handleBack = () => {
    if (step === 2 && images.length > 0) {
      setImages((prev) => prev.slice(0, -1));
      return;
    }
    if (step > 1) setStep(step - 1);
  };

  const buildZipBlob = async () => {
    const zip = new JSZip();
    images.forEach((dataUrl, idx) => {
      const base64 = dataUrl.split(',')[1];
      zip.file(`image_${idx + 1}.jpg`, base64, { base64: true });
    });
    const content = await zip.generateAsync({ type: 'blob' });
    return new Blob([content], { type: 'application/zip' });
  };

  const handleSubmit = async () => {
    console.debug('[Enroll] submit clicked');
    if (images.length !== MAX_IMAGES) {
      toast.error(`Please capture ${MAX_IMAGES} images before submitting.`);
      return;
    }
    try {
      console.debug('[Enroll] submit clicked', {
        imagesCount: images.length,
        studentIdProp: studentId,
      });
      setIsProcessing(true);
      setStep(3);
      let payloadFile;
      let filename;
      toast.loading('Packaging images…', { id: 'enroll-progress' });
      const zipBlob = await buildZipBlob();
      payloadFile = zipBlob;
      filename = `biometric_${studentId || 'me'}.zip`;

      toast.loading('Uploading enrollment…', { id: 'enroll-progress' });
      const form = new FormData();
      form.append('media', payloadFile, filename);
      console.debug('[Enroll] prepared FormData', {
        filename,
        fileType: payloadFile?.type,
        fileSize: payloadFile?.size,
      });

      // Always use self-enroll for student flows to avoid empty path issues.
      console.debug('[Enroll] using endpoint:', '/api/students/me/enroll/');
      const { data } = await facialApi.enrollSelf(form, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          toast.loading(`Uploading... ${pct}%`, { id: 'enroll-progress' });
        },
      });

      toast.dismiss('enroll-progress');
      console.debug('[Enroll] response', {
        success: data?.success,
        message: data?.message,
      });
      if (data?.success) {
        setStep(4);
        toast.success(data?.message || 'Enrollment successful');
        onEnrolled?.(data);
      } else {
        setStep(2);
        toast.error(data?.message || 'Enrollment completed with issues');
      }
    } catch (err) {
      toast.dismiss('enroll-progress');
      setStep(2);
      const msg =
        err?.response?.data?.message || err?.message || 'Enrollment failed';
      console.debug('[Enroll] error', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-between">
      <button
        type="button"
        onClick={handleBack}
        className="rounded-md bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200"
        disabled={step === 1 || isProcessing}
      >
        Back
      </button>
      {step === 1 && (
        <button
          type="button"
          onClick={handleStart}
          className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900"
        >
          Start Capture Process
        </button>
      )}
      {step === 2 && (
        <button
          type="button"
          onClick={() => {
            console.debug('[BiometricEnrollmentModal] submit button clicked');
            handleSubmit();
          }}
          disabled={images.length !== MAX_IMAGES || isProcessing}
          className={`rounded-md px-4 py-2 text-white ${images.length === MAX_IMAGES && !isProcessing ? 'bg-black hover:bg-gray-900' : 'bg-gray-400'}`}
        >
          {isProcessing ? 'Processing…' : 'Process & Submit'}
        </button>
      )}
      {step >= 3 && (
        <button
          type="button"
          onClick={() => {
            onClose?.();
            reset();
          }}
          className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
        >
          Close
        </button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose?.();
        reset();
      }}
      title="Biometric Enrollment"
      size="3xl"
      footer={footer}
      className={'bg-white'}
    >
      <p className="text-sm text-gray-600">
        Enrolling biometric data for {studentName || 'student'}
      </p>
      <div className="mt-4">
        <StepsHeader step={step} />
      </div>

      {step === 1 && (
        <div className="mt-4">
          <div className="flex items-start gap-3 rounded-md border bg-gray-50 p-4 text-gray-700">
            <svg
              className="h-5 w-5 flex-shrink-0 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="mb-2">We will capture 5 images under slightly varied conditions for optimal recognition.</p>
              <p className="mt-3 text-sm text-gray-600">Ensure your face is well lit and centered. When ready, start the capture process.</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <div className="mx-auto w-full max-w-md">
            <>
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                <div className="h-full w-full">
                  <CameraCapture
                    ref={cameraRef}
                    onCapture={handleCapture}
                    allowRetake={false}
                    showControls={true}
                    hideConfirmOnCapture={true}
                  />
                </div>
              </div>
              <p className="mt-2 text-center text-sm text-gray-500">
                Camera feed appears above. Position face in the center and tap
                Capture.
              </p>

              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-2 bg-black"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-center text-sm">
                Images captured: {images.length} / {MAX_IMAGES}
              </p>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {images.map((src, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={src}
                        alt={`capture-${idx + 1}`}
                        className="h-20 w-full rounded border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"
                        aria-label="Remove image"
                      >
                        <svg
                          className="h-4 w-4 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < MAX_IMAGES && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.capture?.()}
                    className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900"
                  >
                    Capture Next Image
                  </button>
                </div>
              )}
            </>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8 flex flex-col items-center text-gray-700">
          <svg
            className="h-10 w-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2">Processing and uploading your captures…</p>
        </div>
      )}

      {step === 4 && (
        <div className="mt-8 flex flex-col items-center text-green-700">
          <svg
            className="h-10 w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2">Enrollment complete!</p>
        </div>
      )}
    </Modal>
  );
}
