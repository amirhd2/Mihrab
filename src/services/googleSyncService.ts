import { BackupService } from './backupService';
import { db } from '../db/database';
import { MihrabBackupData } from '../types/backup';

export interface GoogleUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface GoogleSyncState {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
  errorMessage: string | null;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke: (accessToken: string, done?: () => void) => void;
        };
      };
    };
  }
}

const SYNC_FILE_NAME = 'mihrab_sync_data.json';
const LOCAL_STORAGE_LAST_SYNC = 'mihrab_google_last_sync';
const LOCAL_STORAGE_USER_PROFILE = 'mihrab_google_user_profile';
const LOCAL_STORAGE_TOKEN = 'mihrab_google_access_token';
const LOCAL_STORAGE_TOKEN_EXPIRY = 'mihrab_google_token_expiry';

import firebaseConfig from '../../firebase-applet-config.json';

// Google OAuth Client ID matching the authorized project
const OAUTH_CLIENT_ID =
  firebaseConfig.oAuthClientId ||
  '897340517747-f493nhnd91fsimdqnnee2gieaf59vpcj.apps.googleusercontent.com';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

class GoogleSyncService {
  private cachedAccessToken: string | null = null;
  private state: GoogleSyncState;
  private listeners: Set<(state: GoogleSyncState) => void> = new Set();
  private autoSyncTimeout: any = null;

