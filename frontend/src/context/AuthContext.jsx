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
      const response = await authService.getProfile();
      
      console.log('Auth response structure:', response);
      
      if (response && response.success === true && response.user) {
        setUser(response.user);
      } else if (response && response.data) {
        setUser(response.data);
      } else if (response && response._id) {
        setUser(response);
      } else if (response) {
        setUser(response);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      setUser(null);
      
      if (error.response && error.response.status === 401) {
        console.log('User not authenticated, this is normal if not logged in');
      } else {
        console.error('Unexpected auth error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data) => {
    try {
      const response = await authService.signup(data);
      
      console.log('Signup response structure:', response);
      
      if (response && response.success === true && response.user) {
        setUser(response.user);
      } else if (response && response._id) {
        setUser(response);
      } else {
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
      
      console.log('Login response structure:', response);
      
      if (response && response.success === true && response.user) {
        setUser(response.user);
      } else if (response && response._id) {
        setUser(response);
      } else {
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
