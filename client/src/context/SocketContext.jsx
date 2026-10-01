import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { connectSocket, disconnectSocket } from '../services/socket.js';
import { getAccessToken } from '../services/api.js';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  // Increments each time the server emits project:claimed to this user.
  // Consumers (Dashboard, Projects) can watch this in a useEffect dep to refetch.
  const [projectClaimedCount, setProjectClaimedCount] = useState(0);

  // Keep the latest socket in a ref so event handlers always use the current one.
  const socketRef = useRef(null);

  const handleProjectClaimed = useCallback(() => {
    setProjectClaimedCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const s = connectSocket(token);
    socketRef.current = s;
    setSocket(s);

    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    // Listen for project claim confirmations — triggers Dashboard/Projects refresh
    s.on('project:claimed', handleProjectClaimed);

    if (s.connected) setIsConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('project:claimed', handleProjectClaimed);
    };
  }, [isAuthenticated, user, handleProjectClaimed]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, projectClaimedCount }}>
      {children}
    </SocketContext.Provider>
  );
}
