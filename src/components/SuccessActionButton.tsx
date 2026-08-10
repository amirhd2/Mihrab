import React from 'react';
import { Check } from 'lucide-react';
import { Button, ButtonSize } from './Button';

interface SuccessActionButtonProps {
  labelFa?: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: ButtonSize;
  className?: string;
  id?: string;
}

export const SuccessActionButton: React.FC<SuccessActionButtonProps> = ({
  labelFa = 'ثبت و تکمیل',
  onClick,
  isLoading = false,
  disabled = false,
  size = 'md',
  className = '',
  id = 'btn-success-action',
}) => {
  return (
    <Button
      id={id}
      variant="success"
      size={size}
      icon={<Check className="w-4 h-4" />}
      onClick={onClick}
      isLoading={isLoading}
      disabled={disabled}
      className={`w-full sm:w-auto font-medium ${className}`}
    >
      {labelFa}
    </Button>
  );
};
