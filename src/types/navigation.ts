import React from 'react';

export interface AppRoute {
  path: string;
  titleFa: string;
  subtitleFa?: string;
  iconName: string;
  isMainSection: boolean;
}

export const APP_ROUTES: AppRoute[] = [
  {
    path: '/',
    titleFa: 'پیش‌خوان',
    subtitleFa: 'خلاصه وضعیت و دسترسی سریع',
    iconName: 'LayoutDashboard',
    isMainSection: true,
  },
  {
    path: '/prayers',
    titleFa: 'نمازهای قضا',
    subtitleFa: 'ثبت و پیگیری قضا نمازهای یومیه',
    iconName: 'Clock',
    isMainSection: true,
  },
  {
    path: '/fasting',
    titleFa: 'روزه',
    subtitleFa: 'قضا و کفاره روزه، فطریه و محاسبات شرعی',
    iconName: 'CalendarCheck',
    isMainSection: true,
  },
  {
    path: '/duas',
    titleFa: 'دعا و ادعیه',
    subtitleFa: 'منتخب ادعیه، زیارات و تعقیبات',
    iconName: 'BookOpen',
    isMainSection: true,
  },
  {
    path: '/education',
    titleFa: 'احکام و آموزش',
    subtitleFa: 'آموزش و مسایل شرعی مورد نیاز',
    iconName: 'GraduationCap',
    isMainSection: true,
  },
  {
    path: '/settings',
    titleFa: 'تنظیمات',
    subtitleFa: 'پشتیبان‌گیری، پوسته و مدیریت داده‌ها',
    iconName: 'Settings',
    isMainSection: false,
  },
];
