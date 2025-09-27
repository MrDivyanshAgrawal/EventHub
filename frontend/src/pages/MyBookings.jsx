import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { bookingService } from '../services/auth';
import Loader from '../components/Loader';
import { 
  TicketIcon, 
  CalendarDaysIcon,
  MapPinIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CurrencyRupeeIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [qrCodes, setQrCodes] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    fetchBookings();
  }, []);
  useEffect(() => {
    const hasPendingBookings = bookings.some(b => b.status === 'pending');
    
    if (hasPendingBookings) {
      const intervalId = setInterval(checkPendingBookings, 30000);
      return () => clearInterval(intervalId);
    }
  }, [bookings]);

  const forceRefreshBookings = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await bookingService.getUserBookings({ _t: timestamp });
      
      let bookingsData = [];
      if (response.data && Array.isArray(response.data)) {
        bookingsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        bookingsData = response.data.data;
      } else {
        throw new Error('Unexpected data format');
      }
      
      const validBookings = bookingsData.filter(booking => {
        if (!booking.event) {
          console.warn(`Booking ${booking._id} has no event data - filtering out`);
          return false;
        }
        return true;
      });
      
      validBookings.forEach(booking => {
        console.log(`Refreshed booking ${booking._id}: status = ${booking.status}`);
      });
      
      setBookings(validBookings);
      
      const codes = {};
      for (const booking of validBookings) {
        if (booking.ticketCode && booking.status === 'confirmed') {
          try {
            codes[booking._id] = await QRCode.toDataURL(booking.ticketCode);
          } catch (qrError) {
            console.error('Error generating QR code:', qrError);
          }
        }
      }
      setQrCodes(codes);
      
    } catch (error) {
      console.error('Error in force refresh:', error);
      toast.error('Failed to refresh bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings();
      console.log('Bookings response:', response);
      
      let bookingsData = [];
      if (response.data && Array.isArray(response.data)) {
        bookingsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        bookingsData = response.data.data;
      } else {
        console.error('Unexpected booking response format:', response);
        setError('Unable to load bookings: Unexpected data format');
        setBookings([]);
        return;
      }
      
      const validBookings = bookingsData.filter(booking => {
        if (!booking.event) {
          console.warn(`Booking ${booking._id} has no event data - filtering out`);
          return false;
        }
        return true;
      });
      
      validBookings.forEach(booking => {
        console.log(`Booking ${booking._id}: status = ${booking.status}, payment = ${booking.paymentStatus}`);
      });
      
      setBookings(validBookings);
      
      const codes = {};
      for (const booking of validBookings) {
        if (booking.ticketCode && booking.status === 'confirmed') {
          try {
            codes[booking._id] = await QRCode.toDataURL(booking.ticketCode);
          } catch (qrError) {
            console.error('Error generating QR code:', qrError);
          }
        }
      }
      setQrCodes(codes);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load your bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const checkPendingBookings = async () => {
    try {
      const pendingBookings = bookings.filter(b => b.status === 'pending');
      
      if (pendingBookings.length === 0) return;
      
      const refreshedResponse = await bookingService.getUserBookings();
      const refreshedData = Array.isArray(refreshedResponse.data) ? refreshedResponse.data : 
                           (refreshedResponse.data?.data || []);
      
      const validBookings = refreshedData.filter(booking => booking.event != null);
      
      setBookings(validBookings);
      
      const updatedQrCodes = { ...qrCodes };
      for (const booking of validBookings) {
        if (booking.ticketCode && booking.status === 'confirmed' && !qrCodes[booking._id]) {
          try {
            updatedQrCodes[booking._id] = await QRCode.toDataURL(booking.ticketCode);
          } catch (qrError) {
            console.error('Error generating QR code:', qrError);
          }
        }
      }
      setQrCodes(updatedQrCodes);
      
    } catch (error) {
      console.error('Error checking pending bookings:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await forceRefreshBookings(); 
      toast.success('Bookings updated');
    } catch (error) {
      toast.error('Failed to refresh bookings');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      setLoading(true);
      const response = await bookingService.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'cancelled' } 
            : booking
        )
      );
      
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: 'cancelled' }));
      }
      setTimeout(() => {
        forceRefreshBookings();
      }, 1000);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
      
      forceRefreshBookings();
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatus = (booking) => {
    console.log('Getting status for booking:', booking._id, 'Status:', booking.status);
    
    if (booking.status === 'cancelled') {
      return { text: 'Cancelled', class: 'bg-red-100 text-red-800' };
    }
    
    if (booking.status === 'pending') {
      return { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' };
    }

    const eventDate = booking.event?.startDate 
      ? new Date(booking.event.startDate) 
      : (booking.event?.date ? new Date(booking.event.date) : null);
    
    if (!eventDate) {
      return { text: 'Confirmed', class: 'bg-green-100 text-green-800' };
    }
    
    if (eventDate < new Date()) {
      return { text: 'Completed', class: 'bg-gray-100 text-gray-800' };
    }
    
    return { text: 'Confirmed', class: 'bg-green-100 text-green-800' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', dateString, error);
      return 'Invalid Time';
    }
  };

  const handleDownloadTicket = async (booking) => {
    if (!booking.ticketCode || booking.status !== 'confirmed') {
      toast.error('Ticket not available for download');
      return;
    }

    if (!booking.event) {
      toast.error('Event information not available');
      return;
    }

    try {
      const ticketDiv = document.createElement('div');
      ticketDiv.style.position = 'absolute';
      ticketDiv.style.left = '-9999px';
      ticketDiv.style.backgroundColor = 'white';
      ticketDiv.style.padding = '40px';
      ticketDiv.style.width = '600px';
      
      ticketDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0ea5e9; margin-bottom: 10px;">EventHub India</h1>
            <h2 style="color: #333; font-size: 24px;">${booking.event?.title || 'Event Ticket'}</h2>
          </div>
          
          <div style="display: flex; justify-content: center; margin: 30px 0;">
            <img src="${qrCodes[booking._id]}" alt="QR Code" style="width: 200px; height: 200px;" />
          </div>
          
          <div style="border: 2px dashed #ddd; padding: 20px; margin: 20px 0;">
            <p style="text-align: center; font-size: 14px; color: #666; margin-bottom: 10px;">Ticket Code</p>
            <p style="text-align: center; font-size: 20px; font-weight: bold; color: #333;">${booking.ticketCode}</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
            <h3 style="margin-bottom: 15px; color: #333;">Event Details</h3>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(booking.event?.startDate)}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(booking.event?.startDate)}</p>
            <p style="margin: 8px 0;"><strong>Venue:</strong> ${booking.event?.location?.name || ''}</p>
            <p style="margin: 8px 0;"><strong>City:</strong> ${booking.event?.location?.city || ''}</p>
            ${booking.seats && booking.seats.length > 0 ? `
              <p style="margin: 8px 0;"><strong>Seats:</strong> ${booking.seats.map(s => `${s.row}${s.number}`).join(', ')}</p>
            ` : ''}
            <p style="margin: 8px 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
            <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${booking._id.slice(-8).toUpperCase()}</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>Please show this ticket at the venue entrance</p>
            <p style="margin-top: 5px;">For support, email: support@eventhub.in</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(ticketDiv);
      
      const canvas = await html2canvas(ticketDiv, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(ticketDiv);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
      
      pdf.save(`ticket-${booking.event?.title?.replace(/\s+/g, '-') || 'event'}-${booking._id.slice(-8)}.pdf`);
      
      toast.success('Ticket downloaded successfully');
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bookings</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={fetchBookings} 
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
          <p className="text-sm sm:text-base text-gray-600">View and manage your event bookings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 text-sm transition-colors"
            aria-label="Refresh bookings"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-500 mb-4">Start exploring amazing events!</p>
          <Link 
            to="/events" 
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors inline-block"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map(booking => {
            console.log('Rendering booking:', booking);
            
            const event = booking.event || {};
            const status = getBookingStatus(booking);
            const eventDate = event.startDate ? new Date(event.startDate) : 
                            (event.date ? new Date(event.date) : new Date());
            const canCancel = booking.status !== 'cancelled' && eventDate > new Date();
            
            if (!booking.event) {
              return (
                <div key={booking._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <ExclamationCircleIcon className="h-12 w-12 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">Event No Longer Available</h3>
                        <p className="text-gray-600 mt-1">This booking is for an event that has been removed.</p>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Booking ID: {booking._id.slice(-8).toUpperCase()}</p>
                          <p>Status: {booking.status}</p>
                          {booking.totalAmount && (
                            <p>Amount: ₹{booking.totalAmount}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                    <img
                      src={event.imageUrl || 'https://picsum.photos/1200/400'}
                      alt={event.title || 'Event'}
                      className="w-full md:w-48 h-32 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                        <div>
                          <Link 
                            to={`/events/${event._id}`}
                            className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {event.title || 'Untitled Event'}
                          </Link>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-4 w-4" />
                              <span>{formatDate(event.startDate || event.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              <span>
                                {event.location?.city || event.location || 'Location not specified'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${status.class}`}>
                          {status.text}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 sm:gap-6 mb-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Seats</p>
                          <p className="font-medium text-sm sm:text-base">
                            {booking.seats && booking.seats.length > 0
                              ? booking.seats.map(seat => `${seat.row}${seat.number}`).join(', ')
                              : 'No seat information'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Total Paid</p>
                          <p className="font-medium text-sm sm:text-base flex items-center">
                            <CurrencyRupeeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {booking.totalAmount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Booking ID</p>
                          <p className="font-mono text-xs sm:text-sm">{booking._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
                          aria-label="View ticket details"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View Ticket
                        </button>
                        {booking.status === 'confirmed' && booking.ticketCode && (
                          <button 
                            onClick={() => handleDownloadTicket(booking)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                            aria-label="Download ticket"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Download
                          </button>
                        )}
                        {canCancel && (
                          <button 
                            onClick={() => handleCancelBooking(booking._id)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center gap-2"
                            aria-label="Cancel booking"
                          >
                            <XMarkIcon className="h-4 w-4" />
                            Cancel
                          </button>
                        )}
                      </div>

                      {booking.status === 'pending' && (
                        <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs sm:text-sm">
                          <div className="flex items-start gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-yellow-800 font-medium">Payment Processing</p>
                              <p className="text-yellow-700 mt-1">
                                Your ticket is waiting for payment confirmation. Once confirmed, a QR code will be generated.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBooking && selectedBooking.event && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg sm:text-xl font-semibold">Your Ticket</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close ticket details"
                >
                  <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
              {selectedBooking.status === 'confirmed' ? (
                qrCodes[selectedBooking._id] ? (
                  <div className="text-center mb-6">
                    <img 
                      src={qrCodes[selectedBooking._id]} 
                      alt="Ticket QR Code" 
                      className="mx-auto max-w-full h-auto"
                    />
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      Ticket Code: {selectedBooking.ticketCode}
                    </p>
                  </div>
                ) : (
                  <div className="text-center mb-6 p-4 bg-gray-100 rounded">
                    <p className="text-gray-500 text-sm">QR code will be available soon</p>
                  </div>
                )
              ) : selectedBooking.status === 'cancelled' ? (
                <div className="text-center mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                  <div className="text-red-600 mb-2">❌</div>
                  <h4 className="font-medium mb-1 text-sm sm:text-base">Booking Cancelled</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    This booking has been cancelled.
                  </p>
                </div>
              ) : (
                <div className="text-center mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <div className="text-yellow-600 mb-2">⚠️</div>
                  <h4 className="font-medium mb-1 text-sm sm:text-base">Ticket Pending</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Your ticket is waiting for payment confirmation.
                    {selectedBooking.status === 'pending' && " Once confirmed, a QR code will be generated."}
                  </p>
                </div>
              )}

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="border-t pt-4">
                  <p className="font-semibold text-base sm:text-lg mb-2">
                    {selectedBooking.event?.title || 'Event Details'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span>
                        {formatDate(selectedBooking.event?.startDate || selectedBooking.event?.date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time</span>
                      <span>
                        {formatTime(selectedBooking.event?.startDate || selectedBooking.event?.date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span>
                        {selectedBooking.event?.location?.city || 
                         selectedBooking.event?.location || 
                         'Location not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedBooking.seats && selectedBooking.seats.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="font-semibold mb-2">Seat Details</p>
                    {selectedBooking.seats.map((seat, index) => (
                      <div key={index} className="flex justify-between mb-2">
                        <span className="text-gray-500">Row {seat.row}, Seat {seat.number}</span>
                        <span className="flex items-center">
                          <CurrencyRupeeIcon className="h-3 w-3 mr-1" />
                          {seat.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span className="flex items-center">
                      <CurrencyRupeeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {selectedBooking.totalAmount}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Booking Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBookingStatus(selectedBooking).class}`}>
                      {getBookingStatus(selectedBooking).text}
                    </span>
                  </div>
                </div>
              </div>

              {selectedBooking.status === 'pending' && (
                <div className="mt-6 text-center">
                  <p className="text-xs sm:text-sm text-yellow-600 mb-4">
                    Your payment is still being processed
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-50 text-primary-600 rounded-md text-xs sm:text-sm font-medium hover:bg-primary-100 flex items-center gap-2 mx-auto"
                    aria-label="Check for updates"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>{refreshing ? 'Checking...' : 'Check for updates'}</span>
                  </button>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <p className="text-xs text-gray-500 text-center mt-6">
                  Show this QR code at the venue entrance
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
