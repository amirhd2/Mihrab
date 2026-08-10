import { db } from '../db/database';
import { MihrabBackupData, BackupValidationResult } from '../types/backup';

export class BackupService {
  /**
   * Exports all IndexedDB user data to a structured JSON object
   */
  static async exportData(): Promise<MihrabBackupData> {
    const qadaPrayers = await db.qadaPrayers.toArray();
    const qadaHistory = await db.qadaHistory.toArray();
    const fastingLogs = await db.fastingLogs.toArray();
    const fitrLogs = await db.fitrLogs.toArray();
    const duaBookmarks = await db.duaBookmarks.toArray();
    const educationBookmarks = await db.educationBookmarks.toArray();
    const preferences = await db.preferences.toArray();

    const backupData: MihrabBackupData = {
      version: 1,
      appName: 'Mihrab',
      exportedAt: new Date().toISOString(),
      data: {
        qadaPrayers,
        qadaHistory,
        fastingLogs,
        fitrLogs,
        duaBookmarks,
        educationBookmarks,
        preferences,
      },
    };

    // Log export operation
    await db.backupHistory.add({
      timestamp: new Date().toISOString(),
      type: 'export',
      version: '1.0',
      status: 'success',
      details: `صادر شده با ${qadaPrayers.length} نماز قضا و ${preferences.length} تنظیمات`,
    });

    return backupData;
  }

  /**
   * Validates a JSON backup file object before restoring
   */
  static validateBackup(jsonObj: any): BackupValidationResult {
    if (!jsonObj || typeof jsonObj !== 'object') {
      return { isValid: false, errorMessageFa: 'فایل وارد شده نامعتبر است یا فرمت JSON صحیح ندارد.' };
    }

    if (jsonObj.appName !== 'Mihrab') {
      return { isValid: false, errorMessageFa: 'فایل انتخاب شده مربوط به برنامه محراب نمی‌باشد.' };
    }

    if (!jsonObj.data || typeof jsonObj.data !== 'object') {
      return { isValid: false, errorMessageFa: 'ساختار داده‌های پشتیبان ناقص است.' };
    }

    const { qadaPrayers, fastingLogs, fitrLogs, duaBookmarks, educationBookmarks, preferences } = jsonObj.data;

    return {
      isValid: true,
      version: jsonObj.version || 1,
      recordCounts: {
        qadaPrayers: Array.isArray(qadaPrayers) ? qadaPrayers.length : 0,
        fastingLogs: Array.isArray(fastingLogs) ? fastingLogs.length : 0,
        fitrLogs: Array.isArray(fitrLogs) ? fitrLogs.length : 0,
        duaBookmarks: Array.isArray(duaBookmarks) ? duaBookmarks.length : 0,
        educationBookmarks: Array.isArray(educationBookmarks) ? educationBookmarks.length : 0,
        preferences: Array.isArray(preferences) ? preferences.length : 0,
      },
    };
  }

  /**
   * Safely imports validated backup data into IndexedDB
   */
  static async importData(backup: MihrabBackupData): Promise<boolean> {
    try {
      const validation = this.validateBackup(backup);
      if (!validation.isValid) {
        throw new Error(validation.errorMessageFa || 'پشتیبان نامعتبر است.');
      }

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
        // Clear current data tables safely
        await db.qadaPrayers.clear();
        await db.qadaHistory.clear();
        await db.fastingLogs.clear();
        await db.fitrLogs.clear();
        await db.duaBookmarks.clear();
        await db.educationBookmarks.clear();
        await db.preferences.clear();

        // Restore imported records
        if (backup.data.qadaPrayers?.length) await db.qadaPrayers.bulkAdd(backup.data.qadaPrayers);
        if (backup.data.qadaHistory?.length) await db.qadaHistory.bulkAdd(backup.data.qadaHistory);
        if (backup.data.fastingLogs?.length) await db.fastingLogs.bulkAdd(backup.data.fastingLogs);
        if (backup.data.fitrLogs?.length) await db.fitrLogs.bulkAdd(backup.data.fitrLogs);
        if (backup.data.duaBookmarks?.length) await db.duaBookmarks.bulkAdd(backup.data.duaBookmarks);
        if (backup.data.educationBookmarks?.length) await db.educationBookmarks.bulkAdd(backup.data.educationBookmarks);
        if (backup.data.preferences?.length) await db.preferences.bulkAdd(backup.data.preferences);

        // Ensure prayer seeding if needed
        await db.seedInitialDataIfNeeded();

        // Add history log
        await db.backupHistory.add({
          timestamp: new Date().toISOString(),
          type: 'import',
          version: String(backup.version),
          status: 'success',
          details: 'بازیابی موفقیت‌آمیز داده‌ها',
        });
      });

      return true;
    } catch (err: any) {
      console.error('Import backup failed:', err);
      await db.backupHistory.add({
        timestamp: new Date().toISOString(),
        type: 'import',
        version: '1.0',
        status: 'failed',
        details: err?.message || 'خطا در بازیابی پشتیبان',
      });
      throw err;
    }
  }
}
