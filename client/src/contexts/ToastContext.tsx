import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

// Interface for the toast context
export interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

// Create the context with default values
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Props for the provider component
interface ToastProviderProps {
    children: ReactNode;
}

/**
 * Get the appropriate alert class based on toast type
 */
const getAlertClass = (type: ToastType): string => {
    switch (type) {
        case 'error':
            return 'alert-error';
        case 'warning':
            return 'alert-warning';
        case 'info':
            return 'alert-info';
        case 'success':
        default:
            return 'alert-success';
    }
};

/**
 * Get the appropriate icon path based on toast type
 */
const getIconPath = (type: ToastType): React.ReactElement => {
    switch (type) {
        case 'error':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'warning':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        case 'info':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'success':
        default:
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
    }
};

/**
 * Toast component for displaying notifications
 */
const Toast: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(() => {
                onRemove(toast.id);
            }, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast, onRemove]);

    return (
        <div
            className={`alert ${getAlertClass(toast.type)} shadow-lg mb-2 animate-slide-up`}
            role="alert"
        >
            <div>
                {getIconPath(toast.type)}
                <span>{toast.message}</span>
            </div>
            <div className="flex-none">
                <button
                    onClick={() => onRemove(toast.id)}
                    className="btn btn-circle btn-xs"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

/**
 * Toast container that displays multiple toasts
 */
const ToastContainer: React.FC<{ toasts: Toast[], onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;
    return (
        <div className="toast-container fixed bottom-4 right-4 z-50">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

/**
 * Provider component that wraps the app and provides the toast context and UI
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
    const addToast = useCallback((message: string, type: ToastType, duration = 5000) => {
        const id = Math.random().toString(36).substring(7);
        const newToast: Toast = { id, message, type, duration };
        setToasts(prev => {
            if (prev.some(toast => toast.message === message)) {
                return prev;
            }
            return [...prev, newToast];
        });
    }, []);

    // Value object for the context provider
    const contextValue: ToastContextType = {
        toasts,
        addToast,
        removeToast
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

/**
 * Custom hook to use the toast context
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export default ToastContext; 