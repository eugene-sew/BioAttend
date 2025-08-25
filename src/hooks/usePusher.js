import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import config from '../config';
import useAttendanceStore from '../store/attendanceStore';
import useAuthStore from '../store/authStore';

/**
 * usePusher - Subscribe to real-time attendance updates via Pusher Channels
 *
 * Channels:
 * - channel: `attendance-updates-<scheduleId>`
 * - events: 'attendance_update', 'student_checked_in', 'student_checked_out', 'status_change', 'manual_override', 'bulk_update'
 */
// Module-level singleton client and bound-tracking
let _pusherClient = null;
const _boundChannels = new Map(); // channelName -> boolean

const usePusher = (scheduleId, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [error, setError] = useState(null);
  const { handleAttendanceUpdate, setConnectionStatus } = useAttendanceStore();
  const { accessToken } = useAuthStore();

  const pusherRef = useRef(null);
  const channelRef = useRef(null);

  const {
    onEvent = () => {},
    onConnect = () => {},
    onDisconnect = () => {},
    onError = () => {},
    broadcastToStore = true,
    channelPrefix = 'attendance-updates',
  } = options;

  // Keep latest handlers in refs to avoid re-subscribing
  const onEventRef = useRef(onEvent);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  const broadcastToStoreRef = useRef(broadcastToStore);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    broadcastToStoreRef.current = broadcastToStore;
  }, [broadcastToStore]);

  const channelName = `${channelPrefix}-${scheduleId}`;

  const handleMessage = useCallback((type, payload) => {
    const message = { type, payload };
    setLastEvent(message);
    onEventRef.current(message);

    if (broadcastToStoreRef.current && type && payload) {
      handleAttendanceUpdate(message);
    }
  }, [handleAttendanceUpdate]);

  useEffect(() => {
    if (!scheduleId || !config.pusher.key) return;

    try {
      // Create singleton client once
      if (!_pusherClient) {
        _pusherClient = new Pusher(config.pusher.key, {
          cluster: config.pusher.cluster,
          disableStats: true,
          // forceTLS is automatic when using cluster; leave defaults
          // enabledTransports: ['ws', 'wss'], // optional
          // logToConsole: config.isDevelopment,
        });
      }

      pusherRef.current = _pusherClient;

      const pusher = _pusherClient;
      let channel = pusher.channel(channelName);
      if (!channel) {
        channel = pusher.subscribe(channelName);
      }
      channelRef.current = channel;

      const onConn = () => {
        setIsConnected(true);
        setError(null);
        setConnectionStatus({ isConnected: true, connectionType: 'pusher' });
        onConnectRef.current('pusher');
      };
      const onDisconn = () => {
        setIsConnected(false);
        setConnectionStatus({ isConnected: false, connectionType: null });
        onDisconnectRef.current('pusher');
      };
      const onErr = (e) => {
        setError(e);
        onErrorRef.current(e);
      };

      pusher.connection.bind('connected', onConn);
      pusher.connection.bind('disconnected', onDisconn);
      pusher.connection.bind('error', onErr);

      // Bind attendance events only once per channel
      const eventTypes = [
        'attendance_update',
        'student_checked_in',
        'student_checked_out',
        'status_change',
        'manual_override',
        'bulk_update',
      ];

      if (!_boundChannels.get(channelName)) {
        eventTypes.forEach((evt) => {
          channel.bind(evt, (data) => handleMessage(evt, data));
        });
        _boundChannels.set(channelName, true);
      }

      return () => {
        try {
          // Only unsubscribe if no other hook instance needs it. For simplicity, keep subscribed and just unbind connection handlers.
          pusher.connection.unbind('connected', onConn);
          pusher.connection.unbind('disconnected', onDisconn);
          pusher.connection.unbind('error', onErr);
        } catch {
          // ignore
        }
      };
    } catch (e) {
      setError(e);
      onErrorRef.current(e);
    }
  }, [scheduleId, channelName, handleMessage, setConnectionStatus]);

  return { isConnected, lastEvent, error, connectionType: 'pusher', channel: channelRef.current };
};

export default usePusher;
