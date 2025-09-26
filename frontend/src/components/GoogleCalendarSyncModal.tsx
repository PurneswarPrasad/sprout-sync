import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { api, googleCalendarAPI } from '../services/api';
import { StatusStep } from './StatusStep';
import { SetupStep } from './SetupStep';
import { SyncStep } from './SyncStep';

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
            <StatusStep
              syncStatus={syncStatus}
              loading={loading}
              onAuthorize={handleAuthorize}
              onConfigureSync={() => setStep('setup')}
              onRevokeAccess={handleRevokeAccess}
            />
          )}

          {/* Step 2: Setup */}
          {step === 'setup' && (
            <SetupStep
              plants={plants}
              selectedPlantIds={selectedPlantIds}
              reminderMinutes={reminderMinutes}
              loading={loading}
              onPlantToggle={togglePlantId}
              onReminderChange={setReminderMinutes}
              onSaveSettings={handleUpdateSettings}
              onBack={() => setStep('status')}
            />
          )}

          {/* Step 3: Sync Success */}
          {step === 'sync' && (
            <SyncStep
              plants={plants}
              selectedPlantIds={selectedPlantIds}
              recentlySyncedPlantIds={recentlySyncedPlantIds}
              reminderMinutes={reminderMinutes}
              loading={loading}
              onDisableSync={handleDisableSync}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};
