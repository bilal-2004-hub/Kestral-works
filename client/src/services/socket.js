import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(window.location.origin, {
    path: '/socket.io',
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
