import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useSocket = (event, callback) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    });

    if (event && callback) {
      socketInstance.on(event, callback);
    }

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [event]);

  return { socket, isConnected };
};
