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
