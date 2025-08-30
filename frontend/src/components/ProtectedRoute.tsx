import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 Checking auth status, token:', token ? 'exists' : 'missing');
      if (!token) {
        // No token, redirect to landing page
        console.log('❌ No token found, redirecting to landing page');
        navigate('/');
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.status();
        
        if (response.data.success && response.data.authenticated) {
          // Token is valid, allow access
          setLoading(false);
        } else {
          // Token is invalid, clear auth and redirect
          logout();
          navigate('/');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Error occurred, clear auth and redirect
        logout();
        navigate('/');
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate, token, logout, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }



  return <>{children}</>;
};
