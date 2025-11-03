/**
 * Device detection utilities for error reporting and debugging
 */

export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
  browser: string;
  osVersion?: string;
  userAgent: string;
}

/**
 * Get detailed device information
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  
  // Check if running as PWA (standalone mode)
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  
  // Detect browser
  let browser = 'Unknown';
  if (/chrome/.test(userAgent) && !/edg|opr/.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)) {
    browser = 'Safari';
  } else if (/edg/.test(userAgent)) {
    browser = 'Edge';
  } else if (/opr/.test(userAgent)) {
    browser = 'Opera';
  }
  
  // Try to detect iOS version
  let osVersion: string | undefined;
  if (isIOS) {
    const match = userAgent.match(/os (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}`;
    }
  } else if (isAndroid) {
    const match = userAgent.match(/android (\d+(\.\d+)?)/);
    if (match) {
      osVersion = match[1];
    }
  }
  
  return {
    isIOS,
    isAndroid,
    isPWA,
    browser,
    osVersion,
    userAgent: window.navigator.userAgent,
  };
};

/**
 * Format device info as a string for error messages
 */
export const formatDeviceInfo = (deviceInfo?: DeviceInfo): string => {
  const info = deviceInfo || getDeviceInfo();
  const parts: string[] = [];
  
  if (info.isIOS) {
    parts.push(`iOS${info.osVersion ? ` ${info.osVersion}` : ''}`);
  } else if (info.isAndroid) {
    parts.push(`Android${info.osVersion ? ` ${info.osVersion}` : ''}`);
  } else {
    parts.push('Other OS');
  }
  
  parts.push(info.browser);
  
  if (info.isPWA) {
    parts.push('PWA');
  }
  
  return parts.join(' | ');
};

/**
 * Check if device supports notifications
 */
export const supportsNotifications = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

