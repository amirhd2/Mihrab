import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BackButtonProps {
  labelFa?: string;
  onClick?: () => void;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  labelFa = 'بازگشت',
  onClick,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      id="btn-back"
      className={`inline-flex items-center gap-1 text-sm font-medium text-secondary-theme hover:text-primary-theme transition-theme py-1.5 px-2.5 rounded-lg hover:bg-surface-elevated active:scale-95 ${className}`}
      aria-label={labelFa}
    >
      <ChevronRight className="w-5 h-5 text-secondary-theme" />
      <span>{labelFa}</span>
    </button>
  );
};
