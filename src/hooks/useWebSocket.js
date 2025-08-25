import { useEffect, useRef, useState, useCallback } from 'react';
import config from '../config';
import useAuthStore from '../store/authStore';
import useAttendanceStore from '../store/attendanceStore';

/**
 * Custom hook for WebSocket connection with Server-Sent Events (SSE) fallback
 * Handles real-time attendance updates
 */
const useWebSocket = (scheduleId, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [connectionType, setConnectionType] = useState(null); // 'websocket' or 'sse'
  
  const wsRef = useRef(null);
  const sseRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  
  const { accessToken } = useAuthStore();
  const { handleAttendanceUpdate, setConnectionStatus } = useAttendanceStore();
  
  const {
    onMessage = () => {},
    onConnect = () => {},
    onDisconnect = () => {},
    onError = () => {},
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    enableSSEFallback = true,
    broadcastToStore = true, // New option to control store broadcasting
  } = options;

  /**
   * Parse WebSocket URL from HTTP URL
   */
  const getWebSocketUrl = useCallback(() => {
    // Trim trailing slashes to avoid double //
    const httpBase = (config.api.url || '').replace(/\/$/, '');
    // Convert http(s) -> ws(s)
    const wsBase = httpBase.startsWith('https')
      ? httpBase.replace(/^https/, 'wss')
      : httpBase.replace(/^http/, 'ws');
    return `${wsBase}/ws/attendance/updates/${scheduleId}/?token=${encodeURIComponent(accessToken || '')}`;
  }, [scheduleId, accessToken]);

  /**
   * Get SSE URL for fallback
   */
  const getSSEUrl = useCallback(() => {
    const base = (config.api.url || '').replace(/\/$/, '');
    // Pass token via query string since EventSource cannot set headers in browsers
    const token = encodeURIComponent(accessToken || '');
    return `${base}/sse/attendance/updates/${scheduleId}/?token=${token}`;
  }, [scheduleId, accessToken]);

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback((data) => {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      setLastMessage(message);
      onMessage(message);
      
      // Broadcast to attendance store if enabled
      if (broadcastToStore && message.type && message.payload) {
        handleAttendanceUpdate(message);
      }
      
      // Handle specific message types
      switch (message.type) {
        case 'attendance_update':
          console.log('Attendance update received:', message.payload);
          break;
        case 'student_checked_in':
          console.log('Student checked in:', message.payload);
          break;
        case 'student_checked_out':
          console.log('Student checked out:', message.payload);
          break;
        case 'status_change':
          console.log('Status change:', message.payload);
          break;
        case 'manual_override':
          console.log('Manual override:', message.payload);
          break;
        case 'bulk_update':
          console.log('Bulk update received:', message.payload);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Error parsing message:', err);
      setError('Failed to parse message');
    }
  }, [onMessage, broadcastToStore, handleAttendanceUpdate]);

  /**
   * Connect via WebSocket
   */
  const connectWebSocket = useCallback(() => {
    if (!scheduleId || !accessToken) {
      console.log('Missing scheduleId or accessToken');
      return;
    }

    try {
      const wsUrl = getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionType('websocket');
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Update store connection status
        if (broadcastToStore) {
          setConnectionStatus({
            isConnected: true,
            connectionType: 'websocket',
          });
        }
        
        onConnect('websocket');
      };

      ws.onmessage = (event) => {
        handleMessage(event.data);
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        onError(event);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionType(null);
        wsRef.current = null;
        
        // Update store connection status
        if (broadcastToStore) {
          setConnectionStatus({
            isConnected: false,
            connectionType: null,
          });
        }
        
        onDisconnect('websocket');

        // Try SSE fallback if WebSocket fails
        if (enableSSEFallback && reconnectAttemptsRef.current === 0) {
          console.log('Attempting SSE fallback...');
          connectSSE();
        } else if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          // Attempt reconnection
          reconnectAttemptsRef.current += 1;
          console.log(`Reconnecting in ${reconnectDelay}ms... (Attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, reconnectDelay);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(err.message);
      
      // Try SSE fallback
      if (enableSSEFallback) {
        connectSSE();
      }
    }
  }, [scheduleId, accessToken, getWebSocketUrl, handleMessage, onConnect, onDisconnect, onError, reconnectDelay, maxReconnectAttempts, enableSSEFallback, broadcastToStore, setConnectionStatus]);

  /**
   * Connect via Server-Sent Events (SSE) as fallback
   */
  const connectSSE = useCallback(() => {
    if (!scheduleId || !accessToken) {
      console.log('Missing scheduleId or accessToken for SSE');
      return;
    }

    try {
      const sseUrl = getSSEUrl();
      console.log('Connecting to SSE:', sseUrl);
      
      // Note: Browser EventSource does not support custom headers. Token is in query.
      const eventSource = new EventSource(sseUrl, { withCredentials: false });
      
      sseRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected');
        setIsConnected(true);
        setConnectionType('sse');
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Update store connection status
        if (broadcastToStore) {
          setConnectionStatus({
            isConnected: true,
            connectionType: 'sse',
          });
        }
        
        onConnect('sse');
      };

      eventSource.onmessage = (event) => {
        handleMessage(event.data);
      };

      eventSource.addEventListener('attendance_update', (event) => {
        handleMessage(event.data);
      });

      eventSource.onerror = (event) => {
        console.error('SSE error:', event);
        setError('SSE connection error');
        setIsConnected(false);
        setConnectionType(null);
        onError(event);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          sseRef.current = null;
          
          // Update store connection status
          if (broadcastToStore) {
            setConnectionStatus({
              isConnected: false,
              connectionType: null,
            });
          }
          
          onDisconnect('sse');
          
          // Attempt reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            console.log(`Reconnecting SSE in ${reconnectDelay}ms... (Attempt ${reconnectAttemptsRef.current})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, reconnectDelay);
          }
        }
      };
    } catch (err) {
      console.error('Error creating SSE connection:', err);
      setError(err.message);
    }
  }, [scheduleId, accessToken, getSSEUrl, handleMessage, onConnect, onDisconnect, onError, reconnectDelay, maxReconnectAttempts, broadcastToStore, setConnectionStatus]);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(data);
      return true;
    } else if (connectionType === 'sse') {
      console.warn('Cannot send messages through SSE connection');
      return false;
    } else {
      console.error('WebSocket is not connected');
      setError('WebSocket is not connected');
      return false;
    }
  }, [connectionType]);

  /**
   * Manually disconnect
   */
  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Close SSE
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    setIsConnected(false);
    setConnectionType(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connectWebSocket();
  }, [disconnect, connectWebSocket]);

  /**
   * Effect to manage connection lifecycle
   */
  useEffect(() => {
    if (scheduleId && accessToken) {
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [scheduleId, accessToken]); // Only reconnect if scheduleId or token changes

  return {
    isConnected,
    connectionType,
    lastMessage,
    error,
    sendMessage,
    disconnect,
    reconnect,
  };
};

export default useWebSocket;
