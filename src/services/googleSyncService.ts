import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { BackupService } from './backupService';
import { db } from '../db/database';
import { MihrabBackupData } from '../types/backup';

export interface GoogleSyncState {
  user: User | null;
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
  errorMessage: string | null;
}

const SYNC_FILE_NAME = 'mihrab_sync_data.json';
const LOCAL_STORAGE_LAST_SYNC = 'mihrab_google_last_sync';
const LOCAL_STORAGE_AUTH_HINT = 'mihrab_google_auth_connected';

class GoogleSyncService {
  private auth;
  private provider: GoogleAuthProvider;
  private cachedAccessToken: string | null = null;
  private state: GoogleSyncState = {
    user: null,
    isAuthenticated: false,
    isSyncing: false,
    lastSyncTime: typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_LAST_SYNC) : null,
    syncStatus: 'idle',
    errorMessage: null,
  };
  private listeners: Set<(state: GoogleSyncState) => void> = new Set();
  private autoSyncTimeout: any = null;
  private isInitialized = false;

  constructor() {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    this.provider = new GoogleAuthProvider();
    this.provider.addScope('https://www.googleapis.com/auth/drive.appdata');
    this.provider.addScope('https://www.googleapis.com/auth/drive.file');

    this.initAuthListener();
    this.initNetworkListeners();
  }

  private updateState(partial: Partial<GoogleSyncState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error in GoogleSync listener:', err);
      }
    });
  }

  public subscribe(listener: (state: GoogleSyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): GoogleSyncState {
    return this.state;
  }

  public getAccessToken(): string | null {
    return this.cachedAccessToken;
  }

  private initAuthListener() {
    onAuthStateChanged(this.auth, async (user) => {
      this.isInitialized = true;
      if (user) {
        this.updateState({
          user,
          isAuthenticated: true,
          errorMessage: null,
        });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_AUTH_HINT, 'true');
        }
        // If we have an access token or user just loaded, perform background auto sync
        if (this.cachedAccessToken && navigator.onLine) {
          this.sync({ silent: true });
        }
      } else {
        this.cachedAccessToken = null;
        this.updateState({
          user: null,
          isAuthenticated: false,
          isSyncing: false,
          syncStatus: 'idle',
        });
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(LOCAL_STORAGE_AUTH_HINT);
        }
      }
    });
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      if (this.state.isAuthenticated && this.cachedAccessToken) {
        this.sync({ silent: true });
      }
    });

    window.addEventListener('focus', () => {
      if (this.state.isAuthenticated && this.cachedAccessToken && !this.state.isSyncing) {
        // Auto-check on tab focus if more than 5 minutes since last sync
        const last = this.state.lastSyncTime ? new Date(this.state.lastSyncTime).getTime() : 0;
        const now = Date.now();
        if (now - last > 5 * 60 * 1000) {
          this.sync({ silent: true });
        }
      }
    });
  }

  public async signIn(): Promise<User> {
    try {
      this.updateState({ isSyncing: true, syncStatus: 'syncing', errorMessage: null });
      const result = await signInWithPopup(this.auth, this.provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential?.accessToken) {
        this.cachedAccessToken = credential.accessToken;
      }

      this.updateState({
        user: result.user,
        isAuthenticated: true,
        isSyncing: false,
        syncStatus: 'idle',
      });

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_AUTH_HINT, 'true');
      }

      // Trigger first sync immediately after login
      await this.sync({ silent: false, forcePull: true });

      return result.user;
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      const message = err?.message || 'ورود به حساب گوگل با خطا مواجه شد';
      this.updateState({
        isSyncing: false,
        syncStatus: 'error',
        errorMessage: message,
      });
      throw err;
    }
  }

  public async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.cachedAccessToken = null;
      this.updateState({
        user: null,
        isAuthenticated: false,
        isSyncing: false,
        syncStatus: 'idle',
        errorMessage: null,
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_AUTH_HINT);
      }
    } catch (err) {
      console.error('Google Sign-Out failed:', err);
      throw err;
    }
  }

  /**
   * Triggers a debounced background sync when data changes locally (Google Keep style)
   */
  public triggerAutoSync(debounceMs = 3000) {
    if (!this.state.isAuthenticated || !this.cachedAccessToken || !navigator.onLine) {
      return;
    }

    if (this.autoSyncTimeout) {
      clearTimeout(this.autoSyncTimeout);
    }

    this.autoSyncTimeout = setTimeout(() => {
      this.sync({ silent: true });
    }, debounceMs);
  }

  /**
   * Main sync function: Downloads remote Drive backup, merges with local Dexie data, and uploads snapshot
   */
  public async sync(options: {
    silent?: boolean;
    forcePull?: boolean;
  } = {}): Promise<{ success: boolean; message: string }> {
    if (!navigator.onLine) {
      this.updateState({ syncStatus: 'offline', isSyncing: false });
      return {
        success: false,
        message: 'دستگاه در حالت آفلاین است. داده‌ها پس از برقراری اینترنت همگام می‌شوند.',
      };
    }

    if (!this.state.isAuthenticated) {
      this.updateState({ isSyncing: false, syncStatus: 'idle' });
      return {
        success: false,
        message: 'ابتدا به حساب گوگل خود وارد شوید.',
      };
    }

    if (!this.cachedAccessToken) {
      // Try to re-prompt or silently request if possible
      this.updateState({
        syncStatus: 'error',
        errorMessage: 'توکن دسترسی گوگل منقضی شده است. لطفاً مجدداً وارد شوید.',
      });
      return {
        success: false,
        message: 'نشست کاربری منقضی شده است. لطفاً مجدداً وارد شوید.',
      };
    }

    try {
      this.updateState({ isSyncing: true, syncStatus: 'syncing', errorMessage: null });

      // Step 1: Find existing sync file in Google Drive AppData folder
      const file = await this.findDriveSyncFile(this.cachedAccessToken);

      // Step 2: If file exists, download and merge
      if (file && file.id) {
        const remoteData = await this.downloadDriveFile(this.cachedAccessToken, file.id);
        if (remoteData && remoteData.appName === 'Mihrab' && remoteData.data) {
          await this.mergeRemoteDataIntoLocal(remoteData);
        }
      }

      // Step 3: Export current updated snapshot
      const currentSnapshot = await BackupService.exportData();

      // Step 4: Upload snapshot to Drive AppData folder
      if (file && file.id) {
        await this.updateDriveFile(this.cachedAccessToken, file.id, currentSnapshot);
      } else {
        await this.createDriveFile(this.cachedAccessToken, currentSnapshot);
      }

      const syncTime = new Date().toISOString();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_LAST_SYNC, syncTime);
      }

      this.updateState({
        isSyncing: false,
        syncStatus: 'success',
        lastSyncTime: syncTime,
        errorMessage: null,
      });

      return {
        success: true,
        message: 'همگام‌سازی با حساب گوگل با موفقیت انجام شد.',
      };
    } catch (err: any) {
      console.error('Google Drive Sync error:', err);
      const isAuthError = err?.status === 401 || err?.message?.includes('401');
      const errorMsg = isAuthError
        ? 'اعتبار نشست گوگل پایان یافته است. لطفاً مجدداً وارد شوید.'
        : 'خطا در برقراری ارتباط با گوگل درایو.';

      this.updateState({
        isSyncing: false,
        syncStatus: 'error',
        errorMessage: errorMsg,
      });

      return {
        success: false,
        message: errorMsg,
      };
    }
  }

  private async findDriveSyncFile(token: string): Promise<{ id: string; name: string } | null> {
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${SYNC_FILE_NAME}'+and+trashed=false&fields=files(id,name,modifiedTime)`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      const err: any = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    if (!res.ok) {
      throw new Error(`Failed to query Drive: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  }

  private async downloadDriveFile(token: string, fileId: string): Promise<MihrabBackupData | null> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn(`Failed to download Drive file: ${res.statusText}`);
      return null;
    }

    return await res.json();
  }

  private async createDriveFile(token: string, data: MihrabBackupData): Promise<void> {
    const boundary = '-------mihrab_boundary_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: SYNC_FILE_NAME,
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(data) +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      throw new Error(`Failed to create file in Drive: ${res.statusText}`);
    }
  }

  private async updateDriveFile(token: string, fileId: string, data: MihrabBackupData): Promise<void> {
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update Drive file: ${res.statusText}`);
    }
  }

  /**
   * Intelligently merges remote backup data with local IndexedDB records
   */
  private async mergeRemoteDataIntoLocal(remoteBackup: MihrabBackupData): Promise<void> {
    const d = remoteBackup.data;
    if (!d) return;

    await db.transaction('rw', [
      db.qadaPrayers,
      db.qadaHistory,
      db.qadaFastingState,
      db.qadaFastingHistory,
      db.fitriyaState,
      db.kaffarahState,
      db.financialHistory,
      db.fastingLogs,
      db.fitrLogs,
      db.duaBookmarks,
      db.duaContents,
      db.duaTags,
      db.educationBookmarks,
      db.educationContents,
      db.educationTags,
      db.preferences,
      db.customDhikrs,
    ], async () => {
      // 1. Qada Prayers (Compare updatedAt timestamps per prayer type)
      if (d.qadaPrayers && Array.isArray(d.qadaPrayers)) {
        const localPrayers = await db.qadaPrayers.toArray();
        const localMap = new Map(localPrayers.map((p) => [p.prayerType, p]));

        for (const remotePrayer of d.qadaPrayers) {
          const local = localMap.get(remotePrayer.prayerType);
          if (!local) {
            await db.qadaPrayers.put(remotePrayer);
          } else {
            const remoteTime = remotePrayer.updatedAt ? new Date(remotePrayer.updatedAt).getTime() : 0;
            const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
            if (remoteTime > localTime) {
              await db.qadaPrayers.put({ ...remotePrayer, id: local.id });
            }
          }
        }
      }

      // 2. Qada History (Deduplicate by timestamp and prayerType)
      if (d.qadaHistory && Array.isArray(d.qadaHistory)) {
        const localHist = await db.qadaHistory.toArray();
        const existingKeys = new Set(localHist.map((h) => `${h.prayerType}_${h.timestamp}`));
        const newHist = d.qadaHistory.filter((h) => !existingKeys.has(`${h.prayerType}_${h.timestamp}`));
        if (newHist.length > 0) {
          // Add without fixed IDs to let auto-increment handle safely
          await db.qadaHistory.bulkAdd(newHist.map(({ id, ...rest }) => rest as any));
        }
      }

      // 3. Fasting & Financial States (Merge by ID/Year with latest updatedAt)
      if (d.qadaFastingState?.length) {
        for (const rState of d.qadaFastingState) {
          const local = await db.qadaFastingState.get(rState.id);
          if (!local || (rState.updatedAt && (!local.updatedAt || new Date(rState.updatedAt) > new Date(local.updatedAt)))) {
            await db.qadaFastingState.put(rState);
          }
        }
      }

      if (d.fitriyaState?.length) {
        for (const rState of d.fitriyaState) {
          const local = await db.fitriyaState.get(rState.year);
          if (!local || (rState.updatedAt && (!local.updatedAt || new Date(rState.updatedAt) > new Date(local.updatedAt)))) {
            await db.fitriyaState.put(rState);
          }
        }
      }

      if (d.kaffarahState?.length) {
        for (const rState of d.kaffarahState) {
          const local = await db.kaffarahState.get(rState.id);
          if (!local || (rState.updatedAt && (!local.updatedAt || new Date(rState.updatedAt) > new Date(local.updatedAt)))) {
            await db.kaffarahState.put(rState);
          }
        }
      }

      // 4. Financial & Fasting History logs
      if (d.financialHistory?.length) {
        const local = await db.financialHistory.toArray();
        const keys = new Set(local.map((f) => `${f.type}_${f.timestamp}`));
        const toAdd = d.financialHistory.filter((f) => !keys.has(`${f.type}_${f.timestamp}`));
        if (toAdd.length > 0) {
          await db.financialHistory.bulkAdd(toAdd.map(({ id, ...rest }) => rest as any));
        }
      }

      if (d.qadaFastingHistory?.length) {
        const local = await db.qadaFastingHistory.toArray();
        const keys = new Set(local.map((f) => f.timestamp));
        const toAdd = d.qadaFastingHistory.filter((f) => !keys.has(f.timestamp));
        if (toAdd.length > 0) {
          await db.qadaFastingHistory.bulkAdd(toAdd.map(({ id, ...rest }) => rest as any));
        }
      }

      // 5. Duas & Education Bookmarks/Contents
      if (d.duaBookmarks?.length) {
        for (const b of d.duaBookmarks) {
          await db.duaBookmarks.put(b);
        }
      }

      if (d.educationBookmarks?.length) {
        for (const b of d.educationBookmarks) {
          await db.educationBookmarks.put(b);
        }
      }

      if (d.customDhikrs?.length) {
        for (const c of d.customDhikrs) {
          await db.customDhikrs.put(c);
        }
      }

      // 6. Preferences (Exclude local-only sync keys)
      if (d.preferences?.length) {
        for (const pref of d.preferences) {
          if (pref.key !== 'installedAt') {
            await db.preferences.put(pref);
          }
        }
      }
    });
  }
}

export const googleSyncService = new GoogleSyncService();
