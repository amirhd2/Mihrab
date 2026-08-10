import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { CalendarCheck } from 'lucide-react';

export const FastingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        titleFa="روزه، فطریه و کفاره"
        subtitleFa="قضا و کفاره روزه، فطریه و محاسبات شرعی"
        showBack
      />

      <Card className="text-center py-12">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-primary-theme mb-2">
          صفحه روزه، فطریه و کفاره
        </h3>
        <p className="text-xs text-secondary-theme max-w-sm mx-auto leading-relaxed">
          زیرساخت مسیر و داده‌های مربوط به قضا و کفاره روزه، فطریه و رد مظالم آماده است.
        </p>
      </Card>
    </div>
  );
};
