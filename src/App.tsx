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
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="w-full transform-gpu"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'opacity',
        }}
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
