// Socket.io client wrapper.
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io({ auth: { token } });
  window.__voxelforgeSocket = socket;
  return socket;
}

export function getSocket() { return socket; }
export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
  window.__voxelforgeSocket = null;
}
