import axios from 'axios';
import config from '../config';
import useAuthStore from '../store/authStore';

/**
 * Create axios instance with base configuration
 */
const axiosInstance = axios.create({
  baseURL: config.api.url,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Queue to hold pending requests during token refresh
 */
let failedQueue = [];
let isRefreshing = false;

/**
 * Process the queue of failed requests after token refresh
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Facial Recognition / Biometric API endpoints
 */
export const facialApi = {
  /**
   * Get enrollment status/details for a student
   * If no enrollment exists, backend may return 404.
   * @param {string|number} studentId
   */
  getEnrollment: (studentId) =>
    axiosInstance.get(`/api/students/${studentId}/enrollment/`),

  /**
   * Get enrollment for current authenticated student (self)
   */
  getSelfEnrollment: () => axiosInstance.get(`/api/students/me/enrollment/`),

  /**
   * Enroll a student's facial data via video file or ZIP of images
   * @param {string|number} studentId
   * @param {FormData} formData - must contain key 'media' (file)
   */
  enrollStudent: (studentId, formData, configOverrides = {}) =>
    axiosInstance.post(`/api/students/${studentId}/enroll/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 1 minute
      ...configOverrides,
    }),

  /**
   * Enroll current authenticated student (self)
   */
  enrollSelf: (formData, configOverrides = {}) =>
    axiosInstance.post(`/api/students/me/enroll/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 1 minute
      ...configOverrides,
    }),

  /**
   * Delete enrollment for a student
   */
  deleteEnrollment: (studentId) =>
    axiosInstance.delete(`/api/students/${studentId}/enrollment/`),

  /**
   * Get enrollment statistics
   */
  getEnrollmentStats: () => axiosInstance.get(`/api/enrollment-statistics/`),

  /**
   * Smart helpers: try explicit student endpoint first; if permission denied, fall back to self endpoint.
   */
  getEnrollmentSmart: async (studentId) => {
    try {
      return await axiosInstance.get(`/api/students/${studentId}/enrollment/`);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403 || status === 401) {
        return await axiosInstance.get(`/api/students/me/enrollment/`);
      }
      throw err;
    }
  },

  enrollSmart: async (studentId, formData, configOverrides = {}) => {
    // Set 1 minute timeout for enrollment calls
    const enrollConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 1 minute
      ...configOverrides,
    };
    
    try {
      return await axiosInstance.post(
        `/api/students/${studentId}/enroll/`,
        formData,
        enrollConfig
      );
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403 || status === 401) {
        // Fall back to self-enroll endpoint
        return await axiosInstance.post(`/api/students/me/enroll/`, formData, enrollConfig);
      }
      throw err;
    }
  },
};

/**
 * Request interceptor - Attach authorization header if token exists
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token refresh on 401 errors
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for login and refresh endpoints
      if (
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/api/auth/login') ||
        originalRequest.url.includes('/auth/token/refresh') ||
        originalRequest.url.includes('/api/auth/token/refresh')
      ) {
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        // No refresh token available, logout
        useAuthStore.getState().logout();
        isRefreshing = false;

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        // Build refresh URL safely: trim trailing slashes and include /api prefix
        const base = (config.api.url || '').replace(/\/+$/, '');
        const refreshUrl = `${base}/api/auth/token/refresh/`;
        const response = await axios.post(
          refreshUrl,
          { refresh: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const { access, refresh } = response.data;

        // Update tokens in store
        useAuthStore.getState().setTokens(access, refresh || refreshToken);

        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Process the queue with the new token
        processQueue(null, access);

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed
        processQueue(refreshError, null);

        const status = refreshError?.response?.status;
        // Only force logout on auth-related failures
        if (status === 401 || status === 403) {
          useAuthStore.getState().logout();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Typed API endpoint functions
 */

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Login with credentials
   * @param {Object} credentials - { email, password }
   * @returns {Promise} Response with tokens and user data
   */
  login: (credentials) => axiosInstance.post('/api/auth/login/', credentials),

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Response with user data
   */
  register: (userData) => axiosInstance.post('/api/auth/register/', userData),

  /**
   * Logout current user (optionally blacklists refresh token)
   * @param {string} [refreshToken]
   * @returns {Promise} Response
   */
  logout: (refreshToken) =>
    axiosInstance.post(
      '/api/auth/logout/',
      refreshToken ? { refresh_token: refreshToken } : {}
    ),

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} Response with new tokens
   */
  refreshToken: (refreshToken) =>
    axiosInstance.post('/api/auth/token/refresh/', { refresh: refreshToken }),

  /**
   * Verify token validity
   * @param {string} token - Token to verify
   * @returns {Promise} Response
   */
  // Backend endpoints are namespaced under /api
  verifyToken: (token) => axiosInstance.post('/api/auth/token/verify/', { token }),

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Response
   */
  requestPasswordReset: (email) =>
    axiosInstance.post('/api/auth/password-reset/', { email }),

  /**
   * Confirm password reset
   * @param {Object} data - { token, password }
   * @returns {Promise} Response
   */
  confirmPasswordReset: (data) =>
    axiosInstance.post('/api/auth/password-reset-confirm/', data),

  /**
   * Change password
   * @param {Object} data - { old_password, new_password }
   * @returns {Promise} Response
   */
  changePassword: (data) =>
    axiosInstance.post('/api/auth/change-password/', data),
};