  constructor() {
    let savedUser: GoogleUser | null = null;
    let savedToken: string | null = null;

    if (typeof localStorage !== 'undefined') {
      try {
        const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_PROFILE);
        if (storedUser) {
          savedUser = JSON.parse(storedUser);
        }

        const storedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN);
        const expiry = localStorage.getItem(LOCAL_STORAGE_TOKEN_EXPIRY);
        if (storedToken && expiry && Date.now() < parseInt(expiry, 10)) {
          savedToken = storedToken;
          this.cachedAccessToken = storedToken;
        }
      } catch (e) {
        console.error('Error parsing stored auth data:', e);
      }
    }

    this.state = {
      user: savedUser,
      isAuthenticated: !!savedUser,
      isSyncing: false,
      lastSyncTime:
        typeof localStorage !== 'undefined'
          ? localStorage.getItem(LOCAL_STORAGE_LAST_SYNC)
          : null,
      syncStatus: 'idle',
      errorMessage: null,
    };

    // Check if returning from Google OAuth redirect (hash params)
    this.handleOAuthCallback();
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

  private initNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      if (this.state.isAuthenticated && this.cachedAccessToken) {
        this.sync({ silent: true });
      }
    });

    window.addEventListener('focus', () => {
      if (this.state.isAuthenticated && this.cachedAccessToken && !this.state.isSyncing) {
        const last = this.state.lastSyncTime ? new Date(this.state.lastSyncTime).getTime() : 0;
        const now = Date.now();
        if (now - last > 5 * 60 * 1000) {
          this.sync({ silent: true });
        }
      }
    });
  }

  /**
   * Checks URL hash for token if returning from OAuth redirect flow
   */
  private async handleOAuthCallback() {
    if (typeof window === 'undefined') return;

    try {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');

        if (accessToken) {
          this.setToken(accessToken, expiresIn ? parseInt(expiresIn, 10) : 3600);

          // Clean URL hash without reload
          if (window.history && window.history.replaceState) {
            window.history.replaceState(
              null,
              document.title,
              window.location.pathname + window.location.search
            );
          }

          // Fetch user profile
          await this.fetchAndStoreUserProfile(accessToken);
          // Initial sync
          await this.sync({ silent: false, forcePull: true });
        }
      }
    } catch (e) {
      console.error('Error handling OAuth callback:', e);
    }
  }

  private setToken(token: string, expiresInSeconds: number = 3600) {
    this.cachedAccessToken = token;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_TOKEN, token);
        localStorage.setItem(
          LOCAL_STORAGE_TOKEN_EXPIRY,
          (Date.now() + (expiresInSeconds - 60) * 1000).toString()
        );
      } catch (e) {
        // ignore
      }
    }
  }

  private async fetchAndStoreUserProfile(token: string): Promise<GoogleUser> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const info = await res.json();
        const user: GoogleUser = {
          uid: info.sub || 'google_' + Date.now(),
          displayName: info.name || 'کاربر گوگل',
          email: info.email || '',
          photoURL: info.picture || null,
        };

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_USER_PROFILE, JSON.stringify(user));
        }

        this.updateState({
          user,
          isAuthenticated: true,
          errorMessage: null,
        });

        return user;
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    }

    const fallbackUser: GoogleUser = {
      uid: 'google_' + Date.now(),
      displayName: 'حساب کاربری گوگل',
      email: '',
      photoURL: null,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USER_PROFILE, JSON.stringify(fallbackUser));
    }

    this.updateState({
      user: fallbackUser,
      isAuthenticated: true,
    });

    return fallbackUser;
  }

  /**
   * Ensures Google Identity Services (GSI) script is loaded
   */
  private async ensureGsiLoaded(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.google?.accounts?.oauth2) return true;

    return new Promise((resolve) => {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval);
            resolve(true);
          } else if (attempts > 25) {
            clearInterval(interval);
            resolve(false);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  /**
   * Main Google Sign-In function:
   * Uses Google Identity Services (GSI) Token Client popup.
   * If popup is blocked (or in iOS standalone PWA), falls back cleanly to Google OAuth redirect URL.
   */
  public async signIn(): Promise<GoogleUser> {
    this.updateState({ isSyncing: true, syncStatus: 'syncing', errorMessage: null });

    const gsiLoaded = await this.ensureGsiLoaded();

    if (gsiLoaded && window.google?.accounts?.oauth2) {
      return new Promise<GoogleUser>((resolve, reject) => {
        try {
          const tokenClient = window.google!.accounts.oauth2.initTokenClient({
            client_id: OAUTH_CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                console.error('GSI token error:', tokenResponse);
                this.updateState({
                  isSyncing: false,
                  syncStatus: 'error',
                  errorMessage: 'ورود با حساب گوگل انجام نشد.',
                });
                reject(new Error(tokenResponse.error));
                return;
              }

              if (tokenResponse.access_token) {
                this.setToken(
                  tokenResponse.access_token,
                  tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3600
                );

                const user = await this.fetchAndStoreUserProfile(tokenResponse.access_token);
                await this.sync({ silent: false, forcePull: true });
                resolve(user);
              }
            },
            error_callback: (err: any) => {
              console.error('GSI error callback:', err);
              // If popup fails or is blocked on mobile, initiate direct OAuth redirect
              this.redirectToGoogleOAuth();
            },
          });

          tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (err: any) {
          console.error('Failed to request access token via GSI:', err);
          this.redirectToGoogleOAuth();
        }
      });
    } else {
      // Direct redirect fallback
      this.redirectToGoogleOAuth();
      return new Promise(() => {}); // page will redirect
    }
  }

  /**
   * Direct OAuth 2.0 redirect fallback to accounts.google.com
   * Never routes through firebaseapp.com, completely preventing "The requested action is invalid".
   */
  private redirectToGoogleOAuth() {
    if (typeof window === 'undefined') return;

    const redirectUri = window.location.origin + window.location.pathname;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      OAUTH_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(
      SCOPES
    )}&include_granted_scopes=true&prompt=consent`;

    window.location.href = oauthUrl;
  }

  public async signOut(): Promise<void> {
    try {
      if (this.cachedAccessToken && window.google?.accounts?.oauth2?.revoke) {
        try {
          window.google.accounts.oauth2.revoke(this.cachedAccessToken);
        } catch (e) {
          // ignore
        }
      }

      this.cachedAccessToken = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_USER_PROFILE);
        localStorage.removeItem(LOCAL_STORAGE_TOKEN);
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_EXPIRY);
      }

      this.updateState({
        user: null,
        isAuthenticated: false,
        isSyncing: false,
        syncStatus: 'idle',
        errorMessage: null,
      });
    } catch (err) {
      console.error('Google Sign-Out failed:', err);
      throw err;
    }
  }

  /**
   * Triggers a debounced background sync when data changes locally
   */
  public triggerAutoSync(debounceMs = 3000) {
    if (!this.state.isAuthenticated || !navigator.onLine) {
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
  public async sync(
    options: {
      silent?: boolean;
      forcePull?: boolean;
    } = {}
  ): Promise<{ success: boolean; message: string }> {
    if (!navigator.onLine) {
      this.updateState({ syncStatus: 'offline', isSyncing: false });
      return {
        success: false,
        message: 'دستگاه در حالت آفلاین است. داده‌ها پس از اتصال اینترنت همگام خواهند شد.',
      };
    }

    if (!this.state.isAuthenticated) {
      this.updateState({ isSyncing: false, syncStatus: 'idle' });
      return {
        success: false,
        message: 'ابتدا به حساب گوگل خود وارد شوید.',
      };
    }

    // Check token validity
    if (!this.cachedAccessToken) {
      const storedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN);
      const expiry = localStorage.getItem(LOCAL_STORAGE_TOKEN_EXPIRY);
      if (storedToken && expiry && Date.now() < parseInt(expiry, 10)) {
        this.cachedAccessToken = storedToken;
      }
    }

    if (!this.cachedAccessToken) {
      this.updateState({
        syncStatus: 'error',
        errorMessage: 'نشست کاربری نیازمند تمدید است. لطفاً یک‌بار روی ورود به گوگل کلیک کنید.',
      });
      return {
        success: false,
        message: 'اعتبار نشست گوگل پایان یافته است. لطفاً مجدداً وارد شوید.',
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
        message: 'همگام‌سازی با گوگل درایو با موفقیت انجام شد.',
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
   * Merges remote data with local IndexedDB records
   */
  private async mergeRemoteDataIntoLocal(remoteBackup: MihrabBackupData): Promise<void> {
    const d = remoteBackup.data;
    if (!d) return;

    await db.transaction(
      'rw',
      [
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
      ],
      async () => {
        // 1. Qada Prayers
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

        // 2. Qada History
        if (d.qadaHistory && Array.isArray(d.qadaHistory)) {
          const localHist = await db.qadaHistory.toArray();
          const existingKeys = new Set(localHist.map((h) => `${h.prayerType}_${h.timestamp}`));
          const newHist = d.qadaHistory.filter((h) => !existingKeys.has(`${h.prayerType}_${h.timestamp}`));
          if (newHist.length > 0) {
            await db.qadaHistory.bulkAdd(newHist.map(({ id, ...rest }) => rest as any));
          }
        }

        // 3. Fasting & Financial States
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

        // 6. Preferences
        if (d.preferences?.length) {
          for (const pref of d.preferences) {
            if (pref.key !== 'installedAt') {
              await db.preferences.put(pref);
            }
          }
        }
      }
    );
  }
}

export const googleSyncService = new GoogleSyncService();
