import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import config from '../config';

const usePusher = (channelName, eventName, callback) => {
  const pusherRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!config.pusher.key || !channelName || !eventName || !callback) {
      return;
    }

    // Initialize Pusher
    pusherRef.current = new Pusher(config.pusher.key, {
      cluster: config.pusher.cluster,
      encrypted: true,
    });

    // Subscribe to channel
    channelRef.current = pusherRef.current.subscribe(channelName);
    
    // Bind to event
    channelRef.current.bind(eventName, callback);

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind(eventName, callback);
        pusherRef.current.unsubscribe(channelName);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [channelName, eventName, callback]);

  return pusherRef.current;
};

export default usePusher;
