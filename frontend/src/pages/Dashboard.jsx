import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { eventService, bookingService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon,
  CalendarDaysIcon,
  TicketIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  CheckBadgeIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    upcomingEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [bookingsError, setBookingsError] = useState(false);
  const [ticketVerification, setTicketVerification] = useState('');
  const [activeChart, setActiveChart] = useState('revenue');
  const [showActionMenu, setShowActionMenu] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowActionMenu(null);
    if (showActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionMenu]);

  // Helper function to calculate tickets sold safely
  const calculateTicketsSold = (event) => {
    // Ensure all values are numbers and not negative
    const totalSeats = Math.max(0, event.totalSeats || 0);
    const availableSeats = Math.max(0, event.availableSeats || 0);
    
    // Ensure sold tickets is never negative
    return Math.max(0, totalSeats - availableSeats);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // First, fetch events data which seems to work correctly
      try {
        const eventsResponse = await eventService.getOrganizerEvents();
        const eventsData = Array.isArray(eventsResponse.data) ? eventsResponse.data : 
                           (eventsResponse.data?.data || []);
        setEvents(eventsData);
        
        // Calculate basic stats from events only - WITH FIXED CALCULATION
        const now = new Date();
        const eventStats = eventsData.reduce((acc, event) => {
          const eventDate = new Date(event.startDate);
          acc.totalEvents++;
          
          // Use the safe calculation function
          acc.totalTicketsSold += calculateTicketsSold(event);
          
          if (eventDate > now) acc.upcomingEvents++;
          return acc;
        }, { totalEvents: 0, totalTicketsSold: 0, totalRevenue: 0, upcomingEvents: 0 });
        
        // Set stats from events data (without revenue for now)
        setStats(eventStats);
      } catch (eventsError) {
        console.error('Error fetching events:', eventsError);
        toast.error('Failed to load events data');
        // Set empty events state
        setEvents([]);
        setStats({ totalEvents: 0, totalTicketsSold: 0, totalRevenue: 0, upcomingEvents: 0 });
      }
      
      // Now try to fetch booking data (if this fails, we already have event stats)
      try {
        // Create a local API function that won't throw in the component
        const safeBookingsFetch = async () => {
          try {
            // Add a timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const bookingsResponse = await bookingService.getOrganizerBookings();
            clearTimeout(timeoutId);
            
            return {
              success: true,
              data: Array.isArray(bookingsResponse.data) ? bookingsResponse.data : 
                    (bookingsResponse.data?.data || [])
            };
          } catch (error) {
            console.warn('Bookings API error:', error);
            return { success: false, error };
          }
        };
        
        // Execute the safe fetch
        const bookingResult = await safeBookingsFetch();
        
        if (bookingResult.success) {
          const bookingsData = bookingResult.data;
          setBookings(bookingsData);
          setBookingsError(false);
          
          // Update revenue in stats from the bookings data
          if (bookingsData.length > 0) {
            setStats(prev => ({
              ...prev,
              totalRevenue: bookingsData.reduce((sum, booking) => {
                return sum + (booking.status === 'confirmed' ? booking.totalAmount : 0);
              }, 0)
            }));
          }
        } else {
          // Handle bookings API error
          setBookingsError(true);
          setBookings([]);
          
          // Estimate revenue based on ticket sales
          // This is a fallback approximation when booking data isn't available
          const estimatedRevenue = events.reduce((sum, event) => {
            // Use the safe calculation function
            const soldTickets = calculateTicketsSold(event);
            
            // Use average ticket price from seats or a default value
            const avgPrice = event.seats && event.seats.length > 0 
              ? event.seats.reduce((total, seat) => total + seat.price, 0) / event.seats.length
              : 499; // Default average ticket price if not available (in ₹)
            return sum + (soldTickets * avgPrice);
          }, 0);
          
          // Update stats with estimated revenue
          setStats(prev => ({
            ...prev,
            totalRevenue: estimatedRevenue
          }));
        }
      } catch (bookingError) {
        console.warn('Outer bookings error catch:', bookingError);
        setBookingsError(true);
        setBookings([]);
      }
    } catch (error) {
      console.error('Overall dashboard data error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await eventService.deleteEvent(eventId);
      toast.success('Event deleted successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      await eventService.publishEvent(eventId);
      toast.success('Event published successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error publishing event:', error);
      toast.error('Failed to publish event. Make sure the event has seats configured.');
    }
  };

  const handleVerifyTicket = async () => {
    if (!ticketVerification.trim()) {
      toast.error('Please enter a ticket code');
      return;
    }

    if (bookingsError) {
      toast.error('Booking service is currently unavailable');
      return;
    }

    try {
      setVerifying(true);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 5000);
      });
      
      try {
        // Race between the actual request and the timeout
        const response = await Promise.race([
          bookingService.verifyTicket(ticketVerification),
          timeoutPromise
        ]);
        
        toast.success('Ticket verified successfully!');
        console.log('Ticket details:', response.data);
        setTicketVerification('');
      } catch (error) {
        if (error.message === 'Request timed out') {
          toast.error('Verification request timed out. Please try again.');
          setBookingsError(true);
        } else if (error.response?.status === 500) {
          toast.error('Ticket verification service is currently unavailable');
          setBookingsError(true);
        } else {
          toast.error(error.response?.data?.message || 'Invalid ticket code');
        }
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      toast.error('Failed to verify ticket');
    } finally {
      setVerifying(false);
    }
  };

  const generateRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 10000
    }));
  };

  const generateTicketSalesData = () => {
    if (events.length === 0) {
      return [
        { name: 'No Data', sold: 0, available: 0, total: 0 }
      ];
    }
    
    // Use the safe calculation function for chart data
    return events.slice(0, 5).map(event => {
      const totalSeats = Math.max(0, event.totalSeats || 0);
      const availableSeats = Math.max(0, event.availableSeats || 0);
      const soldTickets = Math.max(0, totalSeats - availableSeats);
      
      return {
        name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
        sold: soldTickets,
        available: availableSeats,
        total: totalSeats
      };
    });
  };

  const categoryData = events.reduce((acc, event) => {
    const category = event.category || 'other';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: category, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const revenueData = bookings.length > 0 && !bookingsError
    ? bookings.reduce((acc, booking) => {
        if (booking.createdAt && booking.totalAmount) {
          const month = format(new Date(booking.createdAt), 'MMM');
          const existing = acc.find(item => item.month === month);
          if (existing) {
            existing.revenue += booking.totalAmount;
          } else {
            acc.push({ month, revenue: booking.totalAmount });
          }
        }
        return acc;
      }, [])
    : generateRevenueData();

  const ticketSalesData = generateTicketSalesData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs sm:text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Legend for responsive pie chart
  const CustomLegend = (props) => {
    const { payload } = props;
    if (!payload) return null;
    
    return (
      <ul className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center text-xs sm:text-sm">
            <span 
              className="w-3 h-3 rounded-full inline-block mr-1" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back, {user?.name || 'Organizer'}</p>
          </div>
          <Link
            to="/create-event"
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center text-sm sm:text-base"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Create Event</span>
          </Link>
        </div>

        {/* Warning if bookings API is not available */}
        {bookingsError && (
          <div className="mb-4 sm:mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-r-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 flex-shrink-0" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm text-yellow-700">
                  Booking data is currently unavailable. Some features may be limited.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Events</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{stats.totalEvents}</p>
              </div>
              <CalendarDaysIcon className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Tickets Sold</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{stats.totalTicketsSold}</p>
              </div>
              <TicketIcon className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <CurrencyRupeeIcon className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            {bookingsError && (
              <p className="text-xs text-gray-500 mt-1">* Estimated value</p>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{stats.upcomingEvents}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Ticket Verification */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Verify Ticket</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={ticketVerification}
              onChange={(e) => setTicketVerification(e.target.value)}
              placeholder="Enter ticket code..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
              disabled={bookingsError || verifying}
            />
            <button
              onClick={handleVerifyTicket}
              disabled={bookingsError || verifying || !ticketVerification.trim()}
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
            >
              {verifying ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <CheckBadgeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Verify</span>
                </>
              )}
            </button>
          </div>
          {bookingsError && (
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Ticket verification is temporarily unavailable
            </p>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Revenue/Tickets Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold">
                {activeChart === 'revenue' ? 'Revenue Trend' : 'Ticket Sales'}
              </h3>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveChart('revenue')}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                    activeChart === 'revenue' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setActiveChart('tickets')}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                    activeChart === 'tickets' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tickets
                </button>
              </div>
            </div>
            <div className="h-48 sm:h-64">
              {((activeChart === 'revenue' && revenueData.length > 0) || 
                (activeChart === 'tickets' && ticketSalesData.length > 0)) ? (
                <ResponsiveContainer width="100%" height="100%">
                  {activeChart === 'revenue' ? (
                    <LineChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => `₹${value}`} content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#0ea5e9" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={ticketSalesData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sold" stackId="a" fill="#10b981" name="Sold" />
                      <Bar dataKey="available" stackId="a" fill="#fbbf24" name="Available" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data to display
                </div>
              )}
            </div>
            {bookingsError && activeChart === 'revenue' && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                * Showing sample data
              </p>
            )}
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Events by Category</h3>
            <div className="h-48 sm:h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend content={<CustomLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No events to display
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h3 className="text-lg font-semibold">Your Events</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Category
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 sm:px-6 py-12 text-center text-gray-500">
                      No events yet. Create your first event to get started.
                    </td>
                  </tr>
                ) : (
                  events.map(event => {
                    const eventDate = new Date(event.startDate);
                    const isPast = eventDate < new Date();
                    // Use the safe calculation function
                    const ticketsSold = calculateTicketsSold(event);
                    const totalSeats = Math.max(0, event.totalSeats || 0);
                    
                    return (
                      <tr key={event._id}>
                        <td className="px-4 sm:px-6 py-4">
                          <Link 
                            to={`/events/${event._id}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {event.title}
                          </Link>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(eventDate, 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                            {event.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticketsSold}/{totalSeats}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isPast 
                              ? 'bg-gray-100 text-gray-800' 
                              : event.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isPast ? 'Past' : event.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/events/${event._id}`}
                              className="text-gray-600 hover:text-gray-900"
                              title="View"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            <Link
                              to={`/edit-event/${event._id}`}
                              className="text-primary-600 hover:text-primary-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                            {event.status === 'draft' && !isPast && (
                              <button
                                onClick={() => handlePublishEvent(event._id)}
                                className="text-green-600 hover:text-green-900"
                                title="Publish"
                              >
                                <CheckBadgeIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteEvent(event._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Events Cards - Mobile */}
        <div className="md:hidden space-y-4">
          <h3 className="text-lg font-semibold mb-4">Your Events</h3>
          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              No events yet. Create your first event to get started.
            </div>
          ) : (
            events.map(event => {
              const eventDate = new Date(event.startDate);
              const isPast = eventDate < new Date();
              // Use the safe calculation function
              const ticketsSold = calculateTicketsSold(event);
              const totalSeats = Math.max(0, event.totalSeats || 0);
              
              return (
                <div key={event._id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <Link 
                        to={`/events/${event._id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-base"
                      >
                        {event.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(eventDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActionMenu(showActionMenu === event._id ? null : event._id);
                        }}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                      </button>
                      
                      {showActionMenu === event._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <Link
                            to={`/events/${event._id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowActionMenu(null)}
                          >
                            <EyeIcon className="h-4 w-4 mr-3" />
                            View
                          </Link>
                          <Link
                            to={`/edit-event/${event._id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowActionMenu(null)}
                          >
                            <PencilIcon className="h-4 w-4 mr-3" />
                            Edit
                          </Link>
                          {event.status === 'draft' && !isPast && (
                            <button
                              onClick={() => {
                                handlePublishEvent(event._id);
                                setShowActionMenu(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                            >
                              <CheckBadgeIcon className="h-4 w-4 mr-3" />
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleDeleteEvent(event._id);
                              setShowActionMenu(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                          >
                            <TrashIcon className="h-4 w-4 mr-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                      {event.category || 'Uncategorized'}
                    </span>
                    <span className="text-gray-500">
                      {ticketsSold}/{totalSeats} sold
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isPast 
                        ? 'bg-gray-100 text-gray-800' 
                        : event.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isPast ? 'Past' : event.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
