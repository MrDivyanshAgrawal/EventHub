import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { eventService } from '../services/auth';
import SeatSelector from '../components/SeatSelector';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import {
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon,
  TagIcon,
  ExclamationCircleIcon,
  CurrencyRupeeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeGalleryImage, setActiveGalleryImage] = useState(0);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availableSeatsCount, setAvailableSeatsCount] = useState(0);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!event) return;

    socketService.joinEvent(event._id);

    const handleSeatSelectedByOther = ({ seatId, userId }) => {
      if (userId !== user?._id) {
        console.log(`Seat ${seatId} temporarily selected by another user`);
        setAvailableSeatsCount(prev => Math.max(0, prev - 1));
      }
    };

    const handleSeatReleasedByOther = ({ seatId, userId }) => {
      if (userId !== user?._id) {
        console.log(`Seat ${seatId} released by another user`);
        setAvailableSeatsCount(prev => Math.min(event.totalSeats, prev + 1));
      }
    };

    const handleSeatsBooked = ({ seats: bookedSeatIds }) => {
      console.log('Seats booked notification received:', bookedSeatIds);
      
      const bookedCount = bookedSeatIds.length;
      setAvailableSeatsCount(prev => Math.max(0, prev - bookedCount));
      
      setEvent(prev => ({
        ...prev,
        availableSeats: Math.max(0, prev.availableSeats - bookedCount),
        seats: prev.seats ? prev.seats.map(seat => 
          bookedSeatIds.includes(seat._id) ? { ...seat, isAvailable: false } : seat
        ) : prev.seats
      }));
    };

    const handleSeatsReleased = ({ seats: releasedSeatIds }) => {
      console.log('Seats released notification received:', releasedSeatIds);
      
      const releasedCount = releasedSeatIds.length;
      setAvailableSeatsCount(prev => Math.min(event.totalSeats, prev + releasedCount));
      
      setEvent(prev => ({
        ...prev,
        availableSeats: Math.min(prev.totalSeats, prev.availableSeats + releasedCount),
        seats: prev.seats ? prev.seats.map(seat => 
          releasedSeatIds.includes(seat._id) ? { ...seat, isAvailable: true } : seat
        ) : prev.seats
      }));
    };

    socketService.onSeatSelected(handleSeatSelectedByOther);
    socketService.onSeatReleased(handleSeatReleasedByOther);
    socketService.onSeatsBooked(handleSeatsBooked);
    
    if (socketService.socket) {
      socketService.socket.on('seatsReleased', handleSeatsReleased);
    }

    return () => {
      socketService.leaveEvent(event._id);
      if (socketService.socket) {
        socketService.socket.off('seatSelected', handleSeatSelectedByOther);
        socketService.socket.off('seatReleased', handleSeatReleasedByOther);
        socketService.socket.off('seatsBooked', handleSeatsBooked);
        socketService.socket.off('seatsReleased', handleSeatsReleased);
      }
    };
  }, [event?._id, event?.totalSeats, user?._id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvent(id);
      const eventData = response.data.data || response.data;
      
      if (eventData) {
        let actualAvailableSeats = 0;
        if (eventData.seats && eventData.seats.length > 0) {
          actualAvailableSeats = eventData.seats.filter(seat => seat.isAvailable).length;
        } else {
          actualAvailableSeats = eventData.availableSeats || 0;
        }
        actualAvailableSeats = Math.max(0, Math.min(actualAvailableSeats, eventData.totalSeats));
        
        eventData.availableSeats = actualAvailableSeats;
        setAvailableSeatsCount(actualAvailableSeats);
      }
      
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError(error.response?.data?.message || 'Failed to load event details');
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const refreshEventData = async () => {
    try {
      setRefreshing(true);
      const response = await eventService.getEvent(id);
      const eventData = response.data.data || response.data;
      
      if (eventData) {
        let actualAvailableSeats = 0;
        if (eventData.seats && eventData.seats.length > 0) {
          actualAvailableSeats = eventData.seats.filter(seat => seat.isAvailable).length;
        } else {
          actualAvailableSeats = eventData.availableSeats || 0;
        }
        
        actualAvailableSeats = Math.max(0, Math.min(actualAvailableSeats, eventData.totalSeats));
        eventData.availableSeats = actualAvailableSeats;
        setAvailableSeatsCount(actualAvailableSeats);
      }
      
      setEvent(eventData);
      toast.success('Event data refreshed');
    } catch (error) {
      console.error('Error refreshing event:', error);
      toast.error('Failed to refresh event data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSeatSelectionChange = (seats) => {
    setSelectedSeats(seats);
    
    if (event && event.seats) {
      const actualAvailableSeats = event.seats.filter(seat => {
        return seat.isAvailable && !seats.some(s => s._id === seat._id);
      }).length;
      setAvailableSeatsCount(actualAvailableSeats);
    }
  };

  const handleBooking = () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    setIsNavigatingToCheckout(true);
    
    navigate(`/checkout/${id}`, { 
      state: { 
        selectedSeats,
        event: {
          _id: event._id,
          title: event.title,
          startDate: event.startDate,
          imageUrl: event.imageUrl
        }
      } 
    });
  };

  useEffect(() => {
    return () => {
      if (selectedSeats && selectedSeats.length > 0 && !isNavigatingToCheckout && event) {
        console.log('EventDetails cleanup: releasing selected seats');
        selectedSeats.forEach(seat => {
          eventService.releaseSeat(event._id, seat._id)
            .catch(err => console.error('Error releasing seat on unmount:', err));
        });
      }
    };
  }, [selectedSeats, event, isNavigatingToCheckout]);
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: window.location.href,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) return <Loader />;
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Event</h2>
      <p className="text-gray-600 mb-8">{error}</p>
      <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
        Go Back
      </button>
    </div>
  );
  if (!event) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
      <p className="text-gray-600 mb-8">The event you're looking for doesn't exist or has been removed.</p>
      <button onClick={() => navigate('/events')} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
        Browse Events
      </button>
    </div>
  );

  const startDate = parseISO(event.startDate);
  const endDate = event.endDate ? parseISO(event.endDate) : null;
  const isPastEvent = startDate < new Date();
  
  const isMultiDayEvent = endDate && 
    format(startDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-48 sm:h-64 md:h-96">
        <img 
          src={
            event.galleryImages && event.galleryImages.length > 0 && activeGalleryImage < event.galleryImages.length
              ? event.galleryImages[activeGalleryImage]
              : event.imageUrl || 'https://picsum.photos/1200/400'
          } 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur p-2 rounded-full hover:bg-white transition-colors z-10"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>

        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="bg-white/90 backdrop-blur p-2 rounded-full hover:bg-white transition-colors"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="bg-white/90 backdrop-blur p-2 rounded-full hover:bg-white transition-colors"
            aria-label="Share event"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4">
          <span className="bg-primary-600 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium capitalize">
            {event.category}
          </span>
        </div>
      </div>

      {event.galleryImages && event.galleryImages.length > 1 && (
        <div className="bg-gray-900 p-2 flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 gap-2">
          <img
            src={event.imageUrl}
            alt="Main"
            className={`h-12 w-16 sm:h-16 sm:w-24 object-cover rounded cursor-pointer transition 
              ${activeGalleryImage === -1 ? 'border-2 border-primary-500 opacity-100' : 'opacity-70 hover:opacity-100'}`}
            onClick={() => setActiveGalleryImage(-1)}
          />
          {event.galleryImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Gallery ${index + 1}`}
              className={`h-12 w-16 sm:h-16 sm:w-24 object-cover rounded cursor-pointer transition
                ${activeGalleryImage === index ? 'border-2 border-primary-500 opacity-100' : 'opacity-70 hover:opacity-100'}`}
              onClick={() => setActiveGalleryImage(index)}
            />
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    {format(startDate, 'EEE, MMM d, yyyy')}
                    {isMultiDayEvent && ` - ${format(endDate, 'EEE, MMM d, yyyy')}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{format(startDate, 'h:mm a')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    {event.location.name}, {event.location.city}, {event.location.state}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Organized by</p>
                  <p className="font-medium text-sm sm:text-base">{event.organizer?.name || 'Event Organizer'}</p>
                </div>
              </div>
            </div>
            {event.status !== 'published' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This event is currently in {event.status} mode and is not publicly visible.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="prose max-w-none">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">About This Event</h2>
              <div className="text-gray-600 whitespace-pre-line text-sm sm:text-base">
                {event.description}
              </div>
            </div>
            
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <TagIcon className="h-5 w-5 text-gray-500" />
                {event.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-gray-100 rounded-full text-gray-800 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Venue</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">{event.location.name}</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  {event.location.address}<br />
                  {event.location.city}, {event.location.state} {event.location.zipCode}<br />
                  {event.location.country}
                </p>
              </div>
            </div>

            {!isPastEvent && event.seats && event.seats.length > 0 && (
              <SeatSelector 
                event={event} 
                onSeatSelectionChange={handleSeatSelectionChange}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Details</h3>
                <button
                  onClick={refreshEventData}
                  disabled={refreshing}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  title="Refresh availability"
                >
                  <ArrowPathIcon className={`h-4 w-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${
                    isPastEvent 
                      ? 'text-red-600' 
                      : event.status === 'published' 
                        ? 'text-green-600' 
                        : 'text-yellow-600'
                  }`}>
                    {isPastEvent 
                      ? 'Event Ended' 
                      : event.status === 'published'
                        ? 'Available'
                        : 'Draft'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Seats</span>
                  <span className="font-medium">{event.totalSeats || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available</span>
                  <span className={`font-medium ${availableSeatsCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {availableSeatsCount}
                  </span>
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Selected Seats</span>
                    <span className="font-medium">{selectedSeats.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Price</span>
                    <span className="text-xl font-bold text-primary-600 flex items-center">
                      <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                      {selectedSeats.reduce((sum, seat) => sum + seat.price, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {!isPastEvent ? (
                <button
                  onClick={handleBooking}
                  disabled={availableSeatsCount === 0 || event.status !== 'published'}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableSeatsCount === 0 
                    ? 'Sold Out' 
                    : event.status !== 'published'
                    ? 'Not Available'
                    : selectedSeats.length > 0 
                      ? 'Book Now'
                      : 'Select Seats'}
                </button>
              ) : (
                <button disabled className="w-full px-4 py-3 bg-primary-600 text-white rounded-md text-base sm:text-lg opacity-50 cursor-not-allowed">
                  Event Ended
                </button>
              )}

              {!user && !isPastEvent && event.status === 'published' && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  <Link to="/login" state={{ from: `/events/${id}` }} className="text-primary-600 hover:text-primary-700">
                    Login
                  </Link>{' '}
                  to book tickets
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
