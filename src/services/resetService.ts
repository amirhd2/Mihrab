import {
  db,
  DEFAULT_EDUCATION_TAGS,
  DEFAULT_EDUCATION_CONTENTS,
  DEFAULT_DUA_TAGS,
  DEFAULT_DUAS_AND_AZKAR,
  DEFAULT_STANDARD_DHIKRS_LIST,
} from '../db/database';
import { PendingChangesService } from './pendingChangesService';

export interface RestoreDefaultOptions {
  restoreDuas?: boolean;
  restoreAhkam?: boolean;
  restoreDhikrs?: boolean;
}

export interface RestoreDefaultResult {
  duasCount: number;
  educationCount: number;
  dhikrsCount: number;
  restoredLabels: string[];
}

export class ResetService {
  /**
   * Clears all user-generated records, logs, history, AND completely wipes
   * all content from the Dua and Education (Ahkam) pages as well as custom dhikrs.
   * Leaves prayer slots and fasting counters cleanly initialized at zero.
   */
  static async wipeAllUserData(): Promise<void> {
    const now = new Date().toISOString();

    const allTables = [
      db.qadaPrayers,
      db.qadaHistory,
      db.fastingLogs,
      db.fitrLogs,
      db.qadaFastingState,
      db.qadaFastingHistory,
      db.fitriyaState,
      db.kaffarahState,
      db.financialHistory,
      db.duaBookmarks,
      db.duaContents,
      db.duaTags,
      db.educationBookmarks,
      db.educationContents,
      db.educationTags,
      db.preferences,
      db.customDhikrs,
      db.backupHistory,
    ];

    await db.transaction('rw', allTables, async () => {
      // 1. Clear user progress & transaction tables
      await db.qadaPrayers.clear();
      await db.qadaHistory.clear();
      await db.fastingLogs.clear();
      await db.fitrLogs.clear();
      await db.qadaFastingState.clear();
      await db.qadaFastingHistory.clear();
      await db.fitriyaState.clear();
      await db.kaffarahState.clear();
      await db.financialHistory.clear();
      await db.duaBookmarks.clear();
      await db.educationBookmarks.clear();
      await db.backupHistory.clear();
      await db.preferences.clear();

      // 2. Completely CLEAR all Dua, Education & Dhikr tables
      await db.duaContents.clear();
      await db.duaTags.clear();
      await db.educationContents.clear();
      await db.educationTags.clear();
      await db.customDhikrs.clear();

      // 3. Re-seed clean zero-state prayer slots
      await db.qadaPrayers.bulkAdd([
        { prayerType: 'fajr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'dhuhr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'asr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'maghrib', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'isha', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'ayat', count: 0, completedCount: 0, updatedAt: now },
      ]);

      // 4. Re-seed clean zero-state fasting state
      await db.qadaFastingState.put({
        id: 'current',
        count: 0,
        updatedAt: now,
      });

      // 5. Re-seed default app preferences and mark as initialized
      await db.preferences.bulkAdd([
        { key: 'hasInitialSeed', value: 'true', updatedAt: now },
        { key: 'themeMode', value: 'system', updatedAt: now },
        { key: 'appVersion', value: '3.1.8', updatedAt: now },
        { key: 'installedAt', value: now, updatedAt: now },
      ]);
    });

    // 6. Clear LocalStorage keys and preserve seed status
    try {
      localStorage.removeItem('mihrab_daily_dhikr_target');
      PendingChangesService.clearAll();

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('mihrab_daily_dhikr_')) {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem('mihrab_initial_seed_done', 'true');

      // 7. Dispatch system sync events to notify any active components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mihrab_daily_dhikr_sync', { detail: { count: 0 } }));
        window.dispatchEvent(new CustomEvent('mihrab_data_reset'));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.warn('LocalStorage wipe cleanup warning:', e);
    }
  }

  /**
   * Helper to restore / load selected default Islamic contents (Duas, Ahkam, and standard dhikrs)
   * on user demand.
   */
  static async restoreDefaultContent(options: RestoreDefaultOptions = {
    restoreDuas: true,
    restoreAhkam: true,
    restoreDhikrs: true,
  }): Promise<RestoreDefaultResult> {
    const now = new Date().toISOString();
    const shouldRestoreDuas = options.restoreDuas !== false;
    const shouldRestoreAhkam = options.restoreAhkam !== false;
    const shouldRestoreDhikrs = options.restoreDhikrs !== false;

    const tablesToLock = [];
    if (shouldRestoreDuas) {
      tablesToLock.push(db.duaContents, db.duaTags);
    }
    if (shouldRestoreAhkam) {
      tablesToLock.push(db.educationContents, db.educationTags);
    }
    if (shouldRestoreDhikrs) {
      tablesToLock.push(db.customDhikrs);
    }

    if (tablesToLock.length === 0) {
      return {
        duasCount: 0,
        educationCount: 0,
        dhikrsCount: 0,
        restoredLabels: [],
      };
    }

    let addedDuas = 0;
    let addedAhkam = 0;
    let addedDhikrs = 0;
    const restoredLabels: string[] = [];

    await db.transaction('rw', tablesToLock, async () => {
      // 1. Education tags & contents (Ahkam)
      if (shouldRestoreAhkam) {
        for (const name of DEFAULT_EDUCATION_TAGS) {
          const existing = await db.educationTags.where('name').equals(name).first();
          if (!existing) {
            await db.educationTags.add({ name, createdAt: now });
          }
        }
        for (const item of DEFAULT_EDUCATION_CONTENTS) {
          const existing = await db.educationContents.where('title').equals(item.title).first();
          if (!existing) {
            await db.educationContents.add({
              ...item,
              createdAt: now,
              updatedAt: now,
            });
            addedAhkam++;
          }
        }
        restoredLabels.push('احکام و آموزش');
      }

      // 2. Dua tags & contents (Duas & Ziyarats)
      if (shouldRestoreDuas) {
        for (const name of DEFAULT_DUA_TAGS) {
          const existing = await db.duaTags.where('name').equals(name).first();
          if (!existing) {
            await db.duaTags.add({ name, createdAt: now });
          }
        }
        for (const item of DEFAULT_DUAS_AND_AZKAR) {
          const existing = await db.duaContents.where('title').equals(item.title).first();
          if (!existing) {
            await db.duaContents.add({
              ...item,
              createdAt: now,
              updatedAt: now,
            });
            addedDuas++;
          }
        }
        restoredLabels.push('ادعیه و زیارات');
      }

      // 3. Standard dhikrs (Dhikrs & Tasbih)
      if (shouldRestoreDhikrs) {
        for (const item of DEFAULT_STANDARD_DHIKRS_LIST) {
          const existing = await db.customDhikrs
            .filter(d => (item.key && d.key === item.key) || d.title === item.title)
            .first();
          
          if (!existing) {
            await db.customDhikrs.add({
              ...item,
              createdAt: now,
              updatedAt: now,
            });
            addedDhikrs++;
          }
        }
        restoredLabels.push('اذکار و تسبیح');
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mihrab_data_reset'));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      duasCount: addedDuas,
      educationCount: addedAhkam,
      dhikrsCount: addedDhikrs,
      restoredLabels,
    };
  }
}
