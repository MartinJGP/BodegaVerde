'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'alert' | 'error';
  onClose: () => void;
}

export const NotificationToast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const isSuccess = type === 'success';
  const isAlert = type === 'alert';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 rounded-lg border bg-white px-4 py-3 shadow-md animate-feedback border-sand-200">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          isSuccess
            ? 'bg-sage-100 text-sage-600'
            : isAlert
            ? 'bg-amberPastel-100 text-amberPastel-600'
            : 'bg-terracotta-100 text-terracotta-600'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
      </div>
      <p className="text-xs font-medium text-charcoal-900 max-w-xs">{message}</p>
      <button
        onClick={onClose}
        className="text-charcoal-700/50 hover:text-charcoal-800 btn-action"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
