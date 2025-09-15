// lib/toast.ts
import { useSyncExternalStore } from 'react';

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
};

const listeners = new Set<() => void>();
let toasts: Toast[] = [];

function emit() {
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function addToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
  const toast: Toast = {
    id: uid(),
    message,
    type,
    duration
  };
  
  toasts = [...toasts, toast];
  emit();
  
  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast.id);
    }, duration);
  }
}

export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts, () => toasts);
}

// Helper functions
export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  info: (message: string) => addToast(message, 'info')
};
