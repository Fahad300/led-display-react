import React, { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";

interface MainLayoutProps {
    children?: ReactNode;
}

/**
 * Main layout component with compact navbar and footer
 */
const NAVBAR_HEIGHT = 56; // px
const FOOTER_HEIGHT = 40; // px

const MainLayout: React.FC<MainLayoutProps> = () => {
    const location = useLocation();
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Helper to check if a route is active
    const isActive = (path: string): boolean => location.pathname === path;

    // Handle authentication redirects
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleAddUser = () => {
        navigate("/register");
        setIsDropdownOpen(false);
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
                            <Link to="/" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/') ? 'bg-persivia-blue' : ''}`}>Home</Link>
                            <Link to="/display" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/display') ? 'bg-persivia-blue' : ''}`}>Display</Link>
                            <Link to="/admin" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/admin') ? 'bg-persivia-blue' : ''}`}>Admin</Link>
                            <Link to="/media" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/media') ? 'bg-persivia-blue' : ''}`}>Media</Link>
                            {/* User Avatar and Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 focus:outline-none hover:bg-persivia-blue/20 px-2 py-1 rounded transition-all duration-200"
                                    aria-label="User menu"
                                    aria-expanded={isDropdownOpen}
                                >
                                    <div className="w-8 h-8 rounded-full bg-persivia-blue flex items-center justify-center text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                                        {getUserInitials()}
                                    </div>
                                    <span className="text-sm text-white font-medium">{user?.username}</span>
                                    <svg
                                        className={`w-4 h-4 text-persivia-light-teal transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl py-2 z-50 border border-gray-200 transform transition-all duration-200 ease-out scale-100 opacity-100">
                                        <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                                            <p className="font-semibold text-gray-900">{user?.username}</p>
                                            <p className="text-xs text-gray-500 mt-1">Administrator</p>
                                        </div>

                                        {/* Add User Button */}
                                        <button
                                            onClick={handleAddUser}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 flex items-center gap-3 group"
                                        >
                                            <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="font-medium">Add User</span>
                                        </button>

                                        {/* Divider */}
                                        <div className="border-t border-gray-200 my-1"></div>

                                        {/* Sign Out Button */}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 flex items-center gap-3 group"
                                        >
                                            <svg className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="font-medium">Sign out</span>
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
                <Outlet />
            </main>

            {/* Footer */}
            <footer
                className="w-full h-10 flex items-center justify-center bg-secondary text-white text-xs fixed bottom-0 left-0 z-30"
                style={{ height: `${FOOTER_HEIGHT}px` }}
            >
                <span>&copy; {new Date().getFullYear()} Persivia. All rights reserved.</span>
            </footer>
        </div>
    );
};

export default MainLayout; 