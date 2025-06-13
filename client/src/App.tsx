import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SlideProvider } from './contexts/SlideContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { DisplaySettingsProvider } from './contexts/DisplaySettingsContext';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import Register from "./pages/Register";
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import MediaPage from './pages/MediaPage';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <SlideProvider>
        <ToastProvider>
          <Router>
            <AuthProvider>
              <DisplaySettingsProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Routes */}
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
                  </Route>

                  {/* Fallback Route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </DisplaySettingsProvider>
            </AuthProvider>
          </Router>
        </ToastProvider>
      </SlideProvider>
    </SettingsProvider>
  );
};

export default App;
