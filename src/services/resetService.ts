import { db } from '../db/database';

export class ResetService {
  /**
   * Clears all user-generated records from IndexedDB tables
   * while keeping application code & re-seeding default database schemas with zero counts.
   */
  static async wipeAllUserData(): Promise<void> {
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
      db.backupHistory,
    ];

    await db.transaction('rw', allTables, async () => {
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
      await db.duaContents.clear();
      await db.duaTags.clear();
      await db.educationBookmarks.clear();
      await db.educationContents.clear();
      await db.educationTags.clear();
      await db.preferences.clear();
      await db.backupHistory.clear();

      // Re-seed initial default records so app functionality stays healthy with 0 counts
      await db.seedInitialDataIfNeeded();
    });

    localStorage.removeItem('mihrab_theme_mode');
  }
}
