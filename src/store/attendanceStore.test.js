import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAttendanceStore from './attendanceStore';

describe('AttendanceStore', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useAttendanceStore.setState({
        attendanceBySchedule: {},
        activeSessions: {},
        recentUpdates: [],
        connectionStatus: {
          isConnected: false,
          connectionType: null,
          lastHeartbeat: null,
        },
        pendingUpdates: [],
        errors: [],
      });
    });
  });

  describe('setConnectionStatus', () => {
    it('should update connection status', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.setConnectionStatus({
          isConnected: true,
          connectionType: 'websocket',
        });
      });

      expect(result.current.connectionStatus.isConnected).toBe(true);
      expect(result.current.connectionStatus.connectionType).toBe('websocket');
      expect(result.current.connectionStatus.lastHeartbeat).toBeTruthy();
    });
  });

  describe('handleAttendanceUpdate', () => {
    it('should handle student check-in', () => {
      const { result } = renderHook(() => useAttendanceStore());

      const checkInMessage = {
        type: 'student_checked_in',
        payload: {
          schedule_id: 'schedule_1',
          student_id: 'student_1',
          student_name: 'John Doe',
          check_in_time: '2024-01-01T10:00:00Z',
        },
      };

      act(() => {
        result.current.handleAttendanceUpdate(checkInMessage);
      });

      const attendance = result.current.attendanceBySchedule.schedule_1.student_1;
      expect(attendance.status).toBe('present');
      expect(attendance.check_in_time).toBeTruthy();
      expect(result.current.activeSessions['schedule_1_student_1']).toBeTruthy();
      expect(result.current.recentUpdates[0].type).toBe('check_in');
    });

    it('should handle student check-out', () => {
      const { result } = renderHook(() => useAttendanceStore());

      // First check-in
      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'student_checked_in',
          payload: {
            schedule_id: 'schedule_1',
            student_id: 'student_1',
            student_name: 'John Doe',
          },
        });
      });

      // Then check-out
      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'student_checked_out',
          payload: {
            schedule_id: 'schedule_1',
            student_id: 'student_1',
            check_out_time: '2024-01-01T11:00:00Z',
          },
        });
      });

      const attendance = result.current.attendanceBySchedule.schedule_1.student_1;
      expect(attendance.check_out_time).toBeTruthy();
      expect(result.current.activeSessions['schedule_1_student_1']).toBeUndefined();
      expect(result.current.recentUpdates[0].type).toBe('check_out');
    });

    it('should handle status change', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'status_change',
          payload: {
            schedule_id: 'schedule_1',
            student_id: 'student_1',
            status: 'late',
          },
        });
      });

      const attendance = result.current.attendanceBySchedule.schedule_1.student_1;
      expect(attendance.status).toBe('late');
      expect(attendance.updated_at).toBeTruthy();
    });

    it('should handle manual override', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'manual_override',
          payload: {
            schedule_id: 'schedule_1',
            student_id: 'student_1',
            status: 'excused',
            override_by: 'teacher_1',
            override_reason: 'Medical appointment',
          },
        });
      });

      const attendance = result.current.attendanceBySchedule.schedule_1.student_1;
      expect(attendance.is_manual_override).toBe(true);
      expect(attendance.override_by).toBe('teacher_1');
      expect(attendance.override_reason).toBe('Medical appointment');
    });

    it('should handle bulk update', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'bulk_update',
          payload: {
            schedule_id: 'schedule_1',
            updates: [
              { student_id: 'student_1', status: 'present' },
              { student_id: 'student_2', status: 'absent' },
              { student_id: 'student_3', status: 'late' },
            ],
          },
        });
      });

      expect(result.current.attendanceBySchedule.schedule_1.student_1.status).toBe('present');
      expect(result.current.attendanceBySchedule.schedule_1.student_2.status).toBe('absent');
      expect(result.current.attendanceBySchedule.schedule_1.student_3.status).toBe('late');
    });

    it('should limit recent updates to 50', () => {
      const { result } = renderHook(() => useAttendanceStore());

      // Add 60 updates
      for (let i = 0; i < 60; i++) {
        act(() => {
          result.current.handleAttendanceUpdate({
            type: 'attendance_update',
            payload: {
              schedule_id: 'schedule_1',
              student_id: `student_${i}`,
              status: 'present',
            },
          });
        });
      }

      expect(result.current.recentUpdates.length).toBe(50);
    });
  });

  describe('optimistic updates', () => {
    it('should add and confirm optimistic update', () => {
      const { result } = renderHook(() => useAttendanceStore());

      let updateId;
      act(() => {
        updateId = result.current.addOptimisticUpdate({
          type: 'student_checked_in',
          payload: {
            schedule_id: 'schedule_1',
            student_id: 'student_1',
          },
        });
      });

      expect(result.current.pendingUpdates.length).toBe(1);
      expect(result.current.attendanceBySchedule.schedule_1.student_1.is_optimistic).toBe(true);

      act(() => {
        result.current.confirmOptimisticUpdate(updateId);
      });

      expect(result.current.pendingUpdates.length).toBe(0);
    });

    it('should revert optimistic update on error', () => {
      const { result } = renderHook(() => useAttendanceStore());

      let updateId;
      act(() => {
        updateId = result.current.addOptimisticUpdate({
          type: 'student_checked_in',
          payload: {
            schedule_id: 'schedule_1',
            student_id: 'student_1',
          },
        });
      });

      act(() => {
        result.current.revertOptimisticUpdate(updateId);
      });

      expect(result.current.pendingUpdates.length).toBe(0);
      expect(result.current.attendanceBySchedule.schedule_1?.student_1).toBeUndefined();
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAttendanceStore());
      
      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'bulk_update',
          payload: {
            schedule_id: 'schedule_1',
            updates: [
              { student_id: 'student_1', status: 'present' },
              { student_id: 'student_2', status: 'absent' },
              { student_id: 'student_3', status: 'late' },
              { student_id: 'student_4', status: 'excused' },
            ],
          },
        });
      });
    });

    it('should get attendance for a specific schedule', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      const attendance = result.current.getScheduleAttendance('schedule_1');
      expect(attendance.length).toBe(4);
    });

    it('should get attendance for a specific student', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      const attendance = result.current.getStudentAttendance('schedule_1', 'student_1');
      expect(attendance.status).toBe('present');
    });

    it('should calculate schedule statistics', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      const stats = result.current.getScheduleStats('schedule_1');
      expect(stats.total).toBe(4);
      expect(stats.present).toBe(1);
      expect(stats.absent).toBe(1);
      expect(stats.late).toBe(1);
      expect(stats.excused).toBe(1);
    });

    it('should check for active sessions', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      // Add an active session
      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'student_checked_in',
          payload: {
            schedule_id: 'schedule_2',
            student_id: 'student_5',
          },
        });
      });

      expect(result.current.hasActiveSession('schedule_2', 'student_5')).toBe(true);
      expect(result.current.hasActiveSession('schedule_2', 'student_6')).toBe(false);
    });
  });

  describe('clear functions', () => {
    it('should clear attendance for a specific schedule', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      // Add data for two schedules
      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'attendance_update',
          payload: {
            schedule_id: 'schedule_1',
            student_id: 'student_1',
            status: 'present',
          },
        });
        result.current.handleAttendanceUpdate({
          type: 'attendance_update',
          payload: {
            schedule_id: 'schedule_2',
            student_id: 'student_2',
            status: 'present',
          },
        });
      });

      act(() => {
        result.current.clearScheduleAttendance('schedule_1');
      });

      expect(result.current.attendanceBySchedule.schedule_1).toBeUndefined();
      expect(result.current.attendanceBySchedule.schedule_2).toBeTruthy();
    });

    it('should clear all attendance data', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      // Add some data
      act(() => {
        result.current.handleAttendanceUpdate({
          type: 'attendance_update',
          payload: {
            schedule_id: 'schedule_1',
            student_id: 'student_1',
            status: 'present',
          },
        });
      });

      act(() => {
        result.current.clearAllAttendance();
      });

      expect(result.current.attendanceBySchedule).toEqual({});
      expect(result.current.activeSessions).toEqual({});
      expect(result.current.recentUpdates).toEqual([]);
      expect(result.current.pendingUpdates).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should add and clear errors', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.addError({ message: 'Test error', code: 'TEST_ERROR' });
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].message).toBe('Test error');

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors.length).toBe(0);
    });

    it('should limit errors to 10', () => {
      const { result } = renderHook(() => useAttendanceStore());

      for (let i = 0; i < 15; i++) {
        act(() => {
          result.current.addError({ message: `Error ${i}` });
        });
      }

      expect(result.current.errors.length).toBe(10);
    });
  });
});
