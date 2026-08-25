import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/AppShell';
import { Snackbar } from './components/Snackbar';
import { SplashScreen } from './components/SplashScreen';
import { useToastState } from './hooks/useToast';
import { DashboardPage } from './pages/DashboardPage';
import { QadaPrayersPage } from './pages/QadaPrayersPage';
import { FastingPage } from './pages/FastingPage';
import { DuasPage } from './pages/DuasPage';
import { EducationPage } from './pages/EducationPage';
import { SettingsPage } from './pages/SettingsPage';
import { PageTransition } from './components/PageTransition';
import { PendingChangesProvider } from './context/PendingChangesContext';
import { PendingChangesModal } from './components/pendingChanges/PendingChangesModal';

function AppRoutes({ showToast }: { showToast: any }) {
  const location = useLocation();
  return (
    <PageTransition location={location}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/prayers" element={<QadaPrayersPage onShowToast={showToast} />} />
        <Route path="/fasting" element={<FastingPage onShowToast={showToast} />} />
        <Route path="/fitr" element={<Navigate to="/fasting" replace />} />
        <Route path="/duas" element={<DuasPage onShowToast={showToast} />} />
        <Route path="/education" element={<EducationPage onShowToast={showToast} />} />
        <Route
          path="/settings"
          element={<SettingsPage onShowToast={showToast} />}
        />
        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
}

export default function App() {
  const { toasts, showToast, removeToast } = useToastState();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <PendingChangesProvider>
        <Router>
          <AppShell>
            <AppRoutes showToast={showToast} />
          </AppShell>
          <Snackbar toasts={toasts} onRemove={removeToast} />
          <PendingChangesModal onShowToast={showToast} />
        </Router>
      </PendingChangesProvider>
    </ErrorBoundary>
  );
}

