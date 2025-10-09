import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
