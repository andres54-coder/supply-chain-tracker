"use client";

import { useEffect, useState } from "react";
import { Toast, ToastProps } from "./toast";
import { createPortal } from "react-dom";

export interface ToastData extends ToastProps {
  id: string;
  timestamp: number;
}

let toastIdCounter = 0;
const listeners: Array<(toasts: ToastData[]) => void> = [];
let toasts: ToastData[] = [];

function addToast(toast: Omit<ToastData, "id" | "timestamp">) {
  const id = `toast-${++toastIdCounter}`;
  const newToast: ToastData = {
    ...toast,
    id,
    timestamp: Date.now(),
  };

  toasts = [...toasts, newToast];
  listeners.forEach((listener) => listener(toasts));

  // Auto-remove after duration
  if (toast.duration !== 0) {
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((listener) => listener(toasts));
}

function subscribe(listener: (toasts: ToastData[]) => void) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: "success", duration });
  },
  error: (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: "error", duration: duration || 7000 });
  },
  warning: (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: "warning", duration });
  },
  info: (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: "default", duration });
  },
  dismiss: (id: string) => {
    removeToast(id);
  },
};

export function Toaster() {
  const [mounted, setMounted] = useState(false);
  const [currentToasts, setCurrentToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribe(setCurrentToasts);
    return unsubscribe;
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-end px-4 py-6 sm:items-start sm:p-6">
      <div className="flex w-full flex-col gap-4 sm:max-w-md">
        {currentToasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

