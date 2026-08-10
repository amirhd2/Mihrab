import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { BookOpen } from 'lucide-react';

export const DuasPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        titleFa="دعا و ادعیه"
        subtitleFa="منتخب ادعیه، زیارات و تعقیبات نماز"
        showBack
      />

      <Card className="text-center py-12">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-primary-theme mb-2">
          صفحه ادعیه و زیارات
        </h3>
        <p className="text-xs text-secondary-theme max-w-sm mx-auto leading-relaxed">
          زیرساخت علامت‌گذاری و فهرست ادعیه به همراه ذخیره‌سازی محلی آماده می‌باشد.
        </p>
      </Card>
    </div>
  );
};
