import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, User } from 'lucide-react';
import { Layout } from '../components/Layout';
import { notificationService } from '../services/notificationService';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchNotificationSettings();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.profile();
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await notificationService.getSettings();
      setNotificationsEnabled(settings.notificationsEnabled);
      setHasToken(settings.hasToken);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      setIsSaving(true);
      const newValue = !notificationsEnabled;

      // If enabling and no token, request permission
      if (newValue && !hasToken) {
        const success = await notificationService.requestPermission();
        if (!success) {
          alert('Unable to enable notifications. Please allow notifications in your browser settings.');
          return;
        }
        setHasToken(true);
      }

      // Update settings
      await notificationService.updateSettings(newValue);
      setNotificationsEnabled(newValue);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Failed to update notification settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-emerald-600" />
              <span>Profile</span>
            </h2>
            {user && (
              <div className="flex items-center space-x-4">
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-16 h-16 rounded-full border-2 border-emerald-200"
                  />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>Notifications</span>
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">
                      Push Notifications
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Receive notifications for plant care tasks
                    </p>
                  </div>
                  <button
                    onClick={handleToggleNotifications}
                    disabled={isSaving}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      notificationsEnabled ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Status */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start space-x-3">
                    {notificationsEnabled && hasToken ? (
                      <>
                        <div className="bg-emerald-100 rounded-full p-1">
                          <Bell className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-900">
                            Notifications Active
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            You'll receive notifications for due tasks
                          </p>
                        </div>
                      </>
                    ) : notificationsEnabled && !hasToken ? (
                      <>
                        <div className="bg-amber-100 rounded-full p-1">
                          <Bell className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-900">
                            Permission Needed
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            Toggle to request notification permission
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-100 rounded-full p-1">
                          <BellOff className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Notifications Disabled
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            You won't receive any notifications
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    <strong>Note:</strong> Notifications are sent when:
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 ml-4 space-y-1 list-disc">
                    <li>You add a new plant with tasks</li>
                    <li>A task becomes due</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    Notifications automatically dismiss after 10 seconds or can be manually dismissed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};




