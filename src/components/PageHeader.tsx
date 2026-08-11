import React from 'react';
import { BackButton } from './BackButton';

interface PageHeaderProps {
  titleFa: string;
  subtitleFa?: string;
  showBack?: boolean;
  onBackClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
  centered?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  titleFa,
  subtitleFa,
  showBack = false,
  onBackClick,
  actions,
  className = '',
  centered = false,
}) => {
  if (centered) {
    return (
      <header className={`mb-6 relative flex flex-col items-center justify-center text-center ${className}`}>
        {showBack && (
          <div className="absolute right-0 top-0.5">
            <BackButton onClick={onBackClick} />
          </div>
        )}
        <div className="text-center px-12">
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary-theme tracking-tight">
            {titleFa}
          </h1>
          {subtitleFa && (
            <p className="text-xs sm:text-sm text-secondary-theme mt-1 font-medium">
              {subtitleFa}
            </p>
          )}
        </div>
        {actions && (
          <div className="absolute left-0 top-0.5">
            {actions}
          </div>
        )}
      </header>
    );
  }

  return (
    <header className={`mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex items-center gap-2">
        {showBack && <BackButton onClick={onBackClick} />}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-theme tracking-tight">
            {titleFa}
          </h1>
          {subtitleFa && (
            <p className="text-xs sm:text-sm text-secondary-theme mt-0.5">
              {subtitleFa}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
    </header>
  );
};
