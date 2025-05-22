import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from '../types';

// Interface for the toast context
interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

// Create the context with default values
const ToastContext = createContext<ToastContextType>({
    toasts: [],
    addToast: () => { },
    removeToast: () => { }
});

// Props for the provider component
interface ToastProviderProps {
    children: ReactNode;
}

/**
 * Generate a unique ID for a toast
 */
const generateId = (): string => {
    return `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Provider component that wraps the app and provides the toast context
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    /**
     * Remove a toast notification by ID
     */
    const removeToast = useCallback((id: string) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    /**
     * Add a new toast notification
     */
    const addToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
        const newToast: Toast = {
            id: generateId(),
            message,
            type,
            duration
        };

        setToasts(prevToasts => [...prevToasts, newToast]);

        // Automatically remove toast after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(newToast.id);
            }, duration);
        }
    }, [removeToast]);

    // Value object for the context provider
    const contextValue = {
        toasts,
        addToast,
        removeToast
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
        </ToastContext.Provider>
    );
};

/**
 * Custom hook to use the toast context
 */
export const useToast = () => useContext(ToastContext);

export default ToastContext; 