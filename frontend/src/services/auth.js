import api from './api';

export const authService = {
  signup: async (data) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.get('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

export const eventService = {
  getEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  selectSeat: async (eventId, seatId) => {
    try {
      const response = await api.post(`/events/${eventId}/select-seat`, { seatId });
      return response.data;
    } catch (error) {
      console.error('Error selecting seat:', error);
      throw error; 
    }
  },

  releaseSeat: async (eventId, seatId) => {
    try {
      const response = await api.post(`/events/${eventId}/release-seat`, { seatId });
      console.log(`Successfully released seat ${seatId} for event ${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error releasing seat ${seatId} for event ${eventId}:`, error);
      return { success: false, error: error.message };
    }
  },

  getOrganizerEvents: async () => {
    const response = await api.get('/events/organizer/events');
    return response.data;
  },

  createEvent: async (data) => {
    const response = await api.post('/events', data);
    return response.data;
  },

  updateEvent: async (id, data) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  updateEventSeats: async (id, seats) => {
    const response = await api.put(`/events/${id}/seats`, { seats });
    return response.data;
  },

  publishEvent: async (id) => {
    const response = await api.put(`/events/${id}/publish`);
    return response.data;
  },
};

export const bookingService = {
  createBooking: async (data) => {
    try {
      const response = await api.post('/bookings', data);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  getUserBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getBooking: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  confirmBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/confirm`);
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  getOrganizerBookings: async () => {
    const response = await api.get('/bookings/organizer');
    return response.data;
  },

  verifyTicket: async (ticketCode) => {
    const response = await api.put('/bookings/verify-ticket', { ticketCode });
    return response.data;
  },

  manualConfirmBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/manual-confirm`);
    return response.data;
  },
  getAllBookings: async (params = {}) => {
    const response = await api.get('/bookings/admin/all', { params });
    return response;
  },

  getBookingAnalytics: async (params = {}) => {
    const response = await api.get('/bookings/admin/analytics', { params });
    return response;
  },

  bulkBookingAction: async (data) => {
    const response = await api.put('/bookings/admin/bulk-action', data);
    return response;
  },
};

export const paymentService = {
  getConfig: async () => {
    const response = await api.get('/payments/config');
    return response.data;
  },

  createPaymentIntent: async (data) => {
    try {
      const response = await api.post('/payments/create-intent', data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },
};

export default {
  authService,
  eventService,
  bookingService,
  paymentService
};
