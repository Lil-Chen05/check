import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL
  || `${window.location.protocol}//${window.location.hostname}:3001`;

let socketInstance = null;
let socketDisplayName = null;

export function useSocket(token, userId, displayName) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const ready = !!(userId && displayName && displayName !== 'Player');

  useEffect(() => {
    if (!ready && !socketInstance) return;

    if (socketInstance?.connected && socketDisplayName === displayName) {
      socketRef.current = socketInstance;
      setConnected(true);
      return;
    }

    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }

    if (!ready) return;

    const socket = io(SERVER_URL, {
      auth: { token, userId, displayName },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socketInstance = socket;
    socketDisplayName = displayName;
    socketRef.current = socket;
  }, [token, userId, displayName, ready]);

  const emit = useCallback((event, data) => {
    return new Promise((resolve) => {
      if (data !== undefined && data !== null) {
        socketRef.current?.emit(event, data, (response) => resolve(response));
      } else {
        socketRef.current?.emit(event, (response) => resolve(response));
      }
    });
  }, []);

  const emitNoAck = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, connected, emit, emitNoAck, on, off };
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    socketDisplayName = null;
  }
}
