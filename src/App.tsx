import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
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

function AnimatedRoutes({ showToast }: { showToast: any }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.992 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/prayers" element={<QadaPrayersPage onShowToast={showToast} />} />
          <Route path="/fasting" element={<FastingPage onShowToast={showToast} />} />
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
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { toasts, showToast, removeToast } = useToastState();

  return (
    <ErrorBoundary>
      <Router>
        <AppShell>
          <AnimatedRoutes showToast={showToast} />
        </AppShell>
        <Snackbar toasts={toasts} onRemove={removeToast} />
      </Router>
    </ErrorBoundary>
  );
}
