import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  TicketIcon,
  SparklesIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); 

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const response = await eventService.getEvents({ limit: 6 });
      setFeaturedEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Discover Amazing Events Across India
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-primary-100">
              Book tickets for concerts, sports, theater, and more
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events" className="btn-primary bg-white text-primary-700 hover:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg">
                Browse All Events
              </Link>
              {!user && (
                <Link to="/signup" className="btn-primary bg-primary-500 text-white hover:bg-primary-400 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg">
                  Create an Account
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden">
          <svg className="w-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
                <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Wide Selection</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Choose from thousands of events happening in cities across India
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
                <TicketIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Secure Booking</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Safe payments with UPI, cards, and net banking options
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
                <MapPinIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Real-time Updates</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Get live seat availability and instant confirmations
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500" />
                Featured Events
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Don't miss out on these popular events</p>
            </div>
            <Link to="/events" className="text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
              
              {featuredEvents.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No featured events at the moment. Check back soon!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="bg-primary-600 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CurrencyRupeeIcon className="h-6 w-6 text-primary-200" />
            <h2 className="text-2xl sm:text-3xl font-bold">
              The Best Events Across India
            </h2>
          </div>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-primary-100">
            {user 
              ? "Explore thousands of amazing events happening near you"
              : "Join thousands of event-goers and never miss out on great experiences"
            }
          </p>
          {user ? (
            <Link 
              to="/events" 
              className="btn-primary bg-white text-primary-700 hover:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg inline-block"
            >
              Explore Events
            </Link>
          ) : (
            <Link 
              to="/signup" 
              className="btn-primary bg-white text-primary-700 hover:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg inline-block"
            >
              Get Started Free
            </Link>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10 text-gray-900">
            Popular Cities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
            {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'].map((city, index) => (
              <Link 
                key={index}
                to={`/events?city=${city}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 text-center"
              >
                <div className="font-medium text-gray-900">{city}</div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Find events</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
