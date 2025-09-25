import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api, googleCalendarAPI } from '../services/api';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncStatusChange?: (syncEnabled: boolean) => void;
}

interface SyncStatus {
  hasAccess: boolean;
  syncEnabled: boolean;
  reminderMinutes: number;
  syncedPlantIds: string[];
}

interface Task {
  id: string;
  taskKey: string;
  frequencyDays: number;
  nextDueOn: string;
  active: boolean;
  plant: {
    id: string;
    petName?: string;
    botanicalName?: string;
    commonName?: string;
    type?: string;
  };
}

interface Plant {
  id: string;
  petName?: string;
  botanicalName?: string;
  commonName?: string;
  type?: string;
  tasks: Task[];
}

const REMINDER_OPTIONS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 240, label: '4 hours before' },
  { value: 1440, label: '1 day before' },
];

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncStatusChange,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [recentlySyncedPlantIds, setRecentlySyncedPlantIds] = useState<string[]>([]);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'status' | 'setup' | 'sync'>('status');

  useEffect(() => {
    if (isOpen) {
      fetchSyncStatus();
      fetchPlants();
      setRecentlySyncedPlantIds([]);
    }
  }, [isOpen]);

  const fetchSyncStatus = async () => {
    try {
      const response = await googleCalendarAPI.getStatus();
      if (response.data.success) {
        setSyncStatus(response.data.data);
        setSelectedPlantIds(response.data.data.syncedPlantIds || []);
        setRecentlySyncedPlantIds([]);
        setReminderMinutes(response.data.data.reminderMinutes);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setError('Failed to fetch sync status');
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await api.get('/api/plants');
      if (response.data.success) {
        // Plants already include tasks from the API
        setPlants(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
      setError('Failed to fetch plants');
    }
  };

  const handleAuthorize = async () => {
    try {
      setLoading(true);
      const response = await googleCalendarAPI.getAuthUrl();
      console.log(response);
      if (response.data.success) {
        // Open Google OAuth in a popup window
        const popup = window.open(
          response.data.data.authUrl,
          'google-calendar-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the popup to close and check for authorization
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Refresh sync status after popup closes
            setTimeout(() => {
              fetchSyncStatus();
              setStep('setup');
            }, 1000);
          }
        }, 1000);

        // Also listen for messages from the popup (in case it redirects back)
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
            popup?.close();
            window.removeEventListener('message', messageHandler);
            setTimeout(() => {
              fetchSyncStatus();
              setStep('setup');
            }, 1000);
          } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_ERROR') {
            popup?.close();
            window.removeEventListener('message', messageHandler);
            setError('Failed to authorize Google Calendar access');
          }
        };

        window.addEventListener('message', messageHandler);
      }
    } catch (error) {
      console.error('Error getting auth URL:', error);
      setError('Failed to get authorization URL');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await googleCalendarAPI.updateSettings({
        enabled: true,
        reminderMinutes,
        syncedPlantIds: selectedPlantIds,
      });

      if (response.data.success) {
        const previousSynced = syncStatus?.syncedPlantIds || [];
        const newlySynced = selectedPlantIds.filter(id => !previousSynced.includes(id));

        setSyncStatus(prev => prev ? { ...prev, syncEnabled: true, reminderMinutes, syncedPlantIds: selectedPlantIds } : {
          hasAccess: true,
          syncEnabled: true,
          reminderMinutes,
          syncedPlantIds: selectedPlantIds,
        });

        setRecentlySyncedPlantIds(newlySynced.length > 0 ? newlySynced : selectedPlantIds);
        setSuccess('Sync successful!');
        setStep('sync');
        onSyncStatusChange?.(true);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update sync settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSync = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await googleCalendarAPI.updateSettings({
        enabled: false,
      });

      if (response.data.success) {
        setSyncStatus(prev => prev ? { ...prev, syncEnabled: false } : null);
        setSuccess('Sync disabled successfully');
        setRecentlySyncedPlantIds([]);
        setStep('status');
        onSyncStatusChange?.(false);
      }
    } catch (error) {
      console.error('Error disabling sync:', error);
      setError('Failed to disable sync');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await googleCalendarAPI.revokeAccess();

      if (response.data.success) {
        setSyncStatus(prev => prev ? { ...prev, hasAccess: false, syncEnabled: false } : null);
        setSuccess('Google Calendar access revoked successfully');
        setStep('status');
        onSyncStatusChange?.(false);
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      setError('Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  const togglePlantId = (plantId: string) => {
    setRecentlySyncedPlantIds([]);
    setSelectedPlantIds(prev => 
      prev.includes(plantId) 
        ? prev.filter(id => id !== plantId)
        : [...prev, plantId]
    );
  };

  const getPlantName = (plant: Plant) => {
    return plant.petName || plant.commonName?.split(',')[0].trim() || plant.botanicalName || 'Unknown Plant';
  };

  const getActiveTaskCount = (plant: Plant) => {
    return plant.tasks?.filter(task => task.active).length || 0;
  };

  const getTotalActiveTasks = () => {
    const referenceIds = recentlySyncedPlantIds.length > 0 ? recentlySyncedPlantIds : selectedPlantIds;
    return plants
      .filter(plant => referenceIds.includes(plant.id))
      .reduce((total, plant) => total + getActiveTaskCount(plant), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Google Calendar Sync</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Step 1: Status and Authorization */}
          {step === 'status' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Google Calendar Access</span>
                    <span className={`text-sm font-medium ${syncStatus?.hasAccess ? 'text-green-600' : 'text-red-600'}`}>
                      {syncStatus?.hasAccess ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Sync Status</span>
                    <span className={`text-sm font-medium ${syncStatus?.syncEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                      {syncStatus?.syncEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                {!syncStatus?.hasAccess ? (
                  <button
                    onClick={handleAuthorize}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    <span>Connect Google Calendar</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setStep('setup')}
                      className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                    >
                      Configure Sync
                    </button>
                    <button
                      onClick={handleRevokeAccess}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Revoke Access
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Setup */}
          {step === 'setup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Configuration</h3>
                
                {/* Plant Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Plants to Sync
                  </label>
                  <div className="space-y-2">
                    {plants.map(plant => {
                      const taskCount = getActiveTaskCount(plant);
                      const isSelected = selectedPlantIds.includes(plant.id);
                      const plantName = getPlantName(plant);
                      
                      return (
                        <label key={plant.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePlantId(plant.id)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {plantName}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {taskCount} active task{taskCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Reminder Settings */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Reminder Time
                  </label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {REMINDER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateSettings}
                    disabled={loading || selectedPlantIds.length === 0}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span>Save Settings</span>
                  </button>
                  <button
                    onClick={() => setStep('status')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Sync Success */}
          {step === 'sync' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Successful!</h3>
                <p className="text-sm text-gray-600 mb-6">
                Your plant care tasks have been updated on Google Calendar. You'll receive reminders for your selected plants.
                </p>

                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Sync Settings:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Plants: {plants.filter(plant => (recentlySyncedPlantIds.length > 0 ? recentlySyncedPlantIds : selectedPlantIds).includes(plant.id)).map(plant => getPlantName(plant)).join(', ')}</li>
                    <li>• Reminder: {REMINDER_OPTIONS.find(opt => opt.value === reminderMinutes)?.label}</li>
                    <li>• Total tasks synced: {getTotalActiveTasks()}</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleDisableSync}
                    disabled={loading}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Disable Sync
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
