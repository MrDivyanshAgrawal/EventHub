export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '/api');
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000' : 'https://eventhub-t9i2.onrender.com');

export const EVENT_CATEGORIES = [
  { value: 'concert', label: 'Concerts', icon: '🎵' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'theater', label: 'Theater', icon: '🎭' },
  { value: 'conference', label: 'Conferences', icon: '💼' },
  { value: 'exhibition', label: 'Exhibitions', icon: '🖼️' },
  { value: 'workshop', label: 'Workshops', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '✨' }
];

export const SEAT_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' }
];

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};
