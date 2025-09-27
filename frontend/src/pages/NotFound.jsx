import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center">
          <ExclamationTriangleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-600" />
        </div>
        <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
          Page Not Found
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to="/"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <HomeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Back to Home
          </Link>
          <Link
            to="/events"
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Explore Events
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
