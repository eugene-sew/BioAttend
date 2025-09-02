/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  Avatar,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  PersonOff as PersonOffIcon,
  Refresh as RefreshIcon,
  WifiTethering as WifiTetheringIcon,
  WifiTetheringOff as WifiTetheringOffIcon,
} from '@mui/icons-material';
import useAttendanceStore, { attendanceSelectors } from '../../store/attendanceStore';
import usePusher from '../../hooks/usePusher';

/**
 * Real-time attendance table that subscribes to Pusher Channels updates
 * Demonstrates optimistic UI updates with the attendance store
 */
const RealTimeAttendanceTable = ({ scheduleId }) => {
  const [notification, setNotification] = useState(null);
  
  // Subscribe to attendance store
  const attendanceRecords = useAttendanceStore(
    attendanceSelectors.selectScheduleAttendance(scheduleId)
  );
  const connectionStatus = useAttendanceStore(
    attendanceSelectors.selectConnectionStatus
  );
  const scheduleStats = useAttendanceStore((state) => 
    state.getScheduleStats(scheduleId)
  );
  const addOptimisticUpdate = useAttendanceStore((state) => state.addOptimisticUpdate);
  const confirmOptimisticUpdate = useAttendanceStore((state) => state.confirmOptimisticUpdate);
  const revertOptimisticUpdate = useAttendanceStore((state) => state.revertOptimisticUpdate);

  // Setup real-time connection via Pusher
  const connection = usePusher(scheduleId, {
    onEvent: (message) => {
      if (message.type === 'student_checked_in') {
        showNotification(`${message.payload.student_name} checked in`, 'success');
      } else if (message.type === 'student_checked_out') {
        showNotification(`${message.payload.student_name} checked out`, 'info');
      }
    },
    onConnect: () => {
      showNotification('Real-time updates connected', 'success');
    },
    onDisconnect: () => {
      showNotification('Real-time updates disconnected', 'warning');
    },
  });

  // Subscribe to specific attendance updates
  useEffect(() => {
    const unsubscribe = useAttendanceStore.subscribe(
      (state) => state.recentUpdates,
      (recentUpdates) => {
        if (recentUpdates.length > 0) {
          const latestUpdate = recentUpdates[0];
          console.log('Latest attendance update:', latestUpdate);
        }
      }
    );

    return unsubscribe;
  }, []);

  // Helper function to show notifications
  const showNotification = (message, severity = 'info') => {
    setNotification({ message, severity });
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'excused':
        return 'info';
      default:
        return 'default';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon />;
      case 'absent':
        return <CancelIcon />;
      case 'late':
        return <AccessTimeIcon />;
      case 'excused':
        return <PersonOffIcon />;
      default:
        return null;
    }
  };

  // Handle manual status update (optimistic update example)
  const handleStatusUpdate = async (studentId, newStatus) => {
    // Add optimistic update
    const updateId = addOptimisticUpdate({
      type: 'status_change',
      payload: {
        schedule_id: scheduleId,
        student_id: studentId,
        status: newStatus,
      },
    });

    try {
      // Send update through WebSocket (if connected)
      if (connection.isConnected && !useSSEFallback) {
        const success = connection.sendMessage({
          type: 'update_status',
          payload: {
            schedule_id: scheduleId,
            student_id: studentId,
            status: newStatus,
          },
        });

        if (success) {
          // Confirm optimistic update after successful send
          setTimeout(() => {
            confirmOptimisticUpdate(updateId);
          }, 500);
        } else {
          throw new Error('Failed to send update');
        }
      } else {
        // If using SSE or not connected, make HTTP request
        // This is where you'd call your API
        console.log('Would make HTTP request to update status');
        
        // Simulate API call
        setTimeout(() => {
          confirmOptimisticUpdate(updateId);
          showNotification('Status updated successfully', 'success');
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      revertOptimisticUpdate(updateId);
      showNotification('Failed to update status', 'error');
    }
  };

  // Format time display
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {/* Connection Status Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          p: 2,
          bgcolor: connectionStatus.isConnected ? 'success.light' : 'warning.light',
          borderRadius: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {connectionStatus.isConnected ? (
            <>
              <WifiTetheringIcon color="success" />
              <Typography variant="body2">
                Connected via {connectionStatus.connectionType?.toUpperCase()}
              </Typography>
            </>
          ) : (
            <>
              <WifiTetheringOffIcon color="warning" />
              <Typography variant="body2">Disconnected - Waiting for reconnection</Typography>
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            label={`Present: ${scheduleStats.present}`}
            color="success"
            size="small"
          />
          <Chip
            label={`Absent: ${scheduleStats.absent}`}
            color="error"
            size="small"
          />
          <Chip
            label={`Late: ${scheduleStats.late}`}
            color="warning"
            size="small"
          />
          <Badge badgeContent={scheduleStats.activeSessions} color="primary">
            <Chip
              label="Active"
              color="primary"
              size="small"
            />
          </Badge>
        </Box>

        <Tooltip title="Reconnect">
          <IconButton onClick={() => connection.reconnect()} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Attendance Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Check In</TableCell>
              <TableCell align="center">Check Out</TableCell>
              <TableCell align="center">Duration</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow
                key={record.student_id}
                sx={{
                  opacity: record.is_optimistic ? 0.7 : 1,
                  bgcolor: record.is_optimistic ? 'action.hover' : 'inherit',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {record.student_name?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {record.student_name || `Student ${record.student_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {record.student_id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    icon={getStatusIcon(record.status)}
                    label={record.status || 'unknown'}
                    color={getStatusColor(record.status)}
                    size="small"
                    variant={record.is_optimistic ? 'outlined' : 'filled'}
                  />
                  {record.is_manual_override && (
                    <Tooltip title={`Override by ${record.override_by}: ${record.override_reason}`}>
                      <Chip
                        label="M"
                        size="small"
                        color="secondary"
                        sx={{ ml: 0.5 }}
                      />
                    </Tooltip>
                  )}
                </TableCell>
                
                <TableCell align="center">
                  {formatTime(record.check_in_time)}
                </TableCell>
                
                <TableCell align="center">
                  {formatTime(record.check_out_time)}
                </TableCell>
                
                <TableCell align="center">
                  {record.check_in_time && record.check_out_time ? (
                    <Typography variant="caption">
                      {(() => {
                        const duration = new Date(record.check_out_time) - new Date(record.check_in_time);
                        const hours = Math.floor(duration / 3600000);
                        const minutes = Math.floor((duration % 3600000) / 60000);
                        return `${hours}h ${minutes}m`;
                      })()}
                    </Typography>
                  ) : (
                    '-'
                  )}
                </TableCell>
                
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="Mark Present">
                      <IconButton
                        size="small"
                        onClick={() => handleStatusUpdate(record.student_id, 'present')}
                        disabled={record.status === 'present'}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Mark Absent">
                      <IconButton
                        size="small"
                        onClick={() => handleStatusUpdate(record.student_id, 'absent')}
                        disabled={record.status === 'absent'}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Mark Late">
                      <IconButton
                        size="small"
                        onClick={() => handleStatusUpdate(record.student_id, 'late')}
                        disabled={record.status === 'late'}
                      >
                        <AccessTimeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            
            {attendanceRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No attendance records yet. Waiting for real-time updates...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert
            onClose={() => setNotification(null)}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default RealTimeAttendanceTable;