/**
 * Attendance API endpoints
 */
export const attendanceApi = {
  /**
   * Clock in for attendance
   * @param {Object} data - Clock in data with biometric info
   * @returns {Promise} Response with attendance record
   */
  // Backend uses snake_case paths and includes /api prefix in app urls
  clockIn: (data) => axiosInstance.post('/api/attendance/clock_in/', data),

  /**
   * Clock out for attendance
   * @param {Object} data - Clock out data
   * @returns {Promise} Response with updated attendance record
   */
  clockOut: (data) => axiosInstance.post('/api/attendance/clock_out/', data),

  /**
   * Get attendance records
   * @param {Object} params - Query parameters (date_from, date_to, user_id, etc.)
   * @returns {Promise} Response with attendance records
   */
  // Backend provides attendance aggregate/list under reports
  getRecords: (params) =>
    axiosInstance.get('/api/reports/attendance/', { params }),

  /**
   * Get single attendance record
   * @param {string} id - Record ID
   * @returns {Promise} Response with attendance record
   */
  getRecord: (id) => axiosInstance.get(`/attendance/records/${id}/`),

  /**
   * Update attendance record
   * @param {string} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise} Response with updated record
   */
  updateRecord: (id, data) =>
    axiosInstance.patch(`/attendance/records/${id}/`, data),

  /**
   * Delete attendance record
   * @param {string} id - Record ID
   * @returns {Promise} Response
   */
  deleteRecord: (id) => axiosInstance.delete(`/attendance/records/${id}/`),

  /**
   * Request manual attendance check
   * @param {Object} data - Request data
   * @returns {Promise} Response
   */
  requestManualCheck: (data) =>
    axiosInstance.post('/api/attendance/manual_clock_in_request/', data),

  /**
   * Get attendance records for a specific schedule (Faculty)
   * @param {number} scheduleId - Schedule ID
   * @param {string} date - Date (optional, defaults to today)
   * @returns {Promise} Response with attendance data
   */
  getScheduleAttendance: (scheduleId, date = null) => {
    const params = date ? { date } : {};
    return axiosInstance
      .get(`/api/attendance/schedule/${scheduleId}/`, { params })
      .then((r) => r.data);
  },

  /**
   * Manually clock in a student (Faculty)
   * @param {number} scheduleId - Schedule ID
   * @param {string} studentId - Student ID
   * @param {string} date - Date (optional, defaults to today)
   * @returns {Promise} Response with attendance record
   */
  manualClockIn: (scheduleId, studentId, date = null) => {
    const data = { student_id: studentId };
    if (date) data.date = date;
    return axiosInstance
      .post(`/api/attendance/schedule/${scheduleId}/manual-clock-in/`, data)
      .then((r) => r.data);
  },

  /**
   * Process manual attendance (faculty)
   * @param {Object} data - Manual attendance data
   * @returns {Promise} Response
   */
  manualAttendance: (data) =>
    axiosInstance.post('/api/attendance/manual/', data),

  /**
   * Get attendance statistics
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with statistics
   */
  getStatistics: (params) =>
    axiosInstance.get('/api/reports/charts/', { params }),

  /**
   * Get attendance report
   * @param {Object} params - Report parameters
   * @returns {Promise} Response with report data
   */
  getReport: (params) =>
    axiosInstance.get('/api/reports/attendance/', { params }),

  /**
   * Get individual student's attendance report
   * @param {string} studentId - The student's ID (students.student_id)
   * @param {Object} params - Optional query params: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
   * @returns {Promise} Response with student's attendance report
   */
  getStudentReport: (studentId, params) =>
    axiosInstance.get(`/api/reports/student/${studentId}/`, { params }),

  /**
   * Export attendance data
   * @param {Object} params - Export parameters
   * @returns {Promise} Response with export file
   */
  exportData: (params) =>
    axiosInstance.get('/attendance/export/', {
      params,
      responseType: 'blob',
    }),

  /**
   * Verify biometric data
   * @param {Object} data - Biometric verification data
   * @returns {Promise} Response with verification result
   */
  verifyBiometric: (data) =>
    axiosInstance.post('/attendance/biometric/verify/', data),
};

