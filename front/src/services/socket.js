import { io } from 'socket.io-client';

const SOCKET_URL = 'ws://localhost:3000';
const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'],
    auth: (cb) => {
        const accessToken = localStorage.getItem('accessToken');
        cb({ token: accessToken });
    },
});

socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
    if (err.message === 'Unauthorized' || err.message === 'jwt expired') {
        console.log('Socket unauthorized, attempting to refresh token via API if configured');
    }
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
});

export default socket;
