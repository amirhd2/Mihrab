import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { GraduationCap } from 'lucide-react';

export const EducationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        titleFa="احکام و آموزش"
        subtitleFa="آموزش و مسایل شرعی مورد نیاز"
        showBack
      />

      <Card className="text-center py-12">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-primary-theme mb-2">
          صفحه احکام و آموزش
        </h3>
        <p className="text-xs text-secondary-theme max-w-sm mx-auto leading-relaxed">
          زیرساخت آموزش احکام و نشان‌کردن مطالب برای دسترسی آفلاین آماده شده است.
        </p>
      </Card>
    </div>
  );
};
