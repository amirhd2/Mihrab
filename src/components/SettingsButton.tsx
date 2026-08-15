import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppNavigate } from './PageTransition';
import { Settings } from 'lucide-react';

export const SettingsButton: React.FC = () => {
  const navigate = useAppNavigate();
  const location = useLocation();
  const isSettingsActive = location.pathname === '/settings';

  return (
    <button
      type="button"
      id="btn-settings"
      onClick={() => navigate('/settings')}
      className={`p-2 rounded-xl transition-theme ${
        isSettingsActive
          ? 'bg-brand-primary-light text-brand-primary font-medium'
          : 'text-secondary-theme hover:bg-surface-elevated hover:text-primary-theme'
      } active:scale-95`}
      title="تنظیمات برنامه"
      aria-label="تنظیمات"
    >
      <Settings className="w-5 h-5" />
    </button>
  );
};
