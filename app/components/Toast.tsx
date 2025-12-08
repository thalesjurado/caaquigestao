'use client';

import { useToasts, removeToast, Toast as ToastType } from '../../lib/toast';

function ToastItem({ toast }: { toast: ToastType }) {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[toast.type] || 'bg-gray-500';

  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-80 animate-slide-in`}>
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-3 text-white hover:text-gray-200 text-lg font-bold"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
