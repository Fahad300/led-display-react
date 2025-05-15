import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SlideProvider } from './contexts/SlideContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/layout/MainLayout';

// Import pages
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
// import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <SlideProvider>
        <ToastProvider>
          <Router>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </MainLayout>
          </Router>
        </ToastProvider>
      </SlideProvider>
    </SettingsProvider>
  );
};

export default App;
