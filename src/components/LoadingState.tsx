import React from 'react';

interface LoadingStateProps {
  labelFa?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  labelFa = 'در حال بارگذاری...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[160px] ${className}`}>
      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-xs font-medium text-secondary-theme animate-pulse">{labelFa}</span>
    </div>
  );
};
