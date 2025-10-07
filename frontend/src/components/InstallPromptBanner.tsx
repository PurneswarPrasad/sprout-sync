import React, { useEffect, useState } from 'react';
import { isAppInstalled, canShowInstallPrompt, showInstallPrompt, isIOSSafari } from '../utils/pwa';

export const InstallPromptBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissedForSession, setDismissedForSession] = useState(false);

  useEffect(() => {
    // Check if we should show the banner
    const checkInstallStatus = () => {
      // Don't show if already installed
      if (isAppInstalled()) {
        setShowBanner(false);
        return;
      }

      // Don't show again if user dismissed it during this visit
      if (dismissedForSession) {
        setShowBanner(false);
        return;
      }

      // Check if we're on iOS Safari
      if (isIOSSafari()) {
        setShowBanner(true);
        return;
      }

      // For other browsers, check if install prompt is available
      // We'll check after a short delay to ensure the event has been captured
      setTimeout(() => {
        if (!dismissedForSession && canShowInstallPrompt()) {
          setShowBanner(true);
        }
      }, 1000);
    };

    checkInstallStatus();

    // Recheck periodically in case the beforeinstallprompt event fires later
    const interval = setInterval(() => {
      if (
        !dismissedForSession &&
        !isAppInstalled() &&
        canShowInstallPrompt() &&
        !showBanner
      ) {
        setShowBanner(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [showBanner, dismissedForSession]);

  const handleInstall = async () => {
    if (isIOSSafari()) {
      // Show iOS instructions
      setShowIOSInstructions(true);
      return;
    }

    setIsInstalling(true);
    try {
      const installed = await showInstallPrompt();
      if (installed) {
        // Installation successful, hide banner
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissedForSession(true);
    setShowBanner(false);
  };

  const handleCloseIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              {/* Icon and Content */}
              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <img src="/SproutSync_logo.png" alt="SproutSync" className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">
                    Install SproutSync App
                  </h3>
                  <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                    Get quick access and offline support. Install our app for the best experience!
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-1"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-white text-emerald-600 font-semibold py-3 px-6 rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isInstalling ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Installing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Install Now
                  </span>
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="sm:w-auto bg-white/10 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm text-sm sm:text-base"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Install on iOS</h3>
                <button
                  onClick={handleCloseIOSInstructions}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/90 text-sm">Follow these steps to add SproutSync to your home screen</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    Tap the <span className="font-semibold">Share</span> button 
                    <svg className="inline-block w-5 h-5 mx-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                    </svg>
                    in Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    Tap <span className="font-semibold">"Add"</span> in the top right corner
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseIOSInstructions}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

