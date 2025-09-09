import { Workbox } from 'workbox-window';

let wb: Workbox | null = null;

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    wb = new Workbox('/sw.js');
    
    wb.addEventListener('waiting', () => {
      // Show update notification
      if (confirm('New version available! Click OK to update.')) {
        wb?.messageSkipWaiting();
      }
    });
    
    wb.addEventListener('controlling', () => {
      // Reload the page to use the new service worker
      window.location.reload();
    });
    
    wb.register();
  }
};

export const checkForUpdates = () => {
  if (wb) {
    wb.update();
  }
};

// Force update function for development
export const forceUpdate = () => {
  if (wb) {
    wb.messageSkipWaiting();
  }
};