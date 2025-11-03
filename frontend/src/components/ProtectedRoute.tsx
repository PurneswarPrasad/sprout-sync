import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/api';
import { notificationService } from '../services/notificationService';
import { useErrorToast } from './ErrorToastProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, logout } = useAuthStore();
  const { showError } = useErrorToast();
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
          // Token is valid, check if we need to show notification prompt
          // Skip notification prompt check if already on notification-prompt or settings page
          if (location.pathname !== '/notification-prompt' && location.pathname !== '/settings') {
            try {
              const settings = await notificationService.getSettings();
              
              // If user hasn't seen the prompt yet, redirect to notification prompt
              if (!settings.notificationPromptShown) {
                console.log('📢 Redirecting to notification prompt');
                navigate('/notification-prompt', { replace: true });
                setLoading(false);
                return;
              }
            } catch (notifError) {
              console.error('Error checking notification settings, continuing anyway:', notifError);
              // Show error toast but don't block navigation
              const errorMessage = notifError instanceof Error ? notifError.message : String(notifError);
              const errorDetails = notifError instanceof Error ? notifError.stack : undefined;
              showError(
                `Failed to check notification settings: ${errorMessage}`,
                errorDetails
              );
              // Continue to page even if notification check fails
            }
          }
          
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
  }, [navigate, token, logout, isAuthenticated, location.pathname]);

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
