import { db } from '../db/database';
import { MihrabBackupData, BackupValidationResult } from '../types/backup';

export class BackupService {
  /**
   * Exports all IndexedDB user data to a structured JSON object
   */
  static async exportData(): Promise<MihrabBackupData> {
    const qadaPrayers = await db.qadaPrayers.toArray();
    const qadaHistory = await db.qadaHistory.toArray();
    const qadaFastingState = await db.qadaFastingState.toArray();
    const qadaFastingHistory = await db.qadaFastingHistory.toArray();
    const fitriyaState = await db.fitriyaState.toArray();
    const kaffarahState = await db.kaffarahState.toArray();
    const financialHistory = await db.financialHistory.toArray();
    const fastingLogs = await db.fastingLogs.toArray();
    const fitrLogs = await db.fitrLogs.toArray();
    const duaBookmarks = await db.duaBookmarks.toArray();
    const duaContents = await db.duaContents.toArray();
    const duaTags = await db.duaTags.toArray();
    const educationBookmarks = await db.educationBookmarks.toArray();
    const educationContents = await db.educationContents.toArray();
    const educationTags = await db.educationTags.toArray();
    const preferences = await db.preferences.toArray();
    const customDhikrs = await db.customDhikrs.toArray();

    const backupData: MihrabBackupData = {
      version: 1,
      appName: 'Mihrab',
      exportedAt: new Date().toISOString(),
      data: {
        qadaPrayers,
        qadaHistory,
        qadaFastingState,
        qadaFastingHistory,
        fitriyaState,
        kaffarahState,
        financialHistory,
        fastingLogs,
        fitrLogs,
        duaBookmarks,
        duaContents,
        duaTags,
        educationBookmarks,
        educationContents,
        educationTags,
        preferences,
        customDhikrs,
      },
    };

    // Log export operation
    await db.backupHistory.add({
      timestamp: new Date().toISOString(),
      type: 'export',
      version: '1.0',
      status: 'success',
      details: `صادر شده با ${qadaPrayers.length} نماز قضا، ${customDhikrs.length} ذکر و ${preferences.length} تنظیمات`,
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

    const d = jsonObj.data;
    const qadaPrayers = Array.isArray(d.qadaPrayers) ? d.qadaPrayers : [];
    const fastingLogs = Array.isArray(d.fastingLogs) ? d.fastingLogs : [];
    const fitrLogs = Array.isArray(d.fitrLogs) ? d.fitrLogs : [];
    const duaBookmarks = Array.isArray(d.duaBookmarks) ? d.duaBookmarks : [];
    const educationBookmarks = Array.isArray(d.educationBookmarks) ? d.educationBookmarks : [];
    const preferences = Array.isArray(d.preferences) ? d.preferences : [];
    const customDhikrs = Array.isArray(d.customDhikrs) ? d.customDhikrs : [];

    return {
      isValid: true,
      version: jsonObj.version || 1,
      recordCounts: {
        qadaPrayers: qadaPrayers.length,
        fastingLogs: fastingLogs.length,
        fitrLogs: fitrLogs.length,
        duaBookmarks: duaBookmarks.length,
        educationBookmarks: educationBookmarks.length,
        preferences: preferences.length,
        customDhikrs: customDhikrs.length,
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
        // Clear current data tables safely
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
        await db.customDhikrs.clear();

        const d = backup.data;

        // Restore imported records using bulkPut (safe against primary key conflicts)
        if (d.qadaPrayers?.length) await db.qadaPrayers.bulkPut(d.qadaPrayers);
        if (d.qadaHistory?.length) await db.qadaHistory.bulkPut(d.qadaHistory);
        if (d.qadaFastingState?.length) await db.qadaFastingState.bulkPut(d.qadaFastingState);
        if (d.qadaFastingHistory?.length) await db.qadaFastingHistory.bulkPut(d.qadaFastingHistory);
        if (d.fitriyaState?.length) await db.fitriyaState.bulkPut(d.fitriyaState);
        if (d.kaffarahState?.length) await db.kaffarahState.bulkPut(d.kaffarahState);
        if (d.financialHistory?.length) await db.financialHistory.bulkPut(d.financialHistory);
        if (d.fastingLogs?.length) await db.fastingLogs.bulkPut(d.fastingLogs);
        if (d.fitrLogs?.length) await db.fitrLogs.bulkPut(d.fitrLogs);
        if (d.duaBookmarks?.length) await db.duaBookmarks.bulkPut(d.duaBookmarks);
        if (d.duaContents?.length) await db.duaContents.bulkPut(d.duaContents);
        if (d.duaTags?.length) await db.duaTags.bulkPut(d.duaTags);
        if (d.educationBookmarks?.length) await db.educationBookmarks.bulkPut(d.educationBookmarks);
        if (d.educationContents?.length) await db.educationContents.bulkPut(d.educationContents);
        if (d.educationTags?.length) await db.educationTags.bulkPut(d.educationTags);
        if (d.preferences?.length) await db.preferences.bulkPut(d.preferences);
        if (d.customDhikrs?.length) await db.customDhikrs.bulkPut(d.customDhikrs);

        // Ensure prayer seeding if needed
        await db.seedInitialDataIfNeeded();

        // Add history log
        await db.backupHistory.add({
          timestamp: new Date().toISOString(),
          type: 'import',
          version: String(backup.version || '1.0'),
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
