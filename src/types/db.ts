// Core database entity definitions for Mihrab IndexedDB

export type PrayerType = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'ayat';

export interface QadaPrayerRecord {
  id?: number;
  prayerType: PrayerType;
  count: number;
  completedCount: number;
  updatedAt: string;
}

export interface QadaHistoryRecord {
  id?: number;
  prayerType: PrayerType;
  timestamp: string;
  remainingCount: number;
}

export interface FastingRecord {
  id?: number;
  type: 'qada' | 'kaffara' | 'mustahabb';
  year?: number;
  targetCount: number;
  completedCount: number;
  notes?: string;
  updatedAt: string;
}

export interface FitrKaffaraRecord {
  id?: number;
  type: 'fitr' | 'kaffara_delay' | 'kaffara_deliberate';
  title: string;
  amountOrCount: number;
  unit: 'person' | 'day' | 'currency';
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DuaBookmark {
  id?: number;
  duaId: string;
  titleFa: string;
  category?: string;
  isFavorite: boolean;
  lastReadAt?: string;
}

export interface EducationBookmark {
  id?: number;
  articleId: string;
  titleFa: string;
  category: string;
  bookmarkedAt: string;
}

export interface DuaRecord {
  id?: number;
  title: string;
  arabicText: string;
  persianTranslation: string;
  source?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DuaTagRecord {
  id?: number;
  name: string;
  createdAt: string;
}

export interface EducationContentRecord {
  id?: number;
  title: string;
  text: string;
  tags: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EducationTagRecord {
  id?: number;
  name: string;
  createdAt: string;
}

export interface AppPreference {
  key: string;
  value: any;
  updatedAt: string;
}

export interface BackupHistoryLog {
  id?: number;
  timestamp: string;
  type: 'export' | 'import' | 'auto_backup';
  version: string;
  status: 'success' | 'failed';
  details?: string;
}

export interface QadaFastingState {
  id: string; // 'current'
  count: number;
  updatedAt: string;
}

export interface QadaFastingHistory {
  id?: number;
  timestamp: string;
  remainingCount: number;
}

export interface FitriyaState {
  year: number;
  peopleCount: number;
  amountPerPerson: number;
  updatedAt: string;
}

export interface KaffarahState {
  id: string; // 'current'
  isIntentionalActive: boolean;
  intentionalCount: number;
  intentionalAmount: number;
  isUnintentionalActive: boolean;
  unintentionalCount: number;
  unintentionalAmount: number;
  updatedAt: string;
}

export interface FinancialHistory {
  id?: number;
  type: 'fitriya' | 'kaffarah_intentional' | 'kaffarah_unintentional';
  timestamp: string;
  paymentDate: string;
  amount: number;
  peopleCount?: number;
  quantity?: number;
  amountPerItem?: number;
  year?: number;
}
