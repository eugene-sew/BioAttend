# Real-Time Communication Utilities

This document explains how to use the real-time communication utilities for attendance updates in the BioAttend system.

## Overview

The system provides two methods for real-time communication:
1. **WebSocket** - Primary method for bidirectional real-time communication
2. **Server-Sent Events (SSE)** - Fallback method for unidirectional updates when WebSocket is unavailable

All real-time updates are automatically broadcast to the Zustand attendance store, allowing UI components to subscribe and update optimistically.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   WebSocket/    │────▶│  Attendance  │────▶│ UI Components   │
│   SSE Hooks     │     │    Store     │     │  (Subscribers)  │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │                       │                      │
        │                       │                      │
        ▼                       ▼                      ▼
   Connection             State Updates          Auto Re-render
   Management             & Broadcasting         on State Change
```

## Core Components

### 1. Attendance Store (`/store/attendanceStore.js`)

Centralized state management for real-time attendance updates.

**Key Features:**
- Stores attendance records by schedule ID
- Manages active sessions
- Handles optimistic updates
- Tracks connection status
- Provides selectors for efficient subscriptions

### 2. WebSocket Hook (`/hooks/useWebSocket.js`)

Primary hook for real-time bidirectional communication.

**Features:**
- Automatic reconnection with exponential backoff
- Token-based authentication via query parameters
- Automatic SSE fallback
- Message broadcasting to attendance store
- Connection status management

### 3. SSE Hook (`/hooks/useSSE.js`)

Alternative hook for Server-Sent Events when WebSocket is unavailable.

**Features:**
- Unidirectional updates from server
- Automatic reconnection
- Token-based authentication
- Heartbeat mechanism
- Multiple event type support

## Usage Examples

### Basic WebSocket Connection

```javascript
import useWebSocket from '../hooks/useWebSocket';
import useAttendanceStore from '../store/attendanceStore';

function AttendanceComponent({ scheduleId }) {
  // WebSocket connection with automatic store broadcasting
  const { isConnected, sendMessage, reconnect } = useWebSocket(scheduleId, {
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    reconnectDelay: 3000,
    maxReconnectAttempts: 5,
  });

  // Subscribe to attendance updates from store
  const attendance = useAttendanceStore(state => 
    state.getScheduleAttendance(scheduleId)
  );

  // Send a message (only works with WebSocket)
  const updateStatus = (studentId, status) => {
    sendMessage({
      type: 'update_status',
      payload: { student_id: studentId, status }
    });
  };

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      {/* Render attendance data */}
    </div>
  );
}
```

### SSE Fallback

```javascript
import useSSE from '../hooks/useSSE';

