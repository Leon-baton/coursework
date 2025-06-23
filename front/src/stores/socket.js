import { defineStore } from 'pinia';
import socket from '../services/socket';

export const useSocketStore = defineStore('socket', {
    state: () => ({
        isConnected: false,
        isAuthenticatedOnSocket: false,
        participants: [],
    }),
    actions: {
        connect() {
            if (socket.connected && this.isAuthenticatedOnSocket) {
                console.log('Socket already connected and authenticated.');
                return;
            } else if (!socket.connected) {
                console.log('Connecting socket...');
                socket.connect();
            }

            socket.off('connect');
            socket.on('connect', () => {
                this.isConnected = true;
                console.log('Socket connected.');
            });

            socket.off('disconnect');
            socket.on('disconnect', (reason) => {
                this.isConnected = false;
                this.isAuthenticatedOnSocket = false;
                this.participants = [];
                console.log('Socket disconnected:', reason);
            });

            socket.off('authenticated');
            socket.on('authenticated', () => {
                this.isAuthenticatedOnSocket = true;
                console.log('Socket authenticated by backend.');
            });

            socket.off('participantsUpdate');
            socket.on('participantsUpdate', (data) => {
                console.log('Participants updated:', data);
                this.participants = data.map((p) => p.username);
            });
        },

        disconnect() {
            if (socket.connected) {
                console.log('Disconnecting socket...');
                socket.disconnect();
            }
            this.isConnected = false;
            this.isAuthenticatedOnSocket = false;
            this.participants = [];

            socket.off('authenticated');
            socket.off('participantsUpdate');
            socket.off('connect');
            socket.off('disconnect');
        },
    },
});
