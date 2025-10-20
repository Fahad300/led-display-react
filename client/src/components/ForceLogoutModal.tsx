import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * ForceLogoutModal Component
 * 
 * Displays when another user logs in, giving the current user options:
 * - Login again (redirects to login page)
 * - Cancel (redirects to login page)
 * 
 * This provides a graceful logout experience instead of abrupt disconnection.
 */
interface ForceLogoutModalProps {
    isOpen: boolean;
    newUserUsername?: string;
    onClose: () => void;
}

export const ForceLogoutModal: React.FC<ForceLogoutModalProps> = ({
    isOpen,
    newUserUsername,
    onClose
}) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleLogin = () => {
        onClose();
        navigate("/login");
    };

    const handleCancel = () => {
        onClose();
        navigate("/login");
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center"
                onClick={handleCancel}
            >
                {/* Modal */}
                <div
                    className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-amber-500 text-white px-6 py-4 rounded-t-lg">
                        <div className="flex items-center gap-3">
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <h2 className="text-xl font-bold">Session Ended</h2>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6">
                        <p className="text-gray-700 text-lg mb-4">
                            Another user has logged in to the system.
                        </p>

                        {newUserUsername && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
                                <p className="text-sm text-blue-800">
                                    <span className="font-semibold">New user:</span> {newUserUsername}
                                </p>
                            </div>
                        )}

                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6">
                            <p className="text-sm text-gray-600">
                                For security reasons, only one user can be logged in at a time.
                                Your session has been terminated.
                            </p>
                        </div>

                        <p className="text-gray-700 mb-2">
                            Would you like to log in again?
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleLogin}
                            className="px-6 py-2 bg-persivia-teal text-white rounded-lg hover:bg-persivia-teal/90 transition-colors font-medium"
                        >
                            Login Again
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

