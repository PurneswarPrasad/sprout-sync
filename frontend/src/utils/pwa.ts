let deferredPrompt: any = null;

export const registerSW = () => {
  // Service worker registration is now handled by Firebase in notificationService.ts
  // This prevents conflicts between VitePWA and Firebase service workers
  console.log('Service worker registration delegated to Firebase');
};

export const checkForUpdates = () => {
  // Service worker updates are now handled by Firebase service worker
  console.log('Service worker updates handled by Firebase');
};

// Force update function for development
export const forceUpdate = () => {
  // Service worker updates are now handled by Firebase service worker
  console.log('Service worker updates handled by Firebase');
};

// Capture the beforeinstallprompt event
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('Install prompt event captured');
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
  });
};

// Check if app is already installed
export const isAppInstalled = (): boolean => {
  // Check if running in standalone mode (installed as PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  return false;
};

// Trigger the install prompt
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`User response to the install prompt: ${outcome}`);
  
  if (outcome === 'accepted') {
    deferredPrompt = null;
    return true;
  }
  
  return false;
};

// Check if install prompt is available (browser supports it)
export const canShowInstallPrompt = (): boolean => {
  return deferredPrompt !== null;
};

// Check if browser is iOS Safari (needs manual instructions)
export const isIOSSafari = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
  return isIOS && isSafari;
};