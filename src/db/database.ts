import Dexie, { Table } from 'dexie';
import {
  QadaPrayerRecord,
  QadaHistoryRecord,
  FastingRecord,
  FitrKaffaraRecord,
  DuaBookmark,
  EducationBookmark,
  AppPreference,
  BackupHistoryLog,
} from '../types/db';

export class MihrabDatabase extends Dexie {
  qadaPrayers!: Table<QadaPrayerRecord, number>;
  qadaHistory!: Table<QadaHistoryRecord, number>;
  fastingLogs!: Table<FastingRecord, number>;
  fitrLogs!: Table<FitrKaffaraRecord, number>;
  duaBookmarks!: Table<DuaBookmark, number>;
  educationBookmarks!: Table<EducationBookmark, number>;
  preferences!: Table<AppPreference, string>;
  backupHistory!: Table<BackupHistoryLog, number>;

  constructor() {
    super('MihrabDatabase');

    // Version 1 Schema
    this.version(1).stores({
      qadaPrayers: '++id, &prayerType, updatedAt',
      qadaHistory: '++id, prayerType, timestamp',
      fastingLogs: '++id, type, year, updatedAt',
      fitrLogs: '++id, type, isPaid, createdAt',
      duaBookmarks: '++id, &duaId, isFavorite',
      educationBookmarks: '++id, &articleId, category',
      preferences: '&key, updatedAt',
      backupHistory: '++id, timestamp, type, status',
    });
  }

  // Helper method to seed initial database records if empty
  async seedInitialDataIfNeeded() {
    const prayerCount = await this.qadaPrayers.count();
    if (prayerCount === 0) {
      const now = new Date().toISOString();
      await this.qadaPrayers.bulkAdd([
        { prayerType: 'fajr', count: 125, completedCount: 0, updatedAt: now },
        { prayerType: 'dhuhr', count: 98, completedCount: 0, updatedAt: now },
        { prayerType: 'asr', count: 76, completedCount: 0, updatedAt: now },
        { prayerType: 'maghrib', count: 64, completedCount: 0, updatedAt: now },
        { prayerType: 'isha', count: 55, completedCount: 0, updatedAt: now },
        { prayerType: 'ayat', count: 12, completedCount: 0, updatedAt: now },
      ]);
    } else {
      // Check if ayat prayer is missing in existing DB
      const ayat = await this.qadaPrayers.where('prayerType').equals('ayat').first();
      if (!ayat) {
        await this.qadaPrayers.add({
          prayerType: 'ayat',
          count: 12,
          completedCount: 0,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const prefCount = await this.preferences.count();
    if (prefCount === 0) {
      const now = new Date().toISOString();
      await this.preferences.bulkAdd([
        { key: 'themeMode', value: 'system', updatedAt: now },
        { key: 'appVersion', value: '1.0.0', updatedAt: now },
        { key: 'installedAt', value: now, updatedAt: now },
      ]);
    }
  }
}

// Single instance for the application
export const db = new MihrabDatabase();

// Initialize seeding on database open
db.on('ready', () => {
  return db.seedInitialDataIfNeeded();
});
