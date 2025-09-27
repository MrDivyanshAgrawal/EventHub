import React, { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircleIcon, 
  TicketIcon, 
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const UserAvatar = ({ size = 'medium', className = '' }) => {
    const sizes = {
      small: 'h-8 w-8',
      medium: 'h-10 w-10',
      large: 'h-12 w-12'
    };

    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden ${className}`}>
        {user?.profileImage ? (
          <img 
            src={user.profileImage}
            alt={user.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="flex items-center space-x-2" aria-label="EventHub India">
            <CalendarDaysIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-600" />
            <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
              EventHub <span className="text-primary-600">India</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              to="/events" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm lg:text-base"
            >
              Explore Events
            </Link>
            {user && (
              <Link 
                to="/my-bookings" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm lg:text-base"
              >
                My Tickets
              </Link>
            )}
            {user && (user.role === 'organizer' || user.role === 'admin') && (
              <Link 
                to="/dashboard" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm lg:text-base"
              >
                Dashboard
              </Link>
            )}
          </nav>

          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Main menu"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-3 text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                  <span className="sr-only">Open user menu</span>
                  <UserAvatar />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <UserCircleIcon className="h-4 w-4 mr-3" />
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/my-bookings"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700`}
                          >
                            <TicketIcon className="h-4 w-4 mr-3" />
                            My Tickets
                          </Link>
                        )}
                      </Menu.Item>
                      {(user.role === 'organizer' || user.role === 'admin') && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/dashboard"
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700`}
                            >
                              <Cog6ToothIcon className="h-4 w-4 mr-3" />
                              Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                      )}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                          >
                            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm lg:text-base"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm lg:text-base transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Transition
        show={mobileMenuOpen}
        enter="transition ease-out duration-100 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        id="mobile-menu"
      >
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/events"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore Events
            </Link>
            {user && (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/my-bookings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Tickets
                </Link>
              </>
            )}
            {user && (user.role === 'organizer' || user.role === 'admin') && (
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
          </div>
          
          {user ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <UserAvatar className="mr-3" />
                <div>
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200 flex flex-col space-y-2 px-4">
              <Link
                to="/login"
                className="w-full py-2 text-center border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="w-full py-2 text-center bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </Transition>
    </header>
  );
};

export default Header;
