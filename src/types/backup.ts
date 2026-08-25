import {
  QadaPrayerRecord,
  QadaHistoryRecord,
  FastingRecord,
  FitrKaffaraRecord,
  DuaBookmark,
  EducationBookmark,
  AppPreference,
  EducationContentRecord,
  EducationTagRecord,
  QadaFastingState,
  QadaFastingHistory,
  FitriyaState,
  KaffarahState,
  FinancialHistory,
  DuaRecord,
  DuaTagRecord,
  CustomDhikrRecord,
} from './db';

export interface MihrabBackupData {
  version: number;
  appName: 'Mihrab';
  exportedAt: string;
  data: {
    qadaPrayers?: QadaPrayerRecord[];
    qadaHistory?: QadaHistoryRecord[];
    qadaFastingState?: QadaFastingState[];
    qadaFastingHistory?: QadaFastingHistory[];
    fitriyaState?: FitriyaState[];
    kaffarahState?: KaffarahState[];
    financialHistory?: FinancialHistory[];
    fastingLogs?: FastingRecord[];
    fitrLogs?: FitrKaffaraRecord[];
    duaBookmarks?: DuaBookmark[];
    duaContents?: DuaRecord[];
    duaTags?: DuaTagRecord[];
    educationBookmarks?: EducationBookmark[];
    educationContents?: EducationContentRecord[];
    educationTags?: EducationTagRecord[];
    preferences?: AppPreference[];
    customDhikrs?: CustomDhikrRecord[];
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
    customDhikrs?: number;
  };
  errorMessageFa?: string;
}
