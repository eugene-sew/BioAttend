/**
 * TypeScript type definitions for API
 */

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface LoginResponse extends TokenResponse {
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  employee_id?: string;
  department?: string;
  role?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  department: string;
  role: string;
  is_active: boolean;
  profile_picture?: string;
  biometric_registered: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  can_view_all_attendance: boolean;
  can_edit_attendance: boolean;
  can_manage_users: boolean;
  can_manage_schedules: boolean;
  can_export_reports: boolean;
}

// Attendance types
export interface AttendanceRecord {
  id: string;
  user_id: string;
  user_name?: string;
  clock_in_time: string;
  clock_out_time?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'early_departure';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  biometric_verified: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClockInData {
  biometric_data?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
}

export interface ClockOutData {
  biometric_data?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
}

export interface AttendanceStatistics {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  early_departures: number;
  average_hours: number;
  attendance_rate: number;
}

export interface AttendanceReport {
  user: User;
  period: {
    start_date: string;
    end_date: string;
  };
  statistics: AttendanceStatistics;
  records: AttendanceRecord[];
}

// Schedule types
export interface Schedule {
  id: string;
  user_id: string;
  user_name?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  date?: string;
  recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  recurrence_end_date?: string;
  days_of_week?: number[]; // 0-6, Sunday-Saturday
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  default_start_time: string;
  default_end_time: string;
  default_days: number[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleConflict {
  schedule_id: string;
  conflicting_schedule_id: string;
  conflict_type: 'overlap' | 'adjacent' | 'same_location';
  message: string;
}

// Biometric types
export interface BiometricData {
  type: 'fingerprint' | 'face' | 'iris';
  data: string; // Base64 encoded biometric data
  quality_score?: number;
  device_info?: {
    device_id: string;
    device_type: string;
    sdk_version: string;
  };
}

export interface BiometricVerificationResult {
  verified: boolean;
  confidence_score: number;
  match_type?: string;
  error_message?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status_code: number;
  timestamp: string;
}

// Query parameter types
export interface PaginationParams {
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface AttendanceQueryParams extends PaginationParams {
  user_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  department?: string;
}

export interface ScheduleQueryParams extends PaginationParams {
  user_id?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  is_active?: boolean;
  recurring?: boolean;
}

export interface UserQueryParams extends PaginationParams {
  search?: string;
  department?: string;
  role?: string;
  is_active?: boolean;
  biometric_registered?: boolean;
}

// WebSocket types
export interface WebSocketMessage {
  type: 'notification' | 'attendance_update' | 'schedule_change' | 'system_message';
  payload: any;
  timestamp: string;
  user_id?: string;
}

export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    url?: string;
    callback?: () => void;
  };
  auto_dismiss?: boolean;
  duration?: number;
}
