import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, User, Edit2, Check, X, Link as LinkIcon } from 'lucide-react';
import { Layout } from '../components/Layout';
import { notificationService } from '../services/notificationService';
import { authAPI, usersAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useErrorToast } from '../components/ErrorToastProvider';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useErrorToast();
  const [user, setUser] = useState<User | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    fetchUserProfile();
    fetchNotificationSettings();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      if (response.data.success) {
        setUser(response.data.data);
        setUsernameInput(response.data.data.username || '');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleStartEditUsername = () => {
    setIsEditingUsername(true);
    setUsernameError('');
  };

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setUsernameInput(user?.username || '');
    setUsernameError('');
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }

    // Validate username format
    if (!/^[a-z0-9-]+$/.test(usernameInput)) {
      setUsernameError('Username can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      setIsSaving(true);
      setUsernameError('');
      const response = await usersAPI.updateUsername(usernameInput);
      if (response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        setIsEditingUsername(false);
      }
    } catch (error: any) {
      console.error('Error updating username:', error);
      setUsernameError(
        error.response?.data?.error || 'Failed to update username. Please try again.'
      );
    } finally {
      setIsSaving(false);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? error.stack : undefined;
      showError(
        `Failed to load notification settings: ${errorMessage}`,
        errorDetails
      );
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
        try {
          const success = await notificationService.requestPermission();
          if (!success) {
            showError(
              'Unable to enable notifications',
              'Please allow notifications in your browser settings. On iOS, you may need to enable notifications in Safari settings after installing the PWA.'
            );
            return;
          }
          setHasToken(true);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorDetails = error instanceof Error ? error.stack : undefined;
          
          // Check if it's a permission denied error
          if (errorMessage.includes('permission denied')) {
            showError(
              'Notification permission denied',
              'Please enable notifications in your browser settings. On iOS Safari, go to Settings > Safari > Website Settings > Notifications.'
            );
          } else {
            showError(
              `Failed to request notification permission: ${errorMessage}`,
              errorDetails
            );
          }
          return;
        }
      }

      // Update settings
      try {
        await notificationService.updateSettings(newValue);
        setNotificationsEnabled(newValue);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = error instanceof Error ? error.stack : undefined;
        showError(
          `Failed to update notification settings: ${errorMessage}`,
          errorDetails
        );
        // Don't update local state if API call failed
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? error.stack : undefined;
      showError(
        `Unexpected error toggling notifications: ${errorMessage}`,
        errorDetails
      );
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
              <div className="space-y-4">
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

                {/* Username Section */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Profile Username</h3>
                    {!isEditingUsername && (
                      <button
                        onClick={handleStartEditUsername}
                        className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditingUsername ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                        placeholder="your-username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      {usernameError && (
                        <p className="text-sm text-red-600">{usernameError}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveUsername}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditUsername}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-base text-gray-900 mb-1">@{user.username || 'Not set'}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Your username is used in shareable plant profile URLs
                      </p>
                    </div>
                  )}
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




