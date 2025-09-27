import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      checkAuth();
      setInitialized(true);
    }
  }, [initialized]);

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Check if there's a token/cookie first
      const response = await authService.getProfile();
      
      // Debug the response to see its structure
      console.log('Auth response structure:', response);
      
      // Handle different response structures
      if (response && response.success === true && response.user) {
        setUser(response.user);
      } else if (response && response.data) {
        setUser(response.data);
      } else if (response && response._id) {
        setUser(response);
      } else if (response) {
        // If response exists but doesn't match known patterns
        setUser(response);
      }
    } catch (error) {
      // Don't show error toast on initial load
      console.log('Auth check failed:', error);
      // Clear user data on auth failure
      setUser(null);
      
      // Check if it's a 401 - expected for not logged in
      if (error.response && error.response.status === 401) {
        console.log('User not authenticated, this is normal if not logged in');
      } else {
        // Only log unexpected errors
        console.error('Unexpected auth error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data) => {
    try {
      const response = await authService.signup(data);
      
      // Debug the response format
      console.log('Signup response structure:', response);
      
      // Handle different response structures
      if (response && response.success === true && response.user) {
        setUser(response.user);
      } else if (response && response._id) {
        setUser(response);
      } else {
        // If response exists but doesn't match known patterns
        setUser(response);
      }
      
      toast.success('Account created successfully!');
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (data) => {
    try {
      const response = await authService.login(data);
      
      // Debug the response format
      console.log('Login response structure:', response);
      
      // Handle different response structures
      if (response && response.success === true && response.user) {
        setUser(response.user);
      } else if (response && response._id) {
        setUser(response);
      } else {
        // If response exists but doesn't match known patterns
        setUser(response);
      }
      
      toast.success('Welcome back!');
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
      setUser(null);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
