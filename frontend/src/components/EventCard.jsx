import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CalendarDaysIcon, MapPinIcon, TicketIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

const EventCard = ({ event }) => {
  const eventDate = event.startDate ? parseISO(event.startDate) : new Date();
  const totalSeats = event.totalSeats || 0;
  const availableSeats = event.availableSeats || 0;
  const availablePercentage = totalSeats > 0 
    ? (availableSeats / totalSeats) * 100 
    : 0;
  const lowestPrice = event.seats && event.seats.length > 0 
    ? Math.min(...event.seats.map(seat => seat.price || 0))
    : 0;
  const locationText = event.location?.city || event.location?.name || 'Location TBA';

  return (
    <Link 
      to={`/events/${event._id}`} 
      className="block group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full"
      aria-label={`View details for ${event.title || 'Untitled Event'}`}
    >
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img 
          src={event.imageUrl || 'https://via.placeholder.com/400x250'} 
          alt={event.title || 'Event'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x250';
          }}
        />
        <div className="absolute bottom-3 left-3">
          <span className="bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium capitalize">
            {event.category || 'event'}
          </span>
        </div>
        {event.status === 'draft' && (
          <div className="absolute top-3 right-3">
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
              Draft
            </span>
          </div>
        )}
        
        {event.isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
              Featured
            </span>
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4 flex flex-col h-[calc(100%-10rem)]">
        <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
          {event.title || 'Untitled Event'}
        </h3>
        
        <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-1">
          <CalendarDaysIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">
            {format(eventDate, 'MMM d, yyyy • h:mm a')}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-3">
          <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">
            {locationText}
          </span>
        </div>
        
        <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center">
            <TicketIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-500" />
            <span className={`text-xs ${
              availableSeats === 0 
                ? 'text-red-600 font-medium' 
                : availablePercentage <= 20 
                  ? 'text-red-600' 
                  : availablePercentage <= 50 
                    ? 'text-yellow-600' 
                    : 'text-gray-500'
            }`}>
              {totalSeats === 0 
                ? 'TBA' 
                : availableSeats === 0 
                  ? 'Sold Out' 
                  : availableSeats < 10 
                    ? `Only ${availableSeats} left` 
                    : `${availableSeats} available`}
            </span>
          </div>
          
          {lowestPrice > 0 && (
            <span className="text-primary-600 font-semibold text-xs sm:text-sm flex items-center">
              <span className="mr-0.5">From</span>
              <CurrencyRupeeIcon className="h-3 w-3 mr-0.5" />
              {lowestPrice.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
