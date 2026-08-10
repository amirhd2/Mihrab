import { db } from '../db/database';

export class ResetService {
  /**
   * Clears all user-generated records from IndexedDB tables
   * while keeping application code & re-seeding default database schemas.
   */
  static async wipeAllUserData(): Promise<void> {
    await db.transaction('rw', [
      db.qadaPrayers,
      db.qadaHistory,
      db.fastingLogs,
      db.fitrLogs,
      db.duaBookmarks,
      db.educationBookmarks,
      db.preferences,
      db.backupHistory,
    ], async () => {
      await db.qadaPrayers.clear();
      await db.qadaHistory.clear();
      await db.fastingLogs.clear();
      await db.fitrLogs.clear();
      await db.duaBookmarks.clear();
      await db.educationBookmarks.clear();
      await db.preferences.clear();
      await db.backupHistory.clear();

      // Re-seed initial default records so app functionality stays healthy
      await db.seedInitialDataIfNeeded();
    });

    // Optionally reset localStorage theme or cache preferences if necessary
    localStorage.removeItem('mihrab_theme_mode');
  }
}
