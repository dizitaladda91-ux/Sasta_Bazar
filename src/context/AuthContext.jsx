import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let active = true;
    api.getMe()
      .then((response) => {
        if (active) setUser(response.user);
      })
      .catch((error) => {
        if (!active) return;
        setUser(null);
        if (error.status !== 401) {
          setNotification(error.message || 'Could not verify your account session.');
        }
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => { active = false; };
  }, []);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3500);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.login({ email, password });
      if (response.success && response.user) {
        setUser(response.user);
        showNotification(`Welcome back, ${response.user.name.split(' ')[0]}!`);
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Network error during login' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.register(userData);
      if (response.success && response.user) {
        setUser(response.user);
        showNotification('Account created! Welcome to Sasta Bazaar.');
        return { success: true, user: response.user, couponCode: response.couponCode };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Network error during registration' };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!user) return { success: false, message: 'Not logged in' };
    try {
      const response = await api.updateProfile(profileData);
      if (response.success && response.user) {
        setUser(response.user);
        showNotification('Profile updated successfully');
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error updating profile' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      showNotification('You have been signed out.');
      return { success: true };
    } catch (error) {
      showNotification(error.message || 'Could not sign out. Please try again.');
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        initializing,
        loading,
        notification,
        login,
        register,
        updateProfile,
        logout,
        showNotification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
