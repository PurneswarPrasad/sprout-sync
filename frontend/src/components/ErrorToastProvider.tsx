import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ErrorToastContainer } from './ErrorToast';

interface ErrorToast {
  id: string;
  message: string;
  details?: string;
}

interface ErrorToastContextType {
  showError: (message: string, details?: string) => void;
}

const ErrorToastContext = createContext<ErrorToastContextType | undefined>(undefined);

export const useErrorToast = () => {
  const context = useContext(ErrorToastContext);
  if (!context) {
    throw new Error('useErrorToast must be used within ErrorToastProvider');
  }
  return context;
};

export const ErrorToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorToast[]>([]);

  const showError = (message: string, details?: string) => {
    const error: ErrorToast = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      details,
    };
    
    setErrors((prev) => [...prev, error]);
    
    // Also log to console for debugging
    console.error('ErrorToast:', message, details || '');
  };

  const dismissError = (id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  };

  return (
    <ErrorToastContext.Provider value={{ showError }}>
      {children}
      <ErrorToastContainer errors={errors} onDismiss={dismissError} />
    </ErrorToastContext.Provider>
  );
};

