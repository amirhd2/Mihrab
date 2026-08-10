import React from 'react';

interface TagChipProps {
  labelFa: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  labelFa,
  active = false,
  onClick,
  icon,
  className = '',
  id,
}) => {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-theme whitespace-nowrap ${
        active
          ? 'bg-emerald-600 text-white shadow-xs'
          : 'bg-surface-elevated text-secondary-theme hover:bg-surface-card border border-theme/60'
      } ${onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'} ${className}`}
    >
      {icon}
      <span>{labelFa}</span>
    </button>
  );
};
