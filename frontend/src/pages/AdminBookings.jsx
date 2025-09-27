import React, { useState, useEffect, useMemo } from 'react';
import { bookingService } from '../services/auth';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  ChartBarIcon
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
  Legend // Import the Legend component
} from 'recharts';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

// Helper function to render percentages inside the pie slices.
const renderInnerLabel = ({ percent }) => {
  // Don't render a label for slices that are too small
  if (percent < 0.05) return null; 
  return (
    <text x="50%" y="50%" fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const AdminBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState({ data: [], total: 0, pages: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [localAnalytics, setLocalAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Performance Optimization: Memoize the calculation of selected booking stats.
  const selectedBookingsStats = useMemo(() => {
    if (selectedBookings.length === 0) return null;
    
    const selectedData = selectedBookings.map(id => 
      bookings.data.find(b => b._id === id)
    ).filter(Boolean);
    
    const stats = {
      pending: selectedData.filter(b => b.status === 'pending').length,
      confirmed: selectedData.filter(b => b.status === 'confirmed').length,
      cancelled: selectedData.filter(b => b.status === 'cancelled').length,
      eligibleForCancel: selectedData.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    };
    
    return stats;
  }, [selectedBookings, bookings.data]);


  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching admin bookings with filters:', filters);
      
      const response = await bookingService.getAllBookings(filters);
      console.log('📊 Admin bookings response:', response);
      
      let bookingsData = { data: [], total: 0, pages: 0 };
      if (response?.data) {
        bookingsData = {
          data: response.data.data || [],
          total: response.data.total || 0,
          pages: response.data.pages || 0,
        };
      }
      
      setBookings(bookingsData);
      console.log('📋 Processed admin bookings:', bookingsData);
      calculateLocalAnalytics(bookingsData.data); 
    } catch (error) {
      console.error('❌ Error fetching admin bookings:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch bookings');
      
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
      } else if (error.response?.status === 404) {
        toast.error('Admin booking endpoints not found. Please contact support.');
      } else {
        toast.error('Failed to fetch bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      console.log('📈 Fetching booking analytics from backend...');
      
      const response = await bookingService.getBookingAnalytics();
      console.log('📊 Backend Analytics response:', response);
      
      if (response?.data?.revenueStats) {
        setAnalytics(response.data);
      } else {
        console.log('Backend analytics not fully available or empty, relying on local calculation.');
        setAnalytics(null);
      }
    } catch (error) {
      console.error('❌ Error fetching backend analytics:', error);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const calculateLocalAnalytics = (allBookings) => {
    if (!allBookings || allBookings.length === 0) {
      setLocalAnalytics(null);
      return;
    }

    const revenueStats = [
      {
        _id: 'confirmed',
        count: allBookings.filter(b => b.status === 'confirmed').length,
        totalRevenue: allBookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      },
      {
        _id: 'pending',
        count: allBookings.filter(b => b.status === 'pending').length,
        totalRevenue: allBookings
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      },
      {
        _id: 'cancelled',
        count: allBookings.filter(b => b.status === 'cancelled').length,
        totalRevenue: allBookings
          .filter(b => b.status === 'cancelled')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      }
    ];

    const now = new Date();
    const thisMonthBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      return bookingDate.getMonth() === now.getMonth() && 
             bookingDate.getFullYear() === now.getFullYear();
    });
    
    const lastMonthBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return bookingDate.getMonth() === lastMonthDate.getMonth() && 
             bookingDate.getFullYear() === lastMonthDate.getFullYear();
    });
    
    const thisMonthRevenue = thisMonthBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    const lastMonthRevenue = lastMonthBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    const growthRate = lastMonthRevenue > 0 
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : (thisMonthRevenue > 0 ? 100 : 0).toFixed(1); 
    
    const totalConfirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
    const avgBookingValue = totalConfirmedBookings > 0 
      ? (allBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalAmount || 0), 0) / totalConfirmedBookings).toFixed(0)
      : 0;
    
    const conversionRate = allBookings.length > 0
      ? ((totalConfirmedBookings / allBookings.length) * 100).toFixed(1)
      : 0;

    const monthlyData = {};
    const last6MonthsKeys = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = format(date, 'MMM');
      last6MonthsKeys.push(monthKey);
      monthlyData[monthKey] = { revenue: 0, bookings: 0 };
    }
    
    allBookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      const monthKey = format(bookingDate, 'MMM');
      
      if (monthlyData[monthKey] && booking.status === 'confirmed') {
        monthlyData[monthKey].revenue += booking.totalAmount || 0;
        monthlyData[monthKey].bookings++;
      }
    });
    
    const chartMonthlyTrend = last6MonthsKeys.map(month => ({
      month,
      revenue: monthlyData[month].revenue,
      bookings: monthlyData[month].bookings
    }));

    const chartStatusDistribution = [
      { name: 'Confirmed', value: revenueStats.find(s => s._id === 'confirmed')?.count || 0, fill: '#10b981' },
      { name: 'Pending', value: revenueStats.find(s => s._id === 'pending')?.count || 0, fill: '#f59e0b' },
      { name: 'Cancelled', value: revenueStats.find(s => s._id === 'cancelled')?.count || 0, fill: '#ef4444' }
    ];

    const eventRevenueMap = {};
    allBookings.forEach(booking => {
      if (booking.status === 'confirmed' && booking.event) {
        const eventId = booking.event._id || 'unknown';
        const eventTitle = booking.event.title || 'Unknown Event';
        
        if (!eventRevenueMap[eventId]) {
          eventRevenueMap[eventId] = {
            title: eventTitle,
            bookingsCount: 0,
            totalRevenue: 0
          };
        }
        eventRevenueMap[eventId].bookingsCount++;
        eventRevenueMap[eventId].totalRevenue += booking.totalAmount || 0;
      }
    });

    const topEventsByRevenue = Object.values(eventRevenueMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    setLocalAnalytics({
      revenueStats,
      metrics: {
        thisMonthRevenue,
        lastMonthRevenue,
        growthRate,
        avgBookingValue,
        conversionRate,
        totalConfirmedBookings,
        totalBookings: allBookings.length
      },
      chartMonthlyTrend,
      chartStatusDistribution,
      topEventsByRevenue
    });
  };

  const handleBulkAction = async (action) => {
    if (selectedBookings.length === 0) {
      toast.error('Please select bookings first');
      return;
    }
    let eligibleBookings = [];
    let ineligibleCount = 0;
    
    selectedBookings.forEach(id => {
      const booking = bookings.data.find(b => b._id === id);
      if (!booking) return;

      if (action === 'confirm') {
        if (booking.status === 'pending') {
          eligibleBookings.push(id);
        } else {
          ineligibleCount++;
        }
      } else if (action === 'cancel') {
        if (booking.status === 'pending' || booking.status === 'confirmed') {
          eligibleBookings.push(id);
        } else {
          ineligibleCount++;
        }
      }
    });

    if (eligibleBookings.length === 0) {
      if (action === 'confirm') {
        toast.error(`Cannot confirm selected bookings. Only pending bookings can be confirmed. ${selectedBookings.length} booking(s) selected, but none are pending.`);
      } else if (action === 'cancel') {
        toast.error(`Cannot cancel selected bookings. Only pending or confirmed bookings can be cancelled. ${selectedBookings.length} booking(s) selected, but none are eligible.`);
      }
      return;
    }

    let confirmMessage = '';
    if (ineligibleCount > 0) {
      confirmMessage = `${eligibleBookings.length} eligible booking(s) will be ${action}ed. ${ineligibleCount} booking(s) will be skipped as they don't meet the criteria. Continue?`;
    } else {
      confirmMessage = `Are you sure you want to ${action} ${eligibleBookings.length} booking(s)?`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await bookingService.bulkBookingAction({
        action,
        bookingIds: eligibleBookings
      });
      
      const message = response.data?.message || `${action} action completed for ${eligibleBookings.length} booking(s)`;
      if (ineligibleCount > 0) {
        toast.success(`${message}. ${ineligibleCount} booking(s) were skipped.`);
      } else {
        toast.success(message);
      }
      
      fetchBookings();
      setSelectedBookings([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(error.response?.data?.message || 'Failed to perform bulk action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualConfirm = async (bookingId) => {
    if (!window.confirm('Are you sure you want to manually confirm this booking?')) {
      return;
    }

    try {
      await bookingService.manualConfirmBooking(bookingId);
      toast.success('Booking confirmed successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm booking');
    }
  };

  // Performance Optimization: Memoize filtering to avoid re-calculating on every render.
  const filteredBookings = useMemo(() => bookings.data.filter(booking => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      booking._id.toLowerCase().includes(searchLower) ||
      booking.event?.title?.toLowerCase().includes(searchLower) ||
      booking.user?.name?.toLowerCase().includes(searchLower) ||
      booking.user?.email?.toLowerCase().includes(searchLower)
    );
  }), [bookings.data, searchTerm]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedBookings(filteredBookings.map(b => b._id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectBooking = (bookingId, checked) => {
    if (checked) {
      setSelectedBookings([...selectedBookings, bookingId]);
    } else {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBookings();
      fetchAnalytics();
    }
  }, [filters, user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      calculateLocalAnalytics(bookings.data); 
    } else {
      setLocalAnalytics(null);
    }
  }, [bookings.data, user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const displayAnalytics = analytics || localAnalytics;

  if (loading && !bookings.data.length) {
    return <Loader text="Loading admin bookings..." />;
  }

  if (error && !bookings.data.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Unable to Load Bookings</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Back to Dashboard
            </button>
            <button 
              onClick={fetchBookings}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

        <div className="mb-6 sm:mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm sm:text-base"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage all bookings across the platform</p>
        </div>

        {analyticsLoading && !displayAnalytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 sm:p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : displayAnalytics && displayAnalytics.revenueStats && displayAnalytics.revenueStats.length > 0 ? (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4">Booking Analytics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {displayAnalytics.revenueStats.map(stat => (
                <div key={stat._id} className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 capitalize">{stat._id} Bookings</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 truncate">₹{stat.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{stat.count} bookings</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-gray-100 flex-shrink-0 ml-2">
                      {stat._id === 'confirmed' && <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />}
                      {stat._id === 'pending' && <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />}
                      {stat._id === 'cancelled' && <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600" />}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-primary-100">Total System Revenue</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 truncate">
                      ₹{displayAnalytics.revenueStats.reduce((sum, stat) => 
                        sum + (stat._id === 'confirmed' ? stat.totalRevenue : 0), 0
                      ).toLocaleString() || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-primary-100">Confirmed bookings</p>
                  </div>
                  <CurrencyRupeeIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-primary-200 flex-shrink-0 ml-2" />
                </div>
              </div>
            </div>

            {displayAnalytics.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Growth Rate</h3>
                  <div className="flex items-baseline">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{displayAnalytics.metrics.growthRate}%</p>
                    <p className="ml-2 text-xs sm:text-sm text-gray-500">vs last month</p>
                  </div>
                  <div className="mt-2 flex items-center text-xs sm:text-sm">
                    {parseFloat(displayAnalytics.metrics.growthRate) > 0 ? (
                      <span className="text-green-600 flex items-center">
                        <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Increasing
                      </span>
                    ) : parseFloat(displayAnalytics.metrics.growthRate) < 0 ? (
                      <span className="text-red-600 flex items-center">
                        <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 rotate-180" /> Decreasing
                      </span>
                    ) : (
                      <span className="text-gray-600">→ Stable</span>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Avg. Booking Value</h3>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{displayAnalytics.metrics.avgBookingValue}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Per confirmed transaction</p>
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Conversion Rate</h3>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{displayAnalytics.metrics.conversionRate}%</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Confirmed of all bookings</p>
                </div>
              </div>
            )}

            {(displayAnalytics.chartMonthlyTrend?.length > 0 || displayAnalytics.chartStatusDistribution?.length > 0) ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                  <h3 className="text-sm sm:text-lg font-semibold mb-4 flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" /> 
                    <span className="hidden sm:inline">Revenue Trend (Last 6 Months)</span>
                    <span className="sm:hidden">Revenue Trend</span>
                  </h3>
                  {displayAnalytics.chartMonthlyTrend?.length > 0 ? (
                    <div className="h-60 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={displayAnalytics.chartMonthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            interval={0}
                          />
                          <YAxis 
                            tickFormatter={(value) => `₹${value}`} 
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => `₹${value.toLocaleString()}`}
                            labelStyle={{ fontSize: 12 }}
                            contentStyle={{ fontSize: 12 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#0ea5e9" 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            animationDuration={1000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-60 flex items-center justify-center text-gray-500 text-sm">No monthly revenue data.</div>
                  )}
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                  <h3 className="text-sm sm:text-lg font-semibold mb-4 flex items-center gap-2">
                    <ChartPieIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" /> 
                    <span className="hidden sm:inline">Booking Status Distribution</span>
                    <span className="sm:hidden">Status Distribution</span>
                  </h3>
                  {displayAnalytics.chartStatusDistribution && displayAnalytics.chartStatusDistribution.some(d => d.value > 0) ? (
                    <div className="h-60 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={displayAnalytics.chartStatusDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderInnerLabel}
                            outerRadius="80%"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                          >
                            {displayAnalytics.chartStatusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconSize={10}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-60 flex items-center justify-center text-gray-500 text-sm">No booking status data.</div>
                  )}
                </div>
              </div>
            ) : null}

            {displayAnalytics.topEventsByRevenue && displayAnalytics.topEventsByRevenue.length > 0 && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
                <h3 className="text-sm sm:text-lg font-semibold mb-4">Top 5 Events by Revenue</h3>
                <div className="space-y-3">
                  {displayAnalytics.topEventsByRevenue.map((event, idx) => (
                    <div key={event.title + idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors">
                      <div className="flex items-center min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 w-6 flex-shrink-0">{idx + 1}.</span>
                        <span className="ml-3 text-xs sm:text-sm text-gray-700 truncate">{event.title}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 ml-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">{event.bookingsCount} bookings</span>
                        <span className="text-xs sm:text-sm font-semibold">₹{event.totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8">
            <div className="text-center text-gray-500">
              <CalendarDaysIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base">No booking analytics available yet.</p>
              {!analyticsLoading && (
                <button 
                  onClick={fetchAnalytics}
                  className="mt-2 text-xs sm:text-sm text-primary-600 hover:text-primary-800 underline"
                >
                  Try loading analytics
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by booking ID, event, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={filters.status} 
                onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button 
                onClick={() => fetchBookings()}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span>Selected: {selectedBookings.length} of {filteredBookings.length}</span>
                {selectedBookingsStats && (
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {selectedBookingsStats.pending > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {selectedBookingsStats.pending} Pending
                        </span>
                      )}
                      {selectedBookingsStats.confirmed > 0 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {selectedBookingsStats.confirmed} Confirmed
                        </span>
                      )}
                      {selectedBookingsStats.cancelled > 0 && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                          {selectedBookingsStats.cancelled} Cancelled
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => handleBulkAction('confirm')}
                disabled={selectedBookings.length === 0 || actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                <CheckCircleIcon className="h-4 w-4" />
                {actionLoading ? 'Processing...' : 'Bulk Confirm'}
                {selectedBookingsStats && selectedBookingsStats.pending > 0 && !actionLoading && (
                    <span className="text-xs bg-green-700 px-2 py-1 rounded ml-1">
                      {selectedBookingsStats.pending}
                    </span>
                  )}
              </button>
              <button 
                onClick={() => handleBulkAction('cancel')}
                disabled={selectedBookings.length === 0 || actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                <XCircleIcon className="h-4 w-4" />
                {actionLoading ? 'Processing...' : 'Bulk Cancel'}
                {selectedBookingsStats && selectedBookingsStats.eligibleForCancel > 0 && !actionLoading && (
                    <span className="text-xs bg-red-700 px-2 py-1 rounded ml-1">
                      {selectedBookingsStats.eligibleForCancel}
                    </span>
                  )}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input 
                      type="checkbox"
                      checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan="8" className="px-4 py-8">
                        <div className="animate-pulse flex space-x-4">
                          <div className="h-4 bg-gray-200 rounded flex-1"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      {searchTerm || filters.status ? 
                        'No bookings found matching your criteria.' : 
                        'No bookings found. Bookings will appear here once users start making reservations.'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(booking => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox"
                          checked={selectedBookings.includes(booking._id)}
                          onChange={(e) => handleSelectBooking(booking._id, e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-900">
                          {booking._id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">
                            {booking.event?.title || 'Unknown Event'}
                          </p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            by {booking.event?.organizer?.name || 'Unknown'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">{booking.user?.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{booking.user?.email || 'No email'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          ₹{booking.totalAmount?.toLocaleString() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {booking.createdAt ? format(new Date(booking.createdAt), 'MMM d, yyyy') : 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link 
                            to={`/admin/bookings/${booking._id}`}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          {booking.status === 'pending' && (
                            <button 
                              onClick={() => handleManualConfirm(booking._id)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Manual Confirm"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Desktop Pagination */}
          {bookings.pages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, bookings.total)} of {bookings.total} results
              </div>
              <div className="flex gap-2 justify-center sm:justify-end">
                <button 
                  onClick={() => setFilters({...filters, page: filters.page - 1})}
                  disabled={filters.page <= 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-500">
                  Page {filters.page} of {bookings.pages}
                </span>
                <button 
                  onClick={() => setFilters({...filters, page: filters.page + 1})}
                  disabled={filters.page >= bookings.pages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tablet View */}
        <div className="hidden md:block lg:hidden">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox"
                    checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
                <span className="text-sm text-gray-500">
                  {selectedBookings.length} selected
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))
              ) : filteredBookings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm || filters.status ? 
                    'No bookings found matching your criteria.' : 
                    'No bookings found yet.'
                  }
                </div>
              ) : (
                filteredBookings.map(booking => (
                  <div key={booking._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox"
                        checked={selectedBookings.includes(booking._id)}
                        onChange={(e) => handleSelectBooking(booking._id, e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-gray-900">
                            #{booking._id.slice(-8)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-900 truncate">
                              {booking.event?.title || 'Unknown Event'}
                            </p>
                            <p className="text-gray-500 truncate">
                              {booking.user?.name || 'Unknown User'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ₹{booking.totalAmount?.toLocaleString() || 'N/A'}
                            </p>
                            <p className="text-gray-500">
                              {booking.createdAt ? format(new Date(booking.createdAt), 'MMM d') : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Link 
                            to={`/admin/bookings/${booking._id}`}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                            View
                          </Link>
                          {booking.status === 'pending' && (
                            <button 
                              onClick={() => handleManualConfirm(booking._id)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                {searchTerm || filters.status ? 
                  'No bookings found matching your criteria.' : 
                  'No bookings found yet.'
                }
              </p>
            </div>
          ) : (
            filteredBookings.map(booking => (
              <div key={booking._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium text-gray-900">#{booking._id.slice(-8)}</p>
                    <p className="text-sm text-gray-600 truncate">{booking.event?.title || 'Unknown Event'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <input 
                      type="checkbox"
                      checked={selectedBookings.includes(booking._id)}
                      onChange={(e) => handleSelectBooking(booking._id, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">User:</span>
                    <span className="font-medium text-right truncate ml-2">{booking.user?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-semibold">₹{booking.totalAmount?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span>{booking.createdAt ? format(new Date(booking.createdAt), 'MMM d, yyyy') : 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Link 
                    to={`/admin/bookings/${booking._id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View
                  </Link>
                  {booking.status === 'pending' && (
                    <button 
                      onClick={() => handleManualConfirm(booking._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Pagination */}
        {bookings.pages > 1 && (
          <div className="md:hidden mt-6 bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col gap-3">
              <div className="text-sm text-gray-700 text-center">
                Page {filters.page} of {bookings.pages}
              </div>
              <div className="text-xs text-gray-500 text-center">
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, bookings.total)} of {bookings.total}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilters({...filters, page: filters.page - 1})}
                  disabled={filters.page <= 1}
                  className="flex-1 px-4 py-2 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setFilters({...filters, page: filters.page + 1})}
                  disabled={filters.page >= bookings.pages}
                  className="flex-1 px-4 py-2 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
