import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/AppShell';
import { Snackbar } from './components/Snackbar';
import { useToastState } from './hooks/useToast';

import { DashboardPage } from './pages/DashboardPage';
import { QadaPrayersPage } from './pages/QadaPrayersPage';
import { FastingPage } from './pages/FastingPage';
import { DuasPage } from './pages/DuasPage';
import { EducationPage } from './pages/EducationPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const { toasts, showToast, removeToast } = useToastState();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/prayers" element={<QadaPrayersPage />} />
            <Route path="/fasting" element={<FastingPage />} />
            <Route path="/fitr" element={<Navigate to="/fasting" replace />} />
            <Route path="/duas" element={<DuasPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route
              path="/settings"
              element={<SettingsPage onShowToast={showToast} />}
            />
            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        <Snackbar toasts={toasts} onRemove={removeToast} />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