/**
 * User API endpoints
 */
export const userApi = {
  /**
   * Get current user profile
   * @returns {Promise} Response with user profile
   */
  getProfile: () => axiosInstance.get('/api/auth/users/me/'),

  /**
   * Update current user profile
   * @param {Object} data - Profile update data
   * @returns {Promise} Response with updated profile
   */
  updateProfile: (data) => axiosInstance.patch('/api/auth/users/me/', data),

  /**
   * Get all groups (admin only)
   * @returns {Promise} Response with groups list
   */
  getGroups: () => axiosInstance.get('/api/students/groups/'),

  /**
   * Get faculty's assigned groups
   * @returns {Promise} Response with faculty groups
   */
  getFacultyGroups: () => axiosInstance.get('/api/students/groups/'),

  /**
   * Get all users (admin)
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with users list
   */
  getUsers: (params) =>
    axiosInstance.get('/api/auth/users/', { params }).then((res) => {
      const data = res?.data;
      if (Array.isArray(data)) {
        return { results: data, count: data.length };
      }
      return {
        results: data?.results ?? [],
        count: data?.count ?? 0,
      };
    }),

  /**
   * Get single user
   * @param {string} id - User ID
   * @returns {Promise} Response with user data
   */
  getUser: (id) => axiosInstance.get(`/api/auth/users/${id}/`),

  /**
   * Create new user (admin)
   * @param {Object} data - User data
   * @returns {Promise} Response with created user
   */
  createUser: (data) => {
    const payload = {
      ...data,
      // Backend registration requires password_confirm; if not passed, mirror password
      password_confirm: data.password_confirm ?? data.password,
    };

    // For faculty: backend auto-generates faculty_id; don't send it.
    // Backend Faculty.department is NOT NULL but serializer coerces empty to None,
    // so ensure a non-empty default to avoid DB constraint error.
    if (payload.role === 'FACULTY') {
      delete payload.faculty_id;
      if (!payload.department || String(payload.department).trim() === '') {
        payload.department = 'General';
      }
    }

    return axiosInstance.post('/api/auth/register/', payload);
  },

  /**
   * Update user (admin)
   * @param {string} id - User ID
   * @param {Object} data - Update data
   * @returns {Promise} Response with updated user
   */
  updateUser: (id, data) => axiosInstance.patch(`/api/auth/users/${id}/`, data),

  /**
   * Delete user (admin)
   * @param {string} id - User ID
   * @returns {Promise} Response
   */
  deleteUser: (id) => axiosInstance.delete(`/api/auth/users/${id}/`),

  /**
   * Upload profile picture
   * @param {FormData} formData - Form data with image file
   * @returns {Promise} Response with image URL
   */
  uploadProfilePicture: (formData) =>
    axiosInstance.post('/api/auth/users/profile/picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  /**
   * Register biometric data
   * @param {Object} data - Biometric registration data
   * @returns {Promise} Response
   */
  registerBiometric: (data) =>
    axiosInstance.post('/users/biometric/register/', data),

  /**
   * Update biometric data
   * @param {Object} data - Biometric update data
   * @returns {Promise} Response
   */
  updateBiometric: (data) => axiosInstance.put('/users/biometric/', data),

  /**
   * Get user permissions
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise} Response with permissions
   */
  getPermissions: (userId) =>
    axiosInstance.get(
      userId
        ? `/api/auth/users/${userId}/permissions/`
        : '/api/auth/users/permissions/'
    ),

  /**
   * Update user permissions (admin)
   * @param {string} userId - User ID
   * @param {Object} permissions - Permissions data
   * @returns {Promise} Response
   */
  updatePermissions: (userId, permissions) =>
    axiosInstance.put(`/api/auth/users/${userId}/permissions/`, permissions),

  /**
   * Get students for current faculty (optionally filter by group)
   * @param {Object} params - { group?: string, search?: string }
   * @returns {Promise} Response with students list
   */
  getFacultyStudents: (params) =>
    axiosInstance.get('/api/faculty/students/', { params }).then((res) => {
      const data = res?.data;
      if (Array.isArray(data)) {
        return { results: data, count: data.length };
      }
      return {
        results: data?.results ?? [],
        count: data?.count ?? 0,
      };
    }),
};

/**
 * Schedule API endpoints
 */
export const scheduleApi = {
  /**
   * Get schedules
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with schedules
   */
  getSchedules: (params) => axiosInstance.get('/api/schedules/', { params }),

  /**
   * Get single schedule
   * @param {string} id - Schedule ID
   * @returns {Promise} Response with schedule
   */
  getSchedule: (id) => axiosInstance.get(`/api/schedules/${id}/`),

  /**
   * Create new schedule
   * @param {Object} data - Schedule data
   * @returns {Promise} Response with created schedule
   */
  createSchedule: (data) => axiosInstance.post('/api/schedules/', data),

  /**
   * Update schedule
   * @param {string} id - Schedule ID
   * @param {Object} data - Update data
   * @returns {Promise} Response with updated schedule
   */
  updateSchedule: (id, data) =>
    axiosInstance.patch(`/api/schedules/${id}/`, data),

  /**
   * Delete schedule
   * @param {string} id - Schedule ID
   * @returns {Promise} Response
   */
  deleteSchedule: (id) => axiosInstance.delete(`/api/schedules/${id}/`),

  /**
   * Get user's schedule
   * @param {string} userId - User ID (optional, defaults to current user)
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with user schedule
   */
  getUserSchedule: (userId, params) =>
    axiosInstance.get(
      userId ? `/api/schedules/user/${userId}/` : '/api/schedules/my/',
      { params }
    ),

  /**
   * Get schedule templates
   * @returns {Promise} Response with templates
   */
  getTemplates: () => axiosInstance.get('/api/schedules/templates/'),

  /**
   * Create schedule from template
   * @param {string} templateId - Template ID
   * @param {Object} data - Additional data
   * @returns {Promise} Response with created schedule
   */
  createFromTemplate: (templateId, data) =>
    axiosInstance.post(`/api/schedules/templates/${templateId}/apply/`, data),

  /**
   * Get schedule conflicts
   * @param {Object} data - Schedule data to check
   * @returns {Promise} Response with conflicts
   */
  checkConflicts: (data) =>
    axiosInstance.post('/api/schedules/conflicts/', data),

  /**
   * Bulk create schedules
   * @param {Array} schedules - Array of schedule data
   * @returns {Promise} Response with created schedules
   */
  bulkCreate: (schedules) =>
    axiosInstance.post('/schedules/bulk/', { schedules }),

  /**
   * Get schedule summary
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with summary
   */
  getSummary: (params) => axiosInstance.get('/schedules/summary/', { params }),
};

/**
 * Faculty API endpoints
 */
export const facultyApi = {
  /**
   * Get current faculty's assigned groups (courses)
   */
  getMyGroups: () =>
    axiosInstance.get('/api/faculty/my-groups/').then((r) => r.data),
  /**
   * List faculty with optional filters (e.g., by user)
   * @param {Object} params - e.g., { user: <userId> }
   */
  list: (params = {}) =>
    axiosInstance.get('/api/faculty/', { params }).then((r) => r.data),
  /**
   * Update a faculty record (e.g., assign groups)
   * @param {number|string} id - Faculty PK
   * @param {Object} data - Partial update payload
   */
  update: (id, data) =>
    axiosInstance.patch(`/api/faculty/${id}/`, data).then((r) => r.data),
};

/**
 * Reports API endpoints
 */
export const reportsApi = {
  /**
   * Attendance report by group and date range
   * @param {Object} params - { group: string|number, from: string(YYYY-MM-DD), to: string(YYYY-MM-DD) }
   * @returns {Promise}
   */
  attendanceReport: (params) =>
    axiosInstance.get('/api/reports/attendance/', { params }),
};

/**
 * Student API endpoints
 */
export const studentApi = {
  /**
   * Update student profile
   * @param {string} studentId - Student ID
   * @param {Object} data - Update data
   */
  updateProfile: (studentId, data) =>
    axiosInstance.patch(`/api/students/${studentId}/`, data),

  /**
   * Get student profile
   * @param {string} studentId - Student ID
   */
  getProfile: (studentId) => axiosInstance.get(`/api/students/${studentId}/`),
};

/**
 * Groups (Courses) API endpoints
 */
export const groupsApi = {
  /**
   * List groups with optional params
   */
  list: (params) =>
    axiosInstance.get('/api/students/groups/', { params }).then((res) => {
      const data = res?.data;
      if (Array.isArray(data)) return data;
      return data?.results ?? [];
    }),
  /**
   * Retrieve single group
   */
  get: (id) =>
    axiosInstance.get(`/api/students/groups/${id}/`).then((r) => r.data),
  /**
   * Create group (admin)
   */
  create: (data) => {
    const payload = { ...data };
    // Backend currently requires semester; default to 1 if omitted by UI
    if (
      payload.semester === undefined ||
      payload.semester === null ||
      payload.semester === ''
    ) {
      payload.semester = 'Spring';
    }
    return axiosInstance
      .post('/api/students/groups/', payload)
      .then((r) => r.data);
  },
  /**
   * Update group (admin)
   */
  update: (id, data) =>
    axiosInstance
      .patch(`/api/students/groups/${id}/`, data)
      .then((r) => r.data),
  /**
   * Delete group (admin)
   */
  delete: (id) => axiosInstance.delete(`/api/students/groups/${id}/`),
};

/**
 * Activity API endpoints
 */
export const activityApi = {
  /**
   * Get recent activities (admin only)
   */
  getRecentActivities: (params = {}) =>
    axiosInstance.get('/api/activities/', { params }).then((r) => r.data),
  
  /**
   * Get activity statistics (admin only)
   */
  getActivityStats: (params = {}) =>
    axiosInstance.get('/api/activities/stats/', { params }).then((r) => r.data),
  
  /**
   * Log custom activity
   */
  logCustomActivity: (data) =>
    axiosInstance.post('/api/activities/log/', data).then((r) => r.data)
};

/**
 * Health Check API
 */
export const healthApi = {
  /**
   * Get system health
   */
  getSystemHealth: () =>
    axiosInstance.get('/api/health/').then((r) => r.data),
  
  /**
   * Get quick health
   */
  getQuickHealth: () =>
    axiosInstance.get('/api/health/quick/').then((r) => r.data)
};

// Student self-report convenience wrappers (placed after all API objects)
attendanceApi.getStudentAttendance = async (params = {}) => {
  const profileRes = await userApi.getProfile();
  const studentId = profileRes?.data?.student_profile?.student_id;
  if (!studentId) throw new Error('Student profile not found for current user');

  const reportRes = await axiosInstance.get(
    `/api/reports/student/${studentId}/`,
    { params }
  );
  const stats = reportRes?.data?.statistics || {};
  return {
    data: {
      attendance_rate: stats.attendance_rate ?? 0,
      total_present: stats.present ?? 0,
      total_absent: stats.absent ?? 0,
      total_late: stats.late ?? 0,
      total_excused: stats.excused ?? 0,
      total_classes: stats.total_classes ?? 0,
    },
  };
};

attendanceApi.getStudentRecords = async (params = {}) => {
  const profileRes = await userApi.getProfile();
  const studentId = profileRes?.data?.student_profile?.student_id;
  if (!studentId) throw new Error('Student profile not found for current user');

  const reportRes = await axiosInstance.get(
    `/api/reports/student/${studentId}/`,
    { params }
  );
  const records = reportRes?.data?.attendance_records || [];
  return {
    data: records.map((r) => ({
      date: r.date,
      time: r.check_in_time || r.check_out_time || '',
      status: r.status,
      method: r.is_manual_override ? 'Manual' : 'Biometric',
      course_code: r.course_code,
      course_title: r.course_title,
    })),
  };
};

// Export the axios instance for custom requests
export default axiosInstance;