function SSEComponent({ scheduleId }) {
  const { isConnected, lastMessage, reconnect } = useSSE(
    `/sse/attendance/updates/${scheduleId}/`,
    {
      eventTypes: ['attendance_update', 'student_checked_in'],
      heartbeatInterval: 30000,
      maxReconnectAttempts: 10,
    }
  );

  return (
    <div>
      {isConnected ? 'SSE Connected' : 'SSE Disconnected'}
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```

### Subscribing to Store Updates

```javascript
import { useEffect } from 'react';
import useAttendanceStore, { attendanceSelectors } from '../store/attendanceStore';

function AttendanceTable({ scheduleId }) {
  // Use selector for efficient re-renders
  const attendance = useAttendanceStore(
    attendanceSelectors.selectScheduleAttendance(scheduleId)
  );
  
  const connectionStatus = useAttendanceStore(
    attendanceSelectors.selectConnectionStatus
  );

  // Subscribe to specific updates
  useEffect(() => {
    const unsubscribe = useAttendanceStore.subscribe(
      state => state.recentUpdates,
      (recentUpdates) => {
        if (recentUpdates.length > 0) {
          const latest = recentUpdates[0];
          console.log('New update:', latest);
          // Show notification, play sound, etc.
        }
      }
    );

    return unsubscribe;
  }, []);

  return (
    <div>
      <p>Connection: {connectionStatus.connectionType}</p>
      {attendance.map(record => (
        <div key={record.student_id}>
          {record.student_name}: {record.status}
        </div>
      ))}
    </div>
  );
}
```

### Optimistic Updates

```javascript
import useAttendanceStore from '../store/attendanceStore';

function OptimisticUpdateExample({ scheduleId, studentId }) {
  const { 
    addOptimisticUpdate, 
    confirmOptimisticUpdate, 
    revertOptimisticUpdate 
  } = useAttendanceStore();

  const handleStatusChange = async (newStatus) => {
    // Add optimistic update (UI updates immediately)
    const updateId = addOptimisticUpdate({
      type: 'status_change',
      payload: {
        schedule_id: scheduleId,
        student_id: studentId,
        status: newStatus,
      }
    });

    try {
      // Make API call
      const response = await updateAttendanceAPI(studentId, newStatus);
      
      // Confirm the optimistic update
      confirmOptimisticUpdate(updateId);
    } catch (error) {
      // Revert on error
      revertOptimisticUpdate(updateId);
      console.error('Update failed:', error);
    }
  };

  return (
    <button onClick={() => handleStatusChange('present')}>
      Mark Present
    </button>
  );
}
```

## Message Types

The system handles the following message types:

### Incoming Messages (from server)

1. **attendance_update** - General attendance record update
2. **student_checked_in** - Student check-in event
3. **student_checked_out** - Student check-out event
4. **status_change** - Attendance status change
5. **manual_override** - Manual attendance override by instructor
6. **bulk_update** - Multiple attendance updates at once

### Outgoing Messages (to server, WebSocket only)

1. **update_status** - Update student attendance status
2. **request_sync** - Request full attendance sync
3. **heartbeat** - Keep connection alive

## Configuration

### WebSocket Options

```javascript
{
  onMessage: (message) => {},      // Custom message handler
  onConnect: () => {},             // Connection established
  onDisconnect: () => {},          // Connection lost
  onError: (error) => {},          // Error handler
  reconnectDelay: 3000,            // MS between reconnect attempts
  maxReconnectAttempts: 5,         // Max reconnection attempts
  enableSSEFallback: true,         // Auto-fallback to SSE
  broadcastToStore: true,          // Auto-broadcast to store
}
```

### SSE Options

```javascript
{
  onMessage: (message) => {},      // Custom message handler
  onConnect: () => {},             // Connection established
  onDisconnect: () => {},          // Connection lost
  onError: (error) => {},          // Error handler
  reconnectDelay: 3000,            // MS between reconnect attempts
  maxReconnectAttempts: 10,        // Max reconnection attempts
  heartbeatInterval: 30000,        // Heartbeat interval in MS
  broadcastToStore: true,          // Auto-broadcast to store
  eventTypes: [],                  // Event types to listen for
  includeCredentials: true,        // Include cookies/auth
}
```

## Best Practices

1. **Always use the attendance store** for state management rather than managing state in components
2. **Use selectors** for efficient re-renders
3. **Implement optimistic updates** for better UX
4. **Handle connection failures gracefully** with appropriate user feedback
5. **Use WebSocket as primary** and SSE as fallback
6. **Clean up subscriptions** in useEffect cleanup functions
7. **Batch updates** when possible to reduce re-renders
8. **Monitor connection status** and show appropriate UI indicators

## Testing

### Manual Testing

1. Test WebSocket connection:
   - Open browser DevTools Network tab
   - Look for WS connection
   - Check for message flow

2. Test SSE fallback:
   - Disable WebSocket in backend
   - Verify SSE connection establishes
   - Check unidirectional message flow

3. Test reconnection:
   - Stop backend server
   - Observe reconnection attempts
   - Restart server and verify reconnection

### Simulating Updates

```javascript
// In browser console for testing
const store = useAttendanceStore.getState();

// Simulate an update
store.handleAttendanceUpdate({
  type: 'student_checked_in',
  payload: {
    schedule_id: '123',
    student_id: '456',
    student_name: 'John Doe',
    check_in_time: new Date().toISOString(),
  }
});
```

## Troubleshooting

### WebSocket won't connect
- Check if token is being sent in query params
- Verify WebSocket URL is correct (ws:// or wss://)
- Check browser console for CORS errors
- Ensure backend WebSocket endpoint is running

### SSE not receiving updates
- Verify SSE endpoint URL
- Check if token is in query parameters
- Look for EventSource errors in console
- Ensure server sends proper SSE format

### Store not updating
- Verify `broadcastToStore` is true
- Check message format matches expected structure
- Ensure selectors are being used correctly
- Check for errors in store update handlers

### Optimistic updates not working
- Ensure update IDs are unique
- Verify confirm/revert is called
- Check if payload structure is correct
- Look for errors in update handlers
