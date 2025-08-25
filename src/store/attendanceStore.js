import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Attendance store for managing real-time attendance updates
 * Broadcasts WebSocket/SSE messages to subscribed UI components
 */
const useAttendanceStore = create(
  subscribeWithSelector((set, get) => ({
    // Real-time attendance records by schedule ID
    attendanceBySchedule: {},
    
    // Active attendance sessions
    activeSessions: {},
    
    // Recent attendance updates (for notifications)
    recentUpdates: [],
    
    // Connection status
    connectionStatus: {
      isConnected: false,
      connectionType: null, // 'websocket' or 'sse'
      lastHeartbeat: null,
    },
    
    // Pending updates (for optimistic UI)
    pendingUpdates: [],
    
    // Error state
    errors: [],

    // Actions
    
    /**
     * Update connection status
     */
    setConnectionStatus: (status) => {
      set((state) => ({
        connectionStatus: {
          ...state.connectionStatus,
          ...status,
          lastHeartbeat: status.isConnected ? Date.now() : state.connectionStatus.lastHeartbeat,
        },
      }));
    },

    /**
     * Handle attendance update from WebSocket/SSE
     */
    handleAttendanceUpdate: (message) => {
      const { type, payload } = message;
      
      switch (type) {
        case 'attendance_update':
          set((state) => ({
            attendanceBySchedule: {
              ...state.attendanceBySchedule,
              [payload.schedule_id]: {
                ...(state.attendanceBySchedule[payload.schedule_id] || {}),
                [payload.student_id]: payload,
              },
            },
            recentUpdates: [
              { ...payload, timestamp: Date.now(), type: 'update' },
              ...state.recentUpdates.slice(0, 49), // Keep last 50 updates
            ],
          }));
          break;

        case 'student_checked_in':
          set((state) => {
            const scheduleId = payload.schedule_id;
            const studentId = payload.student_id;
            
            return {
              attendanceBySchedule: {
                ...state.attendanceBySchedule,
                [scheduleId]: {
                  ...(state.attendanceBySchedule[scheduleId] || {}),
                  [studentId]: {
                    ...payload,
                    status: 'present',
                    check_in_time: payload.check_in_time || new Date().toISOString(),
                  },
                },
              },
              activeSessions: {
                ...state.activeSessions,
                [`${scheduleId}_${studentId}`]: {
                  ...payload,
                  sessionStart: Date.now(),
                },
              },
              recentUpdates: [
                { ...payload, timestamp: Date.now(), type: 'check_in' },
                ...state.recentUpdates.slice(0, 49),
              ],
            };
          });
          break;

        case 'student_checked_out':
          set((state) => {
            const scheduleId = payload.schedule_id;
            const studentId = payload.student_id;
            const sessionKey = `${scheduleId}_${studentId}`;
            
            // Remove from active sessions
            const { [sessionKey]: _, ...remainingActiveSessions } = state.activeSessions;
            
            return {
              attendanceBySchedule: {
                ...state.attendanceBySchedule,
                [scheduleId]: {
                  ...(state.attendanceBySchedule[scheduleId] || {}),
                  [studentId]: {
                    ...state.attendanceBySchedule[scheduleId]?.[studentId],
                    ...payload,
                    check_out_time: payload.check_out_time || new Date().toISOString(),
                  },
                },
              },
              activeSessions: remainingActiveSessions,
              recentUpdates: [
                { ...payload, timestamp: Date.now(), type: 'check_out' },
                ...state.recentUpdates.slice(0, 49),
              ],
            };
          });
          break;

        case 'status_change':
          set((state) => {
            const scheduleId = payload.schedule_id;
            const studentId = payload.student_id;
            
            return {
              attendanceBySchedule: {
                ...state.attendanceBySchedule,
                [scheduleId]: {
                  ...(state.attendanceBySchedule[scheduleId] || {}),
                  [studentId]: {
                    ...state.attendanceBySchedule[scheduleId]?.[studentId],
                    ...payload,
                    status: payload.status,
                    updated_at: new Date().toISOString(),
                  },
                },
              },
              recentUpdates: [
                { ...payload, timestamp: Date.now(), type: 'status_change' },
                ...state.recentUpdates.slice(0, 49),
              ],
            };
          });
          break;

        case 'manual_override':
          set((state) => {
            const scheduleId = payload.schedule_id;
            const studentId = payload.student_id;
            
            return {
              attendanceBySchedule: {
                ...state.attendanceBySchedule,
                [scheduleId]: {
                  ...(state.attendanceBySchedule[scheduleId] || {}),
                  [studentId]: {
                    ...payload,
                    is_manual_override: true,
                    override_by: payload.override_by,
                    override_reason: payload.override_reason,
                  },
                },
              },
              recentUpdates: [
                { ...payload, timestamp: Date.now(), type: 'manual_override' },
                ...state.recentUpdates.slice(0, 49),
              ],
            };
          });
          break;

        case 'bulk_update':
          set((state) => {
            const scheduleId = payload.schedule_id;
            const updates = payload.updates || [];
            
            const updatedAttendance = { ...(state.attendanceBySchedule[scheduleId] || {}) };
            
            updates.forEach((update) => {
              updatedAttendance[update.student_id] = {
                ...updatedAttendance[update.student_id],
                ...update,
              };
            });
            
            return {
              attendanceBySchedule: {
                ...state.attendanceBySchedule,
                [scheduleId]: updatedAttendance,
              },
              recentUpdates: [
                { ...payload, timestamp: Date.now(), type: 'bulk_update' },
                ...state.recentUpdates.slice(0, 49),
              ],
            };
          });
          break;

        default:
          console.warn('Unknown message type:', type);
      }
    },

    /**
     * Add optimistic update (for UI updates before server confirmation)
     */
    addOptimisticUpdate: (update) => {
      const updateId = `${Date.now()}_${Math.random()}`;
      
      set((state) => ({
        pendingUpdates: [
          ...state.pendingUpdates,
          { ...update, id: updateId, timestamp: Date.now() },
        ],
      }));
      
      // Apply the update optimistically
      get().handleAttendanceUpdate({
        type: update.type,
        payload: { ...update.payload, is_optimistic: true },
      });
      
      return updateId;
    },

    /**
     * Confirm optimistic update (remove from pending)
     */
    confirmOptimisticUpdate: (updateId) => {
      set((state) => ({
        pendingUpdates: state.pendingUpdates.filter((u) => u.id !== updateId),
      }));
    },

    /**
     * Revert optimistic update (on error)
     */
    revertOptimisticUpdate: (updateId) => {
      set((state) => {
        const update = state.pendingUpdates.find((u) => u.id === updateId);
        if (!update) return state;
        
        // Remove the optimistic update
        const newPendingUpdates = state.pendingUpdates.filter((u) => u.id !== updateId);
        
        // Revert the attendance data
        // This is simplified - in production, you'd want to restore the previous state
        const scheduleId = update.payload.schedule_id;
        const studentId = update.payload.student_id;
        
        const newAttendanceBySchedule = { ...state.attendanceBySchedule };
        if (newAttendanceBySchedule[scheduleId]?.[studentId]?.is_optimistic) {
          delete newAttendanceBySchedule[scheduleId][studentId];
        }
        
        return {
          pendingUpdates: newPendingUpdates,
          attendanceBySchedule: newAttendanceBySchedule,
        };
      });
    },

    /**
     * Get attendance for a specific schedule
     */
    getScheduleAttendance: (scheduleId) => {
      const state = get();
      return Object.values(state.attendanceBySchedule[scheduleId] || {});
    },

    /**
     * Get attendance for a specific student in a schedule
     */
    getStudentAttendance: (scheduleId, studentId) => {
      const state = get();
      return state.attendanceBySchedule[scheduleId]?.[studentId];
    },

    /**
     * Check if a student has an active session
     */
    hasActiveSession: (scheduleId, studentId) => {
      const state = get();
      return !!state.activeSessions[`${scheduleId}_${studentId}`];
    },

    /**
     * Clear attendance data for a schedule
     */
    clearScheduleAttendance: (scheduleId) => {
      set((state) => {
        const { [scheduleId]: _, ...remainingAttendance } = state.attendanceBySchedule;
        
        // Also clear active sessions for this schedule
        const newActiveSessions = {};
        Object.entries(state.activeSessions).forEach(([key, session]) => {
          if (!key.startsWith(`${scheduleId}_`)) {
            newActiveSessions[key] = session;
          }
        });
        
        return {
          attendanceBySchedule: remainingAttendance,
          activeSessions: newActiveSessions,
        };
      });
    },

    /**
     * Clear all attendance data
     */
    clearAllAttendance: () => {
      set({
        attendanceBySchedule: {},
        activeSessions: {},
        recentUpdates: [],
        pendingUpdates: [],
      });
    },

    /**
     * Add error
     */
    addError: (error) => {
      set((state) => ({
        errors: [
          { ...error, id: Date.now(), timestamp: new Date().toISOString() },
          ...state.errors.slice(0, 9), // Keep last 10 errors
        ],
      }));
    },

    /**
     * Clear errors
     */
    clearErrors: () => {
      set({ errors: [] });
    },

    /**
     * Get attendance statistics for a schedule
     */
    getScheduleStats: (scheduleId) => {
      const state = get();
      const attendance = state.attendanceBySchedule[scheduleId] || {};
      const records = Object.values(attendance);
      
      return {
        total: records.length,
        present: records.filter((r) => r.status === 'present').length,
        absent: records.filter((r) => r.status === 'absent').length,
        late: records.filter((r) => r.status === 'late').length,
        excused: records.filter((r) => r.status === 'excused').length,
        activeSessions: Object.keys(state.activeSessions).filter((key) => 
          key.startsWith(`${scheduleId}_`)
        ).length,
      };
    },
  }))
);

// Selectors for common use cases
export const attendanceSelectors = {
  selectScheduleAttendance: (scheduleId) => (state) => 
    Object.values(state.attendanceBySchedule[scheduleId] || {}),
  
  selectStudentAttendance: (scheduleId, studentId) => (state) =>
    state.attendanceBySchedule[scheduleId]?.[studentId],
  
  selectActiveSessionsCount: (state) => 
    Object.keys(state.activeSessions).length,
  
  selectRecentUpdates: (limit = 10) => (state) =>
    state.recentUpdates.slice(0, limit),
  
  selectConnectionStatus: (state) => state.connectionStatus,
  
  selectHasPendingUpdates: (state) => state.pendingUpdates.length > 0,
};

export default useAttendanceStore;
