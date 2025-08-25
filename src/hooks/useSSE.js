import { useEffect, useRef, useState, useCallback } from 'react';
import config from '../config';
import useAuthStore from '../store/authStore';
import useAttendanceStore from '../store/attendanceStore';

/**
 * Custom hook for Server-Sent Events (SSE) connection
 * Alternative to WebSocket for real-time updates when WS is unavailable
 */
const useSSE = (endpoint, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  
  const { accessToken } = useAuthStore();
  const { handleAttendanceUpdate, setConnectionStatus } = useAttendanceStore();
  
  const {
    onMessage = () => {},
    onConnect = () => {},
    onDisconnect = () => {},
    onError = () => {},
    reconnectDelay = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000, // Send heartbeat every 30 seconds
    broadcastToStore = true,
    eventTypes = ['message', 'attendance_update', 'student_checked_in', 'student_checked_out', 'status_change', 'manual_override', 'bulk_update'], // Event types to listen for
    includeCredentials = true,
  } = options;

  /**
   * Build SSE URL with authentication
   */
  const buildSSEUrl = useCallback(() => {
    const baseUrl = `${config.api.url}${endpoint}`;
    // Add token as query parameter since SSE doesn't support custom headers
    const url = new URL(baseUrl);
    if (accessToken) {
      url.searchParams.append('token', accessToken);
    }
    return url.toString();
  }, [endpoint, accessToken]);

  /**
   * Handle incoming SSE messages
   */
  const handleSSEMessage = useCallback((event) => {
    try {
      const data = event.data;
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      setLastMessage(message);
      onMessage(message);
      
      // Broadcast to attendance store if enabled
      if (broadcastToStore && message.type && message.payload) {
        handleAttendanceUpdate(message);
      }
      
      // Log specific message types
      if (message.type) {
        console.log(`SSE ${message.type} received:`, message.payload);
      }
    } catch (err) {
      console.error('Error parsing SSE message:', err);
      setError('Failed to parse SSE message');
    }
  }, [onMessage, broadcastToStore, handleAttendanceUpdate]);

  /**
   * Setup heartbeat to keep connection alive
   */
  const setupHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
        console.log('SSE heartbeat - connection alive');
        if (broadcastToStore) {
          setConnectionStatus({
            isConnected: true,
            connectionType: 'sse',
          });
        }
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, broadcastToStore, setConnectionStatus]);

  /**
   * Clear heartbeat interval
   */
  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!endpoint) {
      console.error('SSE endpoint is required');
      setError('No endpoint provided');
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const sseUrl = buildSSEUrl();
      console.log('Connecting to SSE:', sseUrl);
      
      // Create EventSource with credentials if needed
      const eventSourceOptions = includeCredentials ? { withCredentials: true } : {};
      const eventSource = new EventSource(sseUrl, eventSourceOptions);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setError(null);
        setReconnectCount(0);
        
        // Update store connection status
        if (broadcastToStore) {
          setConnectionStatus({
            isConnected: true,
            connectionType: 'sse',
          });
        }
        
        // Setup heartbeat
        setupHeartbeat();
        
        onConnect();
      };

      // Default message handler
      eventSource.onmessage = handleSSEMessage;

      // Register handlers for specific event types
      eventTypes.forEach((eventType) => {
        if (eventType !== 'message') {
          eventSource.addEventListener(eventType, handleSSEMessage);
        }
      });

      // Error handler
      eventSource.onerror = (event) => {
        console.error('SSE error:', event);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE connection closed');
          setIsConnected(false);
          setError('SSE connection closed');
          eventSourceRef.current = null;
          clearHeartbeat();
          
          // Update store connection status
          if (broadcastToStore) {
            setConnectionStatus({
              isConnected: false,
              connectionType: null,
            });
          }
          
          onDisconnect();
          onError(event);
          
          // Attempt reconnection
          if (reconnectCount < maxReconnectAttempts) {
            const nextReconnectCount = reconnectCount + 1;
            setReconnectCount(nextReconnectCount);
            
            console.log(`Reconnecting SSE in ${reconnectDelay}ms... (Attempt ${nextReconnectCount}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectDelay);
          } else {
            setError('Max reconnection attempts reached');
          }
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          console.log('SSE reconnecting...');
          setError('SSE reconnecting...');
        }
      };
    } catch (err) {
      console.error('Error creating SSE connection:', err);
      setError(err.message);
      onError(err);
    }
  }, [
    endpoint,
    buildSSEUrl,
    includeCredentials,
    handleSSEMessage,
    eventTypes,
    onConnect,
    onDisconnect,
    onError,
    reconnectCount,
    maxReconnectAttempts,
    reconnectDelay,
    broadcastToStore,
    setConnectionStatus,
    setupHeartbeat,
    clearHeartbeat,
  ]);

  /**
   * Disconnect from SSE
   */
  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear heartbeat
    clearHeartbeat();

    // Close EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setReconnectCount(0);
    
    // Update store connection status
    if (broadcastToStore) {
      setConnectionStatus({
        isConnected: false,
        connectionType: null,
      });
    }
  }, [clearHeartbeat, broadcastToStore, setConnectionStatus]);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    disconnect();
    setReconnectCount(0);
    connect();
  }, [disconnect, connect]);

  /**
   * Effect to manage connection lifecycle
   */
  useEffect(() => {
    if (endpoint && accessToken) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [endpoint, accessToken]); // Only reconnect if endpoint or token changes

  return {
    isConnected,
    lastMessage,
    error,
    reconnectCount,
    disconnect,
    reconnect,
    // SSE doesn't support sending messages
    sendMessage: () => {
      console.warn('SSE is read-only and cannot send messages. Use WebSocket for bidirectional communication.');
      return false;
    },
  };
};

export default useSSE;
