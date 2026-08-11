import { QadaPrayerRecord, QadaHistoryRecord, FastingRecord, FitrKaffaraRecord, DuaBookmark, EducationBookmark, AppPreference, EducationContentRecord, EducationTagRecord } from './db';

export interface MihrabBackupData {
  version: number;
  appName: 'Mihrab';
  exportedAt: string;
  data: {
    qadaPrayers: QadaPrayerRecord[];
    qadaHistory?: QadaHistoryRecord[];
    fastingLogs: FastingRecord[];
    fitrLogs: FitrKaffaraRecord[];
    duaBookmarks: DuaBookmark[];
    educationBookmarks: EducationBookmark[];
    educationContents?: EducationContentRecord[];
    educationTags?: EducationTagRecord[];
    preferences: AppPreference[];
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  version?: number;
  recordCounts?: {
    qadaPrayers: number;
    fastingLogs: number;
    fitrLogs: number;
    duaBookmarks: number;
    educationBookmarks: number;
    preferences: number;
  };
  errorMessageFa?: string;
}
