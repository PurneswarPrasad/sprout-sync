import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useErrorToast } from '../components/ErrorToastProvider';

export const NotificationPromptPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useErrorToast();

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await notificationService.requestPermission();
      
      if (success) {
        console.log('✅ Notifications enabled');
      } else {
        // This shouldn't happen now since requestPermission throws on error
        showError(
          'Notification permission was denied or could not be obtained',
          'Please enable notifications in your browser settings'
        );
      }
      
      // Mark prompt as shown regardless of outcome
      try {
        await notificationService.markPromptShown();
      } catch (error) {
        // Log but don't show toast for markPromptShown errors
        console.error('Error marking prompt as shown:', error);
      }
      
      // Navigate to home
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Error enabling notifications:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? error.stack : undefined;
      showError(
        `Failed to enable notifications: ${errorMessage}`,
        errorDetails
      );
      
      // Still try to mark prompt as shown even if there's an error
      try {
        await notificationService.markPromptShown();
      } catch (markError) {
        console.error('Error marking prompt as shown after error:', markError);
      }
      
      // Still navigate even if there's an error
      navigate('/home', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotNow = async () => {
    setIsLoading(true);
    try {
      // Mark prompt as shown AND disable notifications
      try {
        await notificationService.markPromptShown();
      } catch (error) {
        // Log but don't show toast for markPromptShown errors
        console.error('Error marking prompt as shown:', error);
      }
      
      try {
        await notificationService.updateSettings(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = error instanceof Error ? error.stack : undefined;
        showError(
          `Failed to disable notifications: ${errorMessage}`,
          errorDetails
        );
      }
      
      // Navigate to home
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Error in handleNotNow:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? error.stack : undefined;
      showError(
        `Failed to save notification preferences: ${errorMessage}`,
        errorDetails
      );
      // Still navigate even if there's an error
      navigate('/home', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/SproutSync_logo.png"
            alt="SproutSync Logo"
            className="h-16 w-16"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-emerald-100 rounded-full p-6">
              <Bell className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Stay on Top of Plant Care
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            Get timely reminders for watering, fertilizing, and other plant care tasks.
            Never miss a care moment!
          </p>

          {/* Features */}
          <div className="text-left space-y-3 mb-8">
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                <Bell className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Task Reminders</p>
                <p className="text-xs text-gray-500">Get notified when tasks are due</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                <Bell className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Instant Updates</p>
                <p className="text-xs text-gray-500">Immediate alerts for new tasks</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                <Bell className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Flexible Control</p>
                <p className="text-xs text-gray-500">Enable or disable anytime in settings</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  <span>Enable Notifications</span>
                </>
              )}
            </button>

            <button
              onClick={handleNotNow}
              disabled={isLoading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <BellOff className="w-5 h-5" />
              <span>Not Now</span>
            </button>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-500 mt-6">
            You can change this preference anytime in Settings
          </p>
        </div>
      </div>
    </div>
  );
};


