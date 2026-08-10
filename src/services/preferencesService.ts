import { db } from '../db/database';

export class PreferencesService {
  static async getPreference<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const record = await db.preferences.get(key);
      return record ? (record.value as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static async setPreference(key: string, value: any): Promise<void> {
    await db.preferences.put({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }
}
