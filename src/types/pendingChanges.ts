// Types for Pending Changes / Activity Logger
export type ChangeCategory =
  | 'prayers'     // نمازهای قضا
  | 'fasting'     // روزه و کفارات
  | 'duas'        // ادعیه و زیارات
  | 'education'   // آموزش و احکام
  | 'settings'    // تنظیمات و پشتیبان
  | 'general';

export type ChangeActionType = 'create' | 'update' | 'delete' | 'reset' | 'import';

export interface PendingChangeItem {
  id: string;
  title: string;
  description?: string;
  category: ChangeCategory;
  type: ChangeActionType;
  timestamp: string; // ISO string
}
