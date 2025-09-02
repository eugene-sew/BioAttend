import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { facialApi, userApi } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import BiometricEnrollmentModal from '../../components/attendance/BiometricEnrollmentModal';

const ACCEPTED_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'application/zip',
  'application/x-zip-compressed',
];

function humanFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

const BiometricStatus = () => {
  const user = useAuthStore((s) => s.user);

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [openCapture, setOpenCapture] = useState(false);

  // Fetch current user to ensure we have freshest student info (and to demo status area even if 404)
  const profileQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => userApi.getProfile().then((r) => r.data),
    enabled: !!user,
  });

  // Derive the proper students.student_id expected by backend.
  // Never fall back to user.id (UUID), as backend expects the Student.student_id string (e.g., ST0YY00xxx).
  const studentId = useMemo(() => {
    const fromProfile =
      profileQuery?.data?.student_profile?.student_id || profileQuery?.data?.student_id;
    const fromUser = user?.student_profile?.student_id || user?.student?.student_id || user?.student_id;
    return fromProfile || fromUser || '';
  }, [profileQuery?.data, user]);

  // Fetch enrollment status (gracefully handle 404)
  const enrollmentQuery = useQuery({
    queryKey: ['facial-enrollment', studentId],
    queryFn: async () => {
      const { data } = await facialApi.getEnrollmentSmart(studentId);
      return data;
    },
    enabled: !!studentId,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      // Do not spam retries on 404 (not enrolled yet) or 403 (no student profile)
      if (status === 404 || status === 403) return false;
      return failureCount < 1;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('media', file);
      const { data } = await facialApi.enrollSmart(studentId, form, {
        onUploadProgress: (e) => {
          if (e && e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            // Throttle toasts: use id to update
            toast.dismiss('enroll-progress');
            toast.loading(`Uploading… ${pct}%`, { id: 'enroll-progress' });
          }
        },
      });
      return data;
    },
    onSuccess: (data) => {
      toast.dismiss('enroll-progress');
      if (data?.success) {
        toast.success(data?.message || 'Enrollment successful');
      } else {
        toast.error(data?.message || 'Enrollment completed with issues');
      }
      // Refresh status
      enrollmentQuery.refetch();
    },
    onError: (error) => {
      toast.dismiss('enroll-progress');
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        'Enrollment failed';
      toast.error(msg);
    },
  });

  const onFileSelected = (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error(
        'Unsupported file type. Upload MP4/MOV/AVI video or a ZIP of images.'
      );
      return;
    }
    if (f.size > 1024 * 1024 * 1024) {
      toast.error('File too large. Max 1GB.');
      return;
    }
    setFile(f);
  };

  const handleInputChange = (e) => onFileSelected(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    onFileSelected(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);

  const startEnroll = () => {
    if (!studentId) {
      toast.error('Missing student ID. Please re-login.');
      return;
    }
    if (!file) {
      toast.error('Please select a video file or ZIP of images.');
      return;
    }
    if (enrollMutation.isPending) return;
    enrollMutation.mutate(file);
  };

  const enrollment = enrollmentQuery.data;
  const hasEnrollment = !!enrollment && enrollment.success !== false;

  const enrollmentSummary = useMemo(() => {
    if (!hasEnrollment) return null;
    const e = enrollment?.enrollment || enrollment; // support either wrapper
    return {
      name: e?.student_name,
      studentId: e?.student_id || e?.student,
      thumbnail: e?.thumbnail,
      confidence: e?.face_confidence,
      quality: e?.embedding_quality,
      faces: e?.num_faces_detected,
      date: e?.enrollment_date || e?.last_updated,
    };
  }, [hasEnrollment, enrollment]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">
          Facial Biometric Enrollment
        </h2>
        <p className="mt-2 text-gray-600">
          Upload a short face video (MP4/MOV/AVI) or a ZIP archive of face
          images to enroll your biometrics.
        </p>

        {/* Status Section */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Current Status</h3>
          {enrollmentQuery.isLoading ? (
            <div className="py-6">
              <LoadingSpinner />
            </div>
          ) : !studentId ? (
            <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-red-800">
              <p className="font-medium">No Student Profile Found</p>
              <p className="mt-1 text-sm">
                Your account is not associated with a student profile. Please
                contact an administrator to create your student profile before
                enrolling biometric data.
              </p>
              <p className="mt-2 text-xs text-red-600">
                User ID: {user?.id} | Role: {user?.role || 'Unknown'}
              </p>
            </div>
          ) : enrollmentQuery.error?.response?.status === 404 &&
            enrollmentQuery.error?.response?.data?.error_code ===
              'MISSING_STUDENT_PROFILE' ? (
            <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-red-800">
              <p className="font-medium">Student Profile Not Found</p>
              <p className="mt-1 text-sm">
                {enrollmentQuery.error.response.data.detail}
              </p>
              <p className="mt-2 text-xs text-red-600">
                Student ID: {studentId} | User:{' '}
                {enrollmentQuery.error.response.data.email}
              </p>
            </div>
          ) : hasEnrollment ? (
            <div className="mt-4 flex items-start gap-4">
              {enrollmentSummary?.thumbnail ? (
                <img
                  src={enrollmentSummary.thumbnail}
                  alt="Enrollment thumbnail"
                  className="h-24 w-24 rounded border object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded border bg-gray-100 text-gray-400">
                  No Image
                </div>
              )}
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Student:</span>{' '}
                  {enrollmentSummary?.name || '—'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Student ID:</span>{' '}
                  {enrollmentSummary?.studentId || '—'}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Face Confidence:</span>{' '}
                    {enrollmentSummary?.confidence ?? '—'}
                  </p>
                  <p>
                    <span className="font-medium">Embedding Quality:</span>{' '}
                    {enrollmentSummary?.quality ?? '—'}
                  </p>
                  <p>
                    <span className="font-medium">Faces Detected:</span>{' '}
                    {enrollmentSummary?.faces ?? '—'}
                  </p>
                  <p>
                    <span className="font-medium">Updated:</span>{' '}
                    {enrollmentSummary?.date
                      ? new Date(enrollmentSummary.date).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <p className="mt-3 inline-block rounded bg-green-50 px-2 py-1 text-green-700">
                  Enrolled
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
              No facial enrollment found for your account. Please upload a video
              or ZIP below to enroll your face.
            </div>
          )}
        </div>

        {/* Upload Section */}
        {studentId ? (
          <>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Media
              </h3>
              <div
                className={`mt-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  id="media"
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,application/zip"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <label htmlFor="media" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-gray-600">
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
                        d="M7 16V7a4 4 0 118 0v9m-4 5v-5m-7 0h14"
                      />
                    </svg>
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm">or drag and drop a file here</p>
                    <p className="text-xs text-gray-500">
                      MP4, MOV, AVI video or ZIP up to 1GB
                    </p>
                  </div>
                </label>
                {file && (
                  <div className="mt-4 text-sm text-gray-700">
                    Selected: <span className="font-medium">{file.name}</span>{' '}
                    <span className="text-gray-500">
                      ({humanFileSize(file.size)})
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={startEnroll}
                  disabled={!file || enrollMutation.isPending}
                  className={`rounded-md px-4 py-2 text-white ${!file || enrollMutation.isPending ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {enrollMutation.isPending ? 'Uploading…' : 'Start Enrollment'}
                </button>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                  >
                    Clear File
                  </button>
                )}
                <button
                  onClick={() => {
                    console.debug('[BiometricStatus] opening modal', {
                      studentId,
                      openCapture,
                    });
                    setOpenCapture(true);
                  }}
                  className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900"
                >
                  Capture via Camera
                </button>
              </div>
            </div>

            <BiometricEnrollmentModal
              isOpen={openCapture}
              onClose={() => {
                console.debug('[BiometricStatus] modal closing');
                setOpenCapture(false);
              }}
              studentName={
                profileQuery.data?.full_name ||
                user?.full_name ||
                user?.username
              }
              studentId={studentId}
              onEnrolled={() => {
                console.debug(
                  '[BiometricStatus] enrollment completed, refetching'
                );
                setOpenCapture(false);
                enrollmentQuery.refetch();
              }}
            />
          </>
        ) : (
          <div className="mt-8 rounded-lg bg-gray-50 p-6">
            <h3 className="text-lg font-medium text-gray-500">Upload Media</h3>
            <p className="mt-2 text-gray-600">
              Media upload is disabled because no student profile was found for
              your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiometricStatus;

// Modal Mount
// Render the BiometricEnrollmentModal alongside export default in same file scope is not typical.
// Consumers (route) will render the page; we render modal within the component tree just above return end.
