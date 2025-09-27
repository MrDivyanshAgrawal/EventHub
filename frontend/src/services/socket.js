import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return;
    }
    
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  joinEvent(eventId) {
    if (!this.socket) {
      this.connect();
    }
    
    if (this.socket) {
      console.log(`Joining event room: ${eventId}`);
      this.socket.emit('joinEvent', eventId);
    }
  }
  
  leaveEvent(eventId) {
    if (this.socket) {
      console.log(`Leaving event room: ${eventId}`);
      this.socket.emit('leaveEvent', eventId);
    }
  }

  selectSeat(eventId, seatId, userId) {
    if (this.socket) {
      console.log(`Socket: selecting seat ${seatId}`);
      this.socket.emit('selectSeat', { eventId, seatId, userId });
    }
  }

  deselectSeat(eventId, seatId, userId) {
    if (this.socket) {
      console.log(`Socket: deselecting seat ${seatId}`);
      this.socket.emit('deselectSeat', { eventId, seatId, userId });
    }
  }

  onSeatSelected(callback) {
    if (this.socket) {
      this.socket.on('seatSelected', callback);
    }
  }

  onSeatReleased(callback) {
    if (this.socket) {
      this.socket.on('seatReleased', callback);
    }
  }

  onSeatsBooked(callback) {
    if (this.socket) {
      this.socket.on('seatsBooked', callback);
    }
  }
  
  onSeatSelectionError(callback) {
    if (this.socket) {
      this.socket.on('seatSelectionError', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
