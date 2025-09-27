import React, { useState, useEffect } from 'react';
import { eventService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import { CurrencyRupeeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const SeatSelector = ({ event, onSeatSelectionChange }) => {
  const { user } = useAuth();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [temporarilyHeldSeats, setTemporarilyHeldSeats] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  
  const refreshSeatData = async () => {
    try {
      setRefreshing(true);
      const freshEvent = await eventService.getEvent(event._id);
      if (freshEvent?.data?.seats) {
        console.log('Refreshed seats data:', freshEvent.data.seats.length, 'seats');

        const availableCount = freshEvent.data.seats.filter(seat => seat.isAvailable).length;
        const unavailableCount = freshEvent.data.seats.filter(seat => !seat.isAvailable).length;
        console.log(`Refreshed seat status: Available: ${availableCount}, Unavailable: ${unavailableCount}`);
        
        setSeats(freshEvent.data.seats);
        
        setSelectedSeats(prevSelected => 
          prevSelected.filter(seat => {
            const updatedSeat = freshEvent.data.seats.find(s => s._id === seat._id);
            return updatedSeat && updatedSeat.isAvailable;
          })
        );
      }
      toast.success('Seat data refreshed');
    } catch (error) {
      console.error('Error refreshing seat data:', error);
      toast.error('Failed to refresh seat data');
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (event && event.seats) {
      console.log('Initial seats data:', event.seats.length, 'seats');
      
      const availableCount = event.seats.filter(seat => seat.isAvailable).length;
      const unavailableCount = event.seats.filter(seat => !seat.isAvailable).length;
      console.log(`Initial seat status: Available: ${availableCount}, Unavailable: ${unavailableCount}`);
      
      setSeats(event.seats);
      setLoading(false);
      
      const timeoutId = setTimeout(() => {
        refreshSeatData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [event]);
  
  useEffect(() => {
    socketService.connect();
    socketService.joinEvent(event._id);
    
    socketService.onSeatSelected(handleSeatSelectedByOther);
    socketService.onSeatReleased(handleSeatReleasedByOther);
    socketService.onSeatsBooked(handleSeatsBooked);
    
    if (socketService.socket) {
      socketService.socket.on('disconnect', () => {
        toast.error("Connection lost. Trying to reconnect...");
      });
      
      socketService.socket.on('reconnect', () => {
        toast.success("Reconnected successfully!");
        socketService.joinEvent(event._id);
        refreshSeatData();
      });
    }
    
    const intervalId = setInterval(() => {
      refreshSeatData();
    }, 60000);
    
    return () => {
      clearInterval(intervalId);
      
      if (selectedSeats.length > 0) {
        console.log('SeatSelector cleanup: releasing selected seats');
        selectedSeats.forEach(seat => {
          releaseSeat(seat._id, true); 
        });
      }
      
      socketService.leaveEvent(event._id);
      
      if (socketService.socket) {
        socketService.socket.off('disconnect');
        socketService.socket.off('reconnect');
      }
    };
  }, [event._id]); 
  
  useEffect(() => {
    if (selectedSeats.length > 0) {
      const timeoutId = setTimeout(() => {
        toast.warning("Your seat selection will expire soon. Please complete your booking.", {
          duration: 10000
        });
      }, 8 * 60 * 1000); 
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedSeats]);
  
  const handleSeatSelectedByOther = ({ seatId, userId }) => {
    if (userId !== user?._id) {
      console.log(`Seat ${seatId} temporarily held by another user`);
      setTemporarilyHeldSeats(prev => new Set(prev).add(seatId));
      
      setSeats(prevSeats => 
        prevSeats.map(seat => 
          seat._id === seatId ? { ...seat, isAvailable: false } : seat
        )
      );
    }
  };
  
  const handleSeatReleasedByOther = ({ seatId, userId }) => {
    if (userId !== user?._id) {
      console.log(`Seat ${seatId} released by another user`);
      setTemporarilyHeldSeats(prev => {
        const newSet = new Set(prev);
        newSet.delete(seatId);
        return newSet;
      });
      
      setSeats(prevSeats => 
        prevSeats.map(seat => 
          seat._id === seatId ? { ...seat, isAvailable: true } : seat
        )
      );
    }
  };
  
  const handleSeatsBooked = ({ seats: bookedSeats }) => {
    console.log('Seats permanently booked:', bookedSeats);
    
    setSeats(prevSeats => 
      prevSeats.map(seat => 
        bookedSeats.includes(seat._id) ? { ...seat, isAvailable: false } : seat
      )
    );
    
    const bookedSelectedSeats = selectedSeats.filter(seat => bookedSeats.includes(seat._id));
    if (bookedSelectedSeats.length > 0) {
      toast.error(`Some of your selected seats were just booked by someone else`);
      setSelectedSeats(prevSelected => 
        prevSelected.filter(seat => !bookedSeats.includes(seat._id))
      );
    }
    
    setTemporarilyHeldSeats(prev => {
      const newSet = new Set(prev);
      bookedSeats.forEach(seatId => newSet.delete(seatId));
      return newSet;
    });
  };
  
  const handleSeatSelect = async (seat) => {

    if (event.status !== "published") {
      toast.error("Cannot select seats for an unpublished event");
      return;
    }
    
    if (temporarilyHeldSeats.has(seat._id) && !selectedSeats.some(s => s._id === seat._id)) {
      toast.error('This seat is being selected by another user');
      return;
    }
    
    if (!seat.isAvailable && !selectedSeats.some(s => s._id === seat._id)) {
      toast.error('This seat is already booked');
      return;
    }
    
    try {
      if (selectedSeats.some(s => s._id === seat._id)) {
        await releaseSeat(seat._id);
        setSelectedSeats(prev => prev.filter(s => s._id !== seat._id));
        
        setSeats(prevSeats => 
          prevSeats.map(s => 
            s._id === seat._id ? { ...s, isAvailable: true } : s
          )
        );
      } else {
        await eventService.selectSeat(event._id, seat._id);
        
        setSelectedSeats(prev => [...prev, seat]);
        
        socketService.selectSeat(event._id, seat._id, user?._id);
        
        setSeats(prevSeats => 
          prevSeats.map(s => 
            s._id === seat._id ? { ...s, isAvailable: false } : s
          )
        );
      }
    } catch (error) {
      console.error('Seat selection error:', error);
      toast.error(error.response?.data?.message || 'Failed to select seat');
      
      refreshSeatData();
    }
  };
  
  const releaseSeat = async (seatId, isCleanup = false) => {
    try {
      await eventService.releaseSeat(event._id, seatId);
      
      if (!isCleanup) {
        socketService.deselectSeat(event._id, seatId, user?._id);
      }
      
      console.log(`Released seat ${seatId}`);
    } catch (error) {
      console.error('Error releasing seat:', error);
    }
  };
  
  useEffect(() => {
    onSeatSelectionChange(selectedSeats);
  }, [selectedSeats, onSeatSelectionChange]);
  
  const sectionMap = seats.reduce((acc, seat) => {
    if (!acc[seat.section]) {
      acc[seat.section] = [];
    }
    acc[seat.section].push(seat);
    return acc;
  }, {});
  
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  
  const getSeatStatus = (seat) => {
    const isSelectedByMe = selectedSeats.some(s => s._id === seat._id);
    
    const isTemporarilyHeld = temporarilyHeldSeats.has(seat._id);
    
    const isPermanentlyBooked = !seat.isAvailable;
    
    if (isSelectedByMe) return 'selected';
    if (isTemporarilyHeld) return 'held';
    if (isPermanentlyBooked) return 'booked';
    return 'available';
  };
  
  const getSeatStyling = (seat, status) => {
    let baseStyle;
    
    switch (status) {
      case 'selected':
        baseStyle = 'bg-primary-500 text-white shadow-lg';
        break;
      case 'held':
        baseStyle = 'bg-yellow-200 text-gray-700 cursor-not-allowed border border-yellow-400';
        break;
      case 'booked':
        baseStyle = 'bg-gray-200 text-gray-400 cursor-not-allowed';
        break;
      case 'available':
        if (seat.type === 'vip') {
          baseStyle = 'bg-yellow-50 border border-yellow-500 hover:bg-yellow-100 hover:border-yellow-600 text-yellow-800';
        } else if (seat.type === 'premium') {
          baseStyle = 'bg-purple-50 border border-purple-400 hover:bg-purple-100 hover:border-purple-500 text-purple-800';
        } else {
          baseStyle = 'bg-white border border-gray-300 hover:bg-gray-50 hover:border-primary-400 text-gray-800';
        }
        break;
      default:
        baseStyle = '';
    }
    
    return baseStyle;
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-lg sm:text-xl font-semibold">Select Your Seats</h3>
        <button 
          onClick={refreshSeatData}
          disabled={refreshing}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
        >
          <ArrowPathIcon className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
      
      {Object.entries(sectionMap).length === 0 ? (
        <div className="text-gray-500 p-4 border rounded-lg">
          No seats available for this event.
        </div>
      ) : (
        <>
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-b from-gray-300 to-gray-400 text-white text-center py-2 sm:py-3 rounded-t-lg mx-auto max-w-2xl">
              <span className="text-xs sm:text-sm font-medium">STAGE / SCREEN</span>
            </div>
          </div>

          {Object.entries(sectionMap).map(([section, sectionSeats]) => (
            <div key={section} className="mb-6 sm:mb-8">
              <h4 className="font-medium mb-2 sm:mb-3 text-gray-700 text-sm sm:text-base">
                {section} Section
              </h4>
              
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-1 sm:gap-2 min-w-max sm:min-w-0">
                  {sectionSeats.map(seat => {
                    const seatStatus = getSeatStatus(seat);
                    const isDisabled = seatStatus === 'booked' || seatStatus === 'held';
                    
                    return (
                      <div key={seat._id} className="text-center">
                        <button
                          type="button"
                          onClick={() => handleSeatSelect(seat)}
                          disabled={isDisabled}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-xs font-medium transition-all transform hover:scale-105
                            ${getSeatStyling(seat, seatStatus)}
                            ${isDisabled ? '' : 'cursor-pointer'}`}
                          aria-label={`${seat.type !== 'standard' ? seat.type + ' ' : ''}Seat ${seat.row}${seat.number} - ${seatStatus} - ₹${seat.price}`}
                          title={`${seat.type !== 'standard' ? seat.type + ' ' : ''}Seat ${seat.row}${seat.number} - ${seatStatus} - ₹${seat.price}`}
                        >
                          {seat.row}{seat.number}
                        </button>
                        {seat.type !== 'standard' && (
                          <div className={`text-xs mt-0.5 capitalize font-medium
                            ${seat.type === 'vip' ? 'text-yellow-700' : (seat.type === 'premium' ? 'text-purple-700' : 'text-gray-500')}`}>
                            {seat.type}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-6 flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white border border-gray-300 rounded mr-1.5 sm:mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-600">Standard</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-50 border border-purple-400 rounded mr-1.5 sm:mr-2"></div>
              <span className="text-xs sm:text-sm text-purple-700">Premium</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-50 border border-yellow-500 rounded mr-1.5 sm:mr-2"></div>
              <span className="text-xs sm:text-sm text-yellow-700">VIP</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary-500 rounded mr-1.5 sm:mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-600">Your Selection</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-200 border border-yellow-400 rounded mr-1.5 sm:mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-600">Being Selected</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded mr-1.5 sm:mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-600">Booked</span>
            </div>
          </div>
          
          {selectedSeats.length > 0 && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-sm sm:text-base text-gray-900">
                    Selected Seats ({selectedSeats.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedSeats.map(seat => (
                      <div 
                        key={seat._id} 
                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border
                          ${seat.type === 'vip' 
                            ? 'bg-yellow-50 border-yellow-300 text-yellow-800' 
                            : seat.type === 'premium'
                              ? 'bg-purple-50 border-purple-300 text-purple-800'
                              : 'bg-white border-primary-300 text-primary-800'
                          }`}
                      >
                        <span className="font-medium">{seat.section}</span>
                        <span className="mx-1">-</span>
                        <span>{seat.row}{seat.number}</span>
                        {seat.type !== 'standard' && (
                          <span className="ml-1 capitalize font-medium text-xs">({seat.type})</span>
                        )}
                        <span className="ml-1.5 flex items-center">
                          <CurrencyRupeeIcon className="h-3 w-3 inline" />{seat.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-primary-300">
                  <div className="text-xs sm:text-sm text-gray-600">Total Amount</div>
                  <div className="text-lg sm:text-xl font-bold text-primary-700 flex items-center">
                    <CurrencyRupeeIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                    {totalPrice.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 text-xs text-gray-500 text-center sm:hidden">
            <p>Swipe horizontally to see all seats</p>
          </div>
        </>
      )}
    </div>
  );
};

export default SeatSelector;
