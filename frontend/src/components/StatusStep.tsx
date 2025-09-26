import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';

interface SyncStatus {
  hasAccess: boolean;
  syncEnabled: boolean;
  reminderMinutes: number;
  syncedPlantIds: string[];
}

interface StatusStepProps {
  syncStatus: SyncStatus | null;
  loading: boolean;
  onAuthorize: () => void;
  onConfigureSync: () => void;
  onRevokeAccess: () => void;
}

export const StatusStep: React.FC<StatusStepProps> = ({
  syncStatus,
  loading,
  onAuthorize,
  onConfigureSync,
  onRevokeAccess,
}) => {
  return (
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
            onClick={onAuthorize}
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            <span>Connect Google Calendar</span>
          </button>
        ) : (
          <>
            <button
              onClick={onConfigureSync}
              className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Configure Sync
            </button>
            <button
              onClick={onRevokeAccess}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Revoke Access
            </button>
          </>
        )}
      </div>
    </div>
  );
};
