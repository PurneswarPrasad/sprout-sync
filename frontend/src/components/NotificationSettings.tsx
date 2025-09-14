import React from 'react';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useFCM } from '../hooks/useFCM';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export const NotificationSettings: React.FC = () => {
  const { 
    isSupported, 
    permission, 
    token, 
    isInitialized, 
    error, 
    requestPermission 
  } = useFCM();

  const getStatusIcon = () => {
    if (!isSupported) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    
    switch (permission) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (!isSupported) {
      return 'Not Supported';
    }
    
    switch (permission) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Disabled';
      default:
        return 'Not Requested';
    }
  };

  const getStatusColor = () => {
    if (!isSupported) {
      return 'destructive';
    }
    
    switch (permission) {
      case 'granted':
        return 'default';
      case 'denied':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleRequestPermission = async () => {
    const success = await requestPermission();
    if (success) {
      console.log('Notification permission granted');
    } else {
      console.log('Failed to get notification permission');
    }
  };

  const canRequestPermission = isSupported && permission === 'default';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when your plants need care
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Status</span>
          </div>
          <Badge variant={getStatusColor() as any}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Token Status */}
        {isSupported && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Token</span>
            <Badge variant={token ? 'default' : 'secondary'}>
              {token ? 'Registered' : 'Not Registered'}
            </Badge>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Action Button */}
        {canRequestPermission && (
          <Button 
            onClick={handleRequestPermission}
            className="w-full"
            variant="default"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
        )}

        {/* Instructions */}
        {permission === 'denied' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Notifications are disabled</p>
                <p className="mt-1">
                  To enable notifications, please allow them in your browser settings 
                  and refresh the page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {permission === 'granted' && token && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Notifications are enabled</p>
                <p className="mt-1">
                  You'll receive reminders when your plants need care.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Description */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">What you'll receive:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Watering reminders</li>
            <li>Fertilizing notifications</li>
            <li>Pruning alerts</li>
            <li>Spraying reminders</li>
            <li>Sunlight rotation notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

