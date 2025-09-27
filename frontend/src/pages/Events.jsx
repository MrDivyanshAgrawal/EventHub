import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventService } from '../services/auth';
import EventCard from '../components/EventCard';
import { EVENT_CATEGORIES } from '../utils/constants';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  XCircleIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import Loader from '../components/Loader';
import { useDebounce } from '../hooks/useDebounce';

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    date: searchParams.get('date') || ''
  });

  // Track pagination
  const [pagination, setPagination] = useState({
    currentPage: parseInt(searchParams.get('page') || '1'),
    totalPages: 1,
    totalEvents: 0
  });

  // Debounced search value
  const debouncedSearch = useDebounce(filters.search, 500);

  // Comprehensive list of Indian Cities
  const INDIAN_CITIES = [
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Jaipur',
    'Lucknow',
    'Surat',
    'Kanpur',
    'Nagpur',
    'Indore',
    'Thane',
    'Bhopal',
    'Visakhapatnam',
    'Patna',
    'Vadodara',
    'Ghaziabad',
    'Ludhiana',
    'Agra',
    'Nashik',
    'Faridabad',
    'Meerut',
    'Rajkot',
    'Varanasi',
    'Srinagar',
    'Aurangabad',
    'Dhanbad',
    'Amritsar',
    'Allahabad',
    'Ranchi',
    'Howrah',
    'Coimbatore',
    'Vijayawada',
    'Jodhpur',
    'Madurai',
    'Raipur',
    'Kota',
    'Chandigarh',
    'Guwahati',
    'Solapur',
    'Mysore',
    'Bareilly',
    'Gurgaon',
    'Aligarh',
    'Jalandhar',
    'Tiruchirappalli',
    'Bhubaneswar',
    'Salem',
    'Warangal',
    'Guntur',
    'Bhiwandi',
    'Saharanpur',
    'Gorakhpur',
    'Bikaner',
    'Amravati',
    'Noida',
    'Jamshedpur',
    'Bhilai',
    'Cuttack',
    'Firozabad',
    'Kochi',
    'Dehradun',
    'Durgapur',
    'Asansol',
    'Nanded',
    'Kolhapur',
    'Ajmer',
    'Gulbarga',
    'Jamnagar',
    'Ujjain',
    'Loni',
    'Siliguri',
    'Jhansi',
    'Ulhasnagar',
    'Nellore',
    'Jammu',
    'Belgaum',
    'Mangalore',
    'Ambattur',
    'Tirunelveli',
    'Malegaon',
    'Gaya',
    'Jalgaon',
    'Udaipur',
    'Maheshtala'
  ].sort();

  // Keep filters in sync with URL (e.g., back/forward navigation)
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      city: searchParams.get('city') || '',
      date: searchParams.get('date') || ''
    });
    
    // Update current page from URL
    const pageFromUrl = parseInt(searchParams.get('page') || '1');
    setPagination(prev => ({
      ...prev,
      currentPage: pageFromUrl
    }));
    
    fetchEvents();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      const currentSearchParam = searchParams.get('search') || '';
      if (debouncedSearch !== currentSearchParam) {
        handleFilterChange('search', debouncedSearch);
      }
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: Number(searchParams.get('page') || 1),
        limit: 9 // Show 9 events per page
      };

      // Add filters to params if they exist
      const search = searchParams.get('search');
      const category = searchParams.get('category');
      const city = searchParams.get('city');
      const date = searchParams.get('date');

      if (search) params.search = search;
      if (category) params.category = category;
      if (city) params.city = city;
      if (date) params.date = date;

      const response = await eventService.getEvents(params);
      console.log('API Response:', response); // Debug the response structure

      // Handle different response structures
      if (response.data && Array.isArray(response.data)) {
        // If response.data is directly an array of events
        setEvents(response.data);
        // Calculate pagination if not provided
        setPagination({
          currentPage: params.page,
          totalPages: Math.ceil(response.total / params.limit) || 1,
          totalEvents: response.total || response.data.length
        });
      } 
      else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // If response.data.data is an array of events (nested structure)
        setEvents(response.data.data);
        setPagination({
          currentPage: response.data.page || params.page,
          totalPages: response.data.pages || Math.ceil(response.data.total / params.limit) || 1,
          totalEvents: response.data.total || response.data.data.length
        });
      } 
      else if (Array.isArray(response)) {
        // If the response itself is an array
        setEvents(response);
        setPagination({
          currentPage: params.page,
          totalPages: Math.ceil(response.length / params.limit) || 1,
          totalEvents: response.length
        });
      } 
      else {
        // Unexpected response format
        console.error('Unexpected API response structure:', response);
        setEvents([]);
        setError('Could not load events. Unexpected data format.');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleFilterChange = useCallback((key, value) => {
    if (key !== 'search') {
      setFilters(prev => ({ ...prev, [key]: value }));
    }

    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }

    // Reset to page 1 when filters change
    newParams.set('page', '1');

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by debounce
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      date: ''
    });
    setSearchParams({ page: '1' });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Browse Events</h1>
          <p className="text-sm sm:text-base text-gray-600">Discover amazing events happening near you in India</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6 sm:mb-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              aria-expanded={showMobileFilters}
              aria-controls="mobile-filters"
            >
              <div className="flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Filters</span>
                {hasActiveFilters && (
                  <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <ChevronDownIcon 
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showMobileFilters ? 'rotate-180' : ''
                }`} 
              />
            </button>
          </div>

          {/* Filters Content */}
          <div 
            id="mobile-filters"
            className={`p-4 sm:p-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}
          >
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                  aria-label="Clear all filters"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="lg:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1 lg:sr-only">
                  Search
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search events..."
                    className="block w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </form>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 lg:sr-only">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className={`block w-full appearance-none rounded-md border border-gray-300 bg-white pr-10 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer hover:border-gray-400 ${
                      filters.category ? 'pl-10' : 'pl-3'
                    }`}
                  >
                    <option value="">All Categories</option>
                    {EVENT_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  {/* Category icon display when selected */}
                  {filters.category && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-lg">
                        {EVENT_CATEGORIES.find(c => c.value === filters.category)?.icon}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* City Filter */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1 lg:sr-only">
                  Location
                </label>
                <div className="relative">
                  <select
                    id="city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="block w-full appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer hover:border-gray-400"
                  >
                    <option value="">All Cities</option>
                    {INDIAN_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 lg:sr-only">
                  Date
                </label>
                <div className="relative">
                  <input
                    id="date"
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer hover:border-gray-400"
                    min={new Date().toISOString().split('T')[0]}
                    aria-label="Select date"
                  />
                  <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Mobile Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="lg:hidden mt-4 w-full text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1 transition-colors"
                aria-label="Clear all filters"
              >
                <XCircleIcon className="h-4 w-4" />
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <Loader />
        ) : error ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-sm">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircleIcon className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Events</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 px-4">
              {error}
            </p>
            <button
              onClick={fetchEvents}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-sm">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 px-4">
              We couldn't find any events matching your criteria. Try adjusting your filters or check back later.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 transition-colors"
            >
              View all events
            </button>
          </div>
        ) : (
          <>
            {/* Results count and active filters */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm sm:text-base text-gray-600">
                  Showing <span className="font-medium text-gray-900">{events.length}</span> of{' '}
                  <span className="font-medium text-gray-900">{pagination.totalEvents}</span> events
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2">
                    {filters.category && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs sm:text-sm">
                        <span className="font-medium">Category:</span> {EVENT_CATEGORIES.find(c => c.value === filters.category)?.label}
                        <button
                          onClick={() => handleFilterChange('category', '')}
                          className="ml-0.5 text-primary-600 hover:text-primary-800"
                          aria-label={`Remove ${EVENT_CATEGORIES.find(c => c.value === filters.category)?.label} filter`}
                        >
                          <XCircleIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}

                    {filters.city && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs sm:text-sm">
                        <span className="font-medium">City:</span> {filters.city}
                        <button
                          onClick={() => handleFilterChange('city', '')}
                          className="ml-0.5 text-primary-600 hover:text-primary-800"
                          aria-label={`Remove ${filters.city} filter`}
                        >
                          <XCircleIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}

                    {filters.date && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs sm:text-sm">
                        <span className="font-medium">Date:</span> {new Date(filters.date).toLocaleDateString('en-IN')}
                        <button
                          onClick={() => handleFilterChange('date', '')}
                          className="ml-0.5 text-primary-600 hover:text-primary-800"
                          aria-label="Remove date filter"
                        >
                          <XCircleIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}

                    {filters.search && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs sm:text-sm">
                        <span className="font-medium">Search:</span> 
                        <span className="max-w-[100px] truncate">{filters.search}</span>
                        <button
                          onClick={() => {
                            setFilters({ ...filters, search: '' });
                            handleFilterChange('search', '');
                          }}
                          className="ml-0.5 text-primary-600 hover:text-primary-800"
                          aria-label="Remove search filter"
                        >
                          <XCircleIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Events grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map(event => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 sm:mt-12">
                <nav className="flex justify-center" aria-label="Pagination">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded-md border border-gray-300 bg-white enabled:hover:bg-gray-50 enabled:hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      aria-label="Previous page"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>

                    <div className="hidden sm:flex items-center">
                      {/* Desktop pagination */}
                      {pagination.totalPages <= 7 ? (
                        [...Array(pagination.totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => handlePageChange(i + 1)}
                            className={`w-10 h-10 flex items-center justify-center rounded-md transition-all ${
                              pagination.currentPage === i + 1
                                ? 'bg-primary-600 text-white font-medium'
                                : 'hover:bg-gray-100 text-gray-700 hover:border-gray-300 border border-transparent'
                            }`}
                            aria-label={`Page ${i + 1}`}
                            aria-current={pagination.currentPage === i + 1 ? 'page' : undefined}
                          >
                            {i + 1}
                          </button>
                        ))
                      ) : (
                        // Condensed pagination for many pages
                        <>
                          {[1, 2].map(pageNum => (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 flex items-center justify-center rounded-md transition-all ${
                                pagination.currentPage === pageNum
                                  ? 'bg-primary-600 text-white font-medium'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                              aria-label={`Page ${pageNum}`}
                              aria-current={pagination.currentPage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          ))}

                          {pagination.currentPage > 3 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}

                          {pagination.currentPage > 2 &&
                            pagination.currentPage < pagination.totalPages - 1 && (
                              <button 
                                className="w-10 h-10 flex items-center justify-center rounded-md bg-primary-600 text-white font-medium"
                                aria-current="page"
                                aria-label={`Page ${pagination.currentPage}`}
                              >
                                {pagination.currentPage}
                              </button>
                            )}

                          {pagination.currentPage < pagination.totalPages - 2 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}

                          {[pagination.totalPages - 1, pagination.totalPages].map(pageNum => (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 flex items-center justify-center rounded-md transition-all ${
                                pagination.currentPage === pageNum
                                  ? 'bg-primary-600 text-white font-medium'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                              aria-label={`Page ${pageNum}`}
                              aria-current={pagination.currentPage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Mobile pagination - simplified */}
                    <div className="flex sm:hidden items-center gap-2 px-2">
                      <span className="text-sm text-gray-700">
                        Page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded-md border border-gray-300 bg-white enabled:hover:bg-gray-50 enabled:hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Events;
