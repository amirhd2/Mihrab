import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  labelFa: string;
  variant?: 'ghost' | 'surface' | 'outline' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  labelFa,
  variant = 'ghost',
  size = 'md',
  className = '',
  id,
  ...props
}) => {
  const sizeClasses = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2.5 rounded-xl',
    lg: 'p-3.5 rounded-2xl',
  }[size];

  const variantClasses = {
    ghost: 'text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated',
    surface: 'bg-surface-elevated text-primary-theme hover:bg-surface-card border border-theme/60',
    outline: 'border border-theme text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  }[variant];

  return (
    <button
      id={id}
      aria-label={labelFa}
      title={labelFa}
      className={`inline-flex items-center justify-center transition-theme active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
