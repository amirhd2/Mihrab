import { PendingChangeItem, ChangeCategory, ChangeActionType } from '../types/pendingChanges';
import { googleSyncService } from './googleSyncService';

const STORAGE_KEY = 'mihrab_pending_changes_log';
const EVENT_NAME = 'mihrab_pending_changes_updated';

export class PendingChangesService {
  /**
   * Retrieves all currently pending/unbacked changes
   */
  static getChanges(): PendingChangeItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Error reading pending changes:', err);
      return [];
    }
  }

  /**
   * Logs a new operation change with unique ID and current timestamp
   */
  static logChange(
    title: string,
    category: ChangeCategory,
    type: ChangeActionType = 'update',
    description?: string
  ): PendingChangeItem {
    const newItem: PendingChangeItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      description: description?.trim(),
      category,
      type,
      timestamp: new Date().toISOString(),
    };

    try {
      const current = this.getChanges();
      // Prepend so newest is at index 0, limit to maximum 100 entries to prevent memory overflow
      const updated = [newItem, ...current].slice(0, 100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      this.dispatchUpdateEvent();
      // Trigger background auto sync to Google Drive (Google Keep style)
      googleSyncService.triggerAutoSync();
    } catch (err) {
      console.error('Error saving pending change:', err);
    }

    return newItem;
  }

  /**
   * Removes a single change by ID
   */
  static removeChange(id: string): void {
    try {
      const current = this.getChanges();
      const filtered = current.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      this.dispatchUpdateEvent();
    } catch (err) {
      console.error('Error removing pending change:', err);
    }
  }

  /**
   * Clears/confirms all pending changes (resets counter to 0)
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.dispatchUpdateEvent();
    } catch (err) {
      console.error('Error clearing pending changes:', err);
    }
  }

  /**
   * Subscribes to pending changes state modifications across the app
   */
  static subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }

  private static dispatchUpdateEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  }
}
