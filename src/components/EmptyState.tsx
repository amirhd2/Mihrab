import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  titleFa?: string;
  descriptionFa?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  titleFa = 'اطلاعاتی یافت نشد',
  descriptionFa = 'موردی برای نمایش در این بخش وجود ندارد.',
  action,
  icon = <Inbox className="w-10 h-10 text-muted-theme stroke-[1.5]" />,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-surface-card border border-theme border-dashed rounded-2xl ${className}`}>
      <div className="p-3 bg-surface-elevated rounded-2xl mb-3">
        {icon}
      </div>
      <h3 className="text-base font-bold text-primary-theme mb-1">{titleFa}</h3>
      <p className="text-xs text-secondary-theme max-w-xs mb-4">{descriptionFa}</p>
      {action}
    </div>
  );
};
