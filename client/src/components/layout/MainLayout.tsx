import React, { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { ToastContainer } from '../ui/Toast';
import { useAuth } from "../../contexts/AuthContext";

interface MainLayoutProps {
    children: ReactNode;
}

/**
 * Main layout component with compact navbar and footer
 */
const NAVBAR_HEIGHT = 56; // px
const FOOTER_HEIGHT = 40; // px

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { toasts, removeToast } = useToast();
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Helper to check if a route is active
    const isActive = (path: string): boolean => location.pathname === path;

    // If not authenticated and not on login page, redirect to login
    React.useEffect(() => {
        if (!isAuthenticated && window.location.pathname !== "/login") {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get user initials for avatar
    const getUserInitials = (): string => {
        if (!user?.username) return "?";
        return user.username
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen flex flex-col bg-persivia-light-gray font-sans">
            {/* Navbar */}
            <nav
                className="w-full h-14 flex items-center justify-between px-4 bg-primary text-white shadow-sm fixed top-0 left-0 z-40"
                style={{ height: `${NAVBAR_HEIGHT}px` }}
            >
                <div className="flex items-center gap-2">
                    <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white hover:text-persivia-light-teal transition-colors">
                        <img src="images/logo-persivia.svg" alt="persivia" style={{ width: '150px' }} />
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    {isAuthenticated && (
                        <>
                            <Link to="/" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/') ? 'bg-persivia-blue' : ''}`}>Display</Link>
                            <Link to="/admin" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/admin') ? 'bg-persivia-blue' : ''}`}>Admin</Link>
                            <Link to="/media" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/media') ? 'bg-persivia-blue' : ''}`}>Media</Link>

                            {/* User Avatar and Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 focus:outline-none"
                                    aria-label="User menu"
                                    aria-expanded={isDropdownOpen}
                                >
                                    <div className="w-8 h-8 rounded-full bg-persivia-blue flex items-center justify-center text-white font-medium text-sm">
                                        {getUserInitials()}
                                    </div>
                                    <span className="text-sm text-white">{user?.username}</span>
                                    <svg
                                        className={`w-4 h-4 text-persivia-light-teal transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                                            <p className="font-medium">{user?.username}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </nav>

            {/* Main content */}
            <main
                className="flex-1 flex flex-col w-full"
                style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT + FOOTER_HEIGHT}px)`, marginTop: `${NAVBAR_HEIGHT}px` }}
            >
                {children}
            </main>

            {/* Footer */}
            <footer
                className="w-full h-10 flex items-center justify-center bg-secondary text-white text-xs fixed bottom-0 left-0 z-30"
                style={{ height: `${FOOTER_HEIGHT}px` }}
            >
                <span>&copy; {new Date().getFullYear()} LED Display. All rights reserved.</span>
            </footer>

            {/* Toast container */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};

export default MainLayout; 