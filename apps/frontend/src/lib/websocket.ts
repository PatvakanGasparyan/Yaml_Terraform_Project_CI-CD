import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

let socket: Socket | null = null;

export function getActivitySocket(): Socket {
  if (!socket) {
    socket = io(`${WS_URL}/activity`, {
      auth: { token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectActivitySocket() {
  socket?.disconnect();
  socket = null;
}
