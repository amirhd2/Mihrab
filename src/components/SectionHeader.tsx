import React from 'react';

interface SectionHeaderProps {
  titleFa: string;
  subtitleFa?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  titleFa,
  subtitleFa,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <div>
        <h2 className="text-base font-bold text-primary-theme">{titleFa}</h2>
        {subtitleFa && (
          <p className="text-xs text-secondary-theme mt-0.5">{subtitleFa}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
