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
  QadaFastingState,
  QadaFastingHistory,
  FitriyaState,
  KaffarahState,
  FinancialHistory,
  EducationContentRecord,
  EducationTagRecord,
  DuaRecord,
  DuaTagRecord,
  CustomDhikrRecord,
} from '../types/db';
import {
  DEFAULT_EDUCATION_TAGS,
  DEFAULT_EDUCATION_CONTENTS,
  DEFAULT_DUA_TAGS,
  DEFAULT_DUAS_AND_AZKAR,
  DEFAULT_STANDARD_DHIKRS_LIST,
} from './defaultSeedData';

export * from './defaultSeedData';

export class MihrabDatabase extends Dexie {
  qadaPrayers!: Table<QadaPrayerRecord, number>;
  qadaHistory!: Table<QadaHistoryRecord, number>;
  fastingLogs!: Table<FastingRecord, number>;
  fitrLogs!: Table<FitrKaffaraRecord, number>;
  duaBookmarks!: Table<DuaBookmark, number>;
  educationBookmarks!: Table<EducationBookmark, number>;
  preferences!: Table<AppPreference, string>;
  backupHistory!: Table<BackupHistoryLog, number>;
  qadaFastingState!: Table<QadaFastingState, string>;
  qadaFastingHistory!: Table<QadaFastingHistory, number>;
  fitriyaState!: Table<FitriyaState, number>;
  kaffarahState!: Table<KaffarahState, string>;
  financialHistory!: Table<FinancialHistory, number>;
  educationContents!: Table<EducationContentRecord, number>;
  educationTags!: Table<EducationTagRecord, number>;
  duaContents!: Table<DuaRecord, number>;
  duaTags!: Table<DuaTagRecord, number>;
  customDhikrs!: Table<CustomDhikrRecord, number>;

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

    // Version 2 Schema
    this.version(2).stores({
      qadaFastingState: '&id',
      qadaFastingHistory: '++id, timestamp',
      fitriyaState: '&year',
      kaffarahState: '&id',
      financialHistory: '++id, type, timestamp',
    });

    // Version 3 Schema for Education & Rulings
    this.version(3).stores({
      educationContents: '++id, title, *tags, createdAt, updatedAt',
      educationTags: '++id, &name, createdAt',
    });

    // Version 4 Schema for Duas Library
    this.version(4).stores({
      duaContents: '++id, title, *tags, isFavorite, createdAt, updatedAt',
      duaTags: '++id, &name, createdAt',
    });

    // Version 5 Schema for Custom Dhikr and Tasbih Management
    this.version(5).stores({
      customDhikrs: '++id, key, title, isCustom, order, createdAt',
    });
  }

  // Helper method to seed initial database records on very first installation
  async seedInitialDataIfNeeded() {
    const isSeededPref = await this.preferences.get('hasInitialSeed');
    const isSeededLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('mihrab_initial_seed_done') : null;

    // If app has already been initialized, DO NOT overwrite or re-insert user deletions/wipes
    if (isSeededPref?.value === 'true' || isSeededLocal === 'true') {
      // Ensure fundamental 6 prayer slots exist only if table is completely missing records
      const prayerCount = await this.qadaPrayers.count();
      if (prayerCount === 0) {
        const now = new Date().toISOString();
        await this.qadaPrayers.bulkAdd([
          { prayerType: 'fajr', count: 0, completedCount: 0, updatedAt: now },
          { prayerType: 'dhuhr', count: 0, completedCount: 0, updatedAt: now },
          { prayerType: 'asr', count: 0, completedCount: 0, updatedAt: now },
          { prayerType: 'maghrib', count: 0, completedCount: 0, updatedAt: now },
          { prayerType: 'isha', count: 0, completedCount: 0, updatedAt: now },
          { prayerType: 'ayat', count: 0, completedCount: 0, updatedAt: now },
        ]);
      }
      return;
    }

    // FIRST EVER APP RUN (First Install)
    const now = new Date().toISOString();

    const prayerCount = await this.qadaPrayers.count();
    if (prayerCount === 0) {
      await this.qadaPrayers.bulkAdd([
        { prayerType: 'fajr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'dhuhr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'asr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'maghrib', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'isha', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'ayat', count: 0, completedCount: 0, updatedAt: now },
      ]);
    }

    const fastingState = await this.qadaFastingState.get('current');
    if (!fastingState) {
      await this.qadaFastingState.put({
        id: 'current',
        count: 0,
        updatedAt: now,
      });
    }

    // 1. Seed or sync Education Tags
    for (const name of DEFAULT_EDUCATION_TAGS) {
      const existing = await this.educationTags.where('name').equals(name).first();
      if (!existing) {
        await this.educationTags.add({ name, createdAt: now });
      }
    }

    // 2. Seed or sync Education Contents
    for (const item of DEFAULT_EDUCATION_CONTENTS) {
      const existing = await this.educationContents.where('title').equals(item.title).first();
      if (!existing) {
        await this.educationContents.add({
          ...item,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // 3. Seed or sync Dua Tags
    for (const name of DEFAULT_DUA_TAGS) {
      const existing = await this.duaTags.where('name').equals(name).first();
      if (!existing) {
        await this.duaTags.add({ name, createdAt: now });
      }
    }

    // 4. Seed or sync Duas, Ziyarats, and Azkar
    for (const item of DEFAULT_DUAS_AND_AZKAR) {
      const existing = await this.duaContents.where('title').equals(item.title).first();
      if (!existing) {
        await this.duaContents.add({
          ...item,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // 5. Seed or sync Standard Dhikrs for Tasbih & Counter
    for (const item of DEFAULT_STANDARD_DHIKRS_LIST) {
      if (item.key) {
        const existing = await this.customDhikrs.where('key').equals(item.key).first();
        if (!existing) {
          await this.customDhikrs.add({
            ...item,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // Mark as initialized and update app version
    await this.preferences.put({ key: 'hasInitialSeed', value: 'true', updatedAt: now });
    await this.preferences.put({ key: 'themeMode', value: 'system', updatedAt: now });
    await this.preferences.put({ key: 'appVersion', value: '3.1.8', updatedAt: now });
    await this.preferences.put({ key: 'installedAt', value: now, updatedAt: now });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mihrab_initial_seed_done', 'true');
    }
  }
}

// Single instance for the application
export const db = new MihrabDatabase();

// Initialize seeding on database open and whenever app starts
db.on('ready', () => {
  return db.seedInitialDataIfNeeded();
});

// Also trigger immediate check on module load to guarantee syncing
db.seedInitialDataIfNeeded().catch((err) => {
  console.warn('Initial data seeding background check:', err);
});
