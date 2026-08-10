import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  id,
  variant = 'default',
}) => {
  const baseClasses = 'rounded-2xl p-4 sm:p-5 transition-theme border border-theme';
  const variantClasses = {
    default: 'bg-surface-card shadow-xs',
    elevated: 'bg-surface-elevated shadow-sm',
    outlined: 'bg-transparent',
  }[variant];

  const clickableClasses = onClick ? 'cursor-pointer hover:border-emerald-500/30 hover:shadow-md active:scale-[0.99]' : '';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${clickableClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export const SubCard: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  id,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`rounded-xl p-3.5 bg-surface-elevated border border-theme/60 transition-theme ${
        onClick ? 'cursor-pointer hover:bg-surface-card active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
