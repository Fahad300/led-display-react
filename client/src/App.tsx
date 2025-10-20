import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';
import { UnifiedProvider } from './contexts/UnifiedContext';
import { SettingsProvider } from './contexts/SettingsContext';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import MediaPage from './pages/MediaPage';
import DisplayPage from "./pages/DisplayPage";
import { useInitializeApp } from "./hooks/useInitializeApp";
import { logger } from "./utils/logger";
import { connectSocket, onSocketUpdate, disconnectSocket } from "./utils/socket";
import { ForceLogoutModal } from "./components/ForceLogoutModal";

/**
 * React Query Client Configuration
 * 
 * Global configuration for all React Query operations in the app.
 * This ensures consistent caching and refetching behavior across all queries.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data in cache for 5 minutes by default (gcTime replaces cacheTime in v5)
      gcTime: 5 * 60 * 1000,
      // Consider data stale after 30 seconds
      staleTime: 30 * 1000,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

/**
 * App Initializer Component
 * Handles one-time initialization before rendering the app
 */
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInitialized, error } = useInitializeApp();

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing LED Display System...</p>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed (but still let app load with defaults)
  if (error) {
    logger.warn("App initialized with errors:", error);
  }

  return <>{children}</>;
};

/**
 * Force Logout Listener Component
 * 
 * CRITICAL: Handles single-session enforcement
 * When another user logs in, this component:
 * 1. Receives force-logout event via Socket.IO
 * 2. Shows a graceful modal with options
 * 3. Clears local authentication
 * 4. Allows user to choose to login again or cancel
 * 
 * This ensures only ONE user has control at any time.
 */
const ForceLogoutListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState<string>("");

  useEffect(() => {
    // Skip force-logout handling on display page (display should always be accessible)
    const isDisplayPage = location.pathname === "/display";
    if (isDisplayPage) {
      logger.info("📺 Display page detected - skipping force-logout listener");
      return;
    }

    // Skip force-logout handling on login page (no active session to logout from)
    const isLoginPage = location.pathname === "/login";
    if (isLoginPage) {
      logger.info("🔐 Login page detected - skipping force-logout listener");
      return;
    }

    logger.info("🔒 Setting up force-logout listener for single-session enforcement");

    // Connect to socket for real-time events
    connectSocket();

    // Listen for force-logout events
    const unsubscribe = onSocketUpdate((event) => {
      // Check if this is a force-logout event
      if (event.type === "force-reload" && event.data?.reason === "new_login") {
        // CRITICAL: Check if this force-logout is for the current session
        // If the newSessionToken matches our current session, ignore it (we're the new login)
        const currentSessionToken = localStorage.getItem("sessionToken");
        const newSessionToken = event.data.newSessionToken;

        if (currentSessionToken && newSessionToken && currentSessionToken === newSessionToken) {
          logger.info("✅ Force-logout event is for current session - ignoring (we're the new login)");
          return;
        }

        logger.warn("⚠️ FORCE LOGOUT: Another user has logged in");
        logger.info(`   Message: ${event.data.message}`);
        logger.info(`   New user: ${event.data.username}`);

        // Clear authentication
        localStorage.removeItem("token");
        localStorage.removeItem("sessionToken");

        // Show graceful logout modal
        setNewUserUsername(event.data.username || "Unknown User");
        setShowLogoutModal(true);
      }
    });

    return () => {
      logger.info("🔇 Cleaning up force-logout listener");
      unsubscribe();
      // Note: We don't disconnect socket here as other components may be using it
    };
  }, [navigate, location.pathname]);

  const handleCloseModal = () => {
    setShowLogoutModal(false);
    // Modal will handle navigation to login page
  };

  return (
    <ForceLogoutModal
      isOpen={showLogoutModal}
      newUserUsername={newUserUsername}
      onClose={handleCloseModal}
    />
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <AuthProvider>
            {/* 
              ⚠️ DEPRECATED PROVIDERS - Maintained for backward compatibility
              These will be removed in v2.0.0 after all components are migrated
              to use Zustand (useUIStore) and React Query (useDashboardData) directly
              
              New architecture doesn't need these providers:
              - SettingsProvider → useUIStore() for display settings
              - UnifiedProvider → useDashboardData() + useUIStore()
              
              See docs/MIGRATION_GUIDE.md for migration instructions
            */}
            <SettingsProvider>
              <UnifiedProvider>
                <AppInitializer>
                  {/* Global Force-Logout Listener for Single-Session Enforcement */}
                  <ForceLogoutListener />

                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />

                    {/* Display Route - No Header/Footer - Public Access for LED Screen */}
                    <Route
                      path="/display"
                      element={<DisplayPage />}
                    />

                    {/* Protected Routes with Header/Footer */}
                    <Route element={<MainLayout />}>
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <HomePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute>
                            <AdminPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/media"
                        element={
                          <ProtectedRoute>
                            <MediaPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/register"
                        element={
                          <ProtectedRoute>
                            <Register />
                          </ProtectedRoute>
                        }
                      />
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppInitializer>
              </UnifiedProvider>
            </SettingsProvider>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
