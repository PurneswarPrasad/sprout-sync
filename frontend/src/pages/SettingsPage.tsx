import React from 'react';
import { Layout } from '../components/Layout';
import { NotificationSettings } from '../components/NotificationSettings';

export const SettingsPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your app preferences and notifications
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Notification Settings */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Notifications
              </h2>
              <NotificationSettings />
            </div>

            {/* Future settings sections can be added here */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                More Settings Coming Soon
              </h3>
              <p className="text-gray-600">
                We're working on adding more customization options for your plant care experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
