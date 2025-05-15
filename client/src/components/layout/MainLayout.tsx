import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { ToastContainer } from '../ui/Toast';

interface MainLayoutProps {
    children: React.ReactNode;
}

/**
 * Main layout component with compact navbar and footer
 */
const NAVBAR_HEIGHT = 56; // px
const FOOTER_HEIGHT = 40; // px

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { toasts, removeToast } = useToast();

    // Helper to check if a route is active
    const isActive = (path: string): boolean => location.pathname === path;

    return (
        <div className="min-h-screen flex flex-col bg-persivia-light-gray font-sans">
            {/* Navbar */}
            <nav
                className="w-full h-14 flex items-center justify-between px-4 bg-primary text-white shadow-sm fixed top-0 left-0 z-40"
                style={{ height: `${NAVBAR_HEIGHT}px` }}
            >
                <div className="flex items-center gap-2">
                    <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white hover:text-persivia-light-teal transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-persivia-light-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        LED Display
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/') ? 'bg-persivia-blue' : ''}`}>Display</Link>
                    <Link to="/admin" className={`px-3 py-1 rounded text-sm font-medium text-white hover:bg-persivia-blue hover:text-persivia-light-teal transition-colors ${isActive('/admin') ? 'bg-persivia-blue' : ''}`}>Admin</Link>
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