import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function AppRoutes({ showToast }: { showToast: any }) {
  return (
    <div className="w-full">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/prayers" element={<QadaPrayersPage onShowToast={showToast} />} />
        <Route path="/fasting" element={<FastingPage onShowToast={showToast} />} />
        <Route path="/fitr" element={<Navigate to="/fasting" replace />} />
        <Route path="/duas" element={<DuasPage />} />
        <Route path="/education" element={<EducationPage onShowToast={showToast} />} />
        <Route
          path="/settings"
          element={<SettingsPage onShowToast={showToast} />}
        />
        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const { toasts, showToast, removeToast } = useToastState();

  return (
    <ErrorBoundary>
      <Router>
        <AppShell>
          <AppRoutes showToast={showToast} />
        </AppShell>
        <Snackbar toasts={toasts} onRemove={removeToast} />
      </Router>
    </ErrorBoundary>
  );
}
