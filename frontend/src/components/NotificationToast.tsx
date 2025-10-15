import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Leaf } from 'lucide-react';

export interface NotificationToastProps {
  title: string;
  body: string;
  plantId?: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  body,
  plantId,
  onClose,
  autoCloseMs = 10000,
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto close
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseMs);

    return () => clearTimeout(timer);
  }, [autoCloseMs]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const handleClick = () => {
    if (plantId) {
      navigate(`/plants/${plantId}`);
      handleClose();
    }
  };

  return (
    <div
      className={`fixed top-20 right-4 max-w-sm w-full bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      <div
        className={`p-4 ${plantId ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={plantId ? handleClick : undefined}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="bg-emerald-100 rounded-full p-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{body}</p>
            {plantId && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                Tap to view plant
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-emerald-600 transition-all ease-linear"
          style={{
            width: isVisible ? '0%' : '100%',
            transitionDuration: `${autoCloseMs}ms`,
          }}
        />
      </div>
    </div>
  );
};

// Container for multiple toasts
export const NotificationToastContainer: React.FC<{
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    plantId?: string;
  }>;
  onDismiss: (id: string) => void;
}> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{ transform: `translateY(${index * 10}px)` }}
        >
          <NotificationToast
            title={notification.title}
            body={notification.body}
            plantId={notification.plantId}
            onClose={() => onDismiss(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};




