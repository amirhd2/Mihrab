import React from 'react';

export type ButtonVariant = 'primary' | 'success' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  children,
  disabled,
  className = '',
  id,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2 font-medium',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5 font-semibold',
  }[size];

  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98]',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98]',
    secondary: 'bg-surface-elevated hover:bg-surface-card text-primary-theme border border-theme active:scale-[0.98]',
    outline: 'border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-[0.98]',
    ghost: 'text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated active:scale-[0.98]',
    destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-xs active:scale-[0.98]',
  }[variant];

  return (
    <button
      id={id}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-theme select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};
