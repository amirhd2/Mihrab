import Dexie, { Table } from 'dexie';
import {
  QadaPrayerRecord,
  QadaHistoryRecord,
  FastingRecord,
  FitrKaffaraRecord,
  DuaBookmark,
  EducationBookmark,
  AppPreference,
  BackupHistoryLog,
  QadaFastingState,
  QadaFastingHistory,
  FitriyaState,
  KaffarahState,
  FinancialHistory,
  EducationContentRecord,
  EducationTagRecord,
  DuaRecord,
  DuaTagRecord,
} from '../types/db';

export class MihrabDatabase extends Dexie {
  qadaPrayers!: Table<QadaPrayerRecord, number>;
  qadaHistory!: Table<QadaHistoryRecord, number>;
  fastingLogs!: Table<FastingRecord, number>;
  fitrLogs!: Table<FitrKaffaraRecord, number>;
  duaBookmarks!: Table<DuaBookmark, number>;
  educationBookmarks!: Table<EducationBookmark, number>;
  preferences!: Table<AppPreference, string>;
  backupHistory!: Table<BackupHistoryLog, number>;
  qadaFastingState!: Table<QadaFastingState, string>;
  qadaFastingHistory!: Table<QadaFastingHistory, number>;
  fitriyaState!: Table<FitriyaState, number>;
  kaffarahState!: Table<KaffarahState, string>;
  financialHistory!: Table<FinancialHistory, number>;
  educationContents!: Table<EducationContentRecord, number>;
  educationTags!: Table<EducationTagRecord, number>;
  duaContents!: Table<DuaRecord, number>;
  duaTags!: Table<DuaTagRecord, number>;

  constructor() {
    super('MihrabDatabase');

    // Version 1 Schema
    this.version(1).stores({
      qadaPrayers: '++id, &prayerType, updatedAt',
      qadaHistory: '++id, prayerType, timestamp',
      fastingLogs: '++id, type, year, updatedAt',
      fitrLogs: '++id, type, isPaid, createdAt',
      duaBookmarks: '++id, &duaId, isFavorite',
      educationBookmarks: '++id, &articleId, category',
      preferences: '&key, updatedAt',
      backupHistory: '++id, timestamp, type, status',
    });

    // Version 2 Schema
    this.version(2).stores({
      qadaFastingState: '&id',
      qadaFastingHistory: '++id, timestamp',
      fitriyaState: '&year',
      kaffarahState: '&id',
      financialHistory: '++id, type, timestamp',
    });

    // Version 3 Schema for Education & Rulings
    this.version(3).stores({
      educationContents: '++id, title, *tags, createdAt, updatedAt',
      educationTags: '++id, &name, createdAt',
    });

    // Version 4 Schema for Duas Library
    this.version(4).stores({
      duaContents: '++id, title, *tags, isFavorite, createdAt, updatedAt',
      duaTags: '++id, &name, createdAt',
    });
  }

  // Helper method to seed initial database records if empty
  async seedInitialDataIfNeeded() {
    const prayerCount = await this.qadaPrayers.count();
    if (prayerCount === 0) {
      const now = new Date().toISOString();
      await this.qadaPrayers.bulkAdd([
        { prayerType: 'fajr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'dhuhr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'asr', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'maghrib', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'isha', count: 0, completedCount: 0, updatedAt: now },
        { prayerType: 'ayat', count: 0, completedCount: 0, updatedAt: now },
      ]);
    } else {
      // Check if ayat prayer is missing in existing DB
      const ayat = await this.qadaPrayers.where('prayerType').equals('ayat').first();
      if (!ayat) {
        await this.qadaPrayers.add({
          prayerType: 'ayat',
          count: 0,
          completedCount: 0,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const fastingState = await this.qadaFastingState.get('current');
    if (!fastingState) {
      await this.qadaFastingState.put({
        id: 'current',
        count: 0,
        updatedAt: new Date().toISOString(),
      });
    }

    const prefCount = await this.preferences.count();
    if (prefCount === 0) {
      const now = new Date().toISOString();
      await this.preferences.bulkAdd([
        { key: 'themeMode', value: 'system', updatedAt: now },
        { key: 'appVersion', value: '1.2.0', updatedAt: now },
        { key: 'installedAt', value: now, updatedAt: now },
      ]);
    }

    // Seed default tags and education content if empty
    const tagCount = await this.educationTags.count();
    if (tagCount === 0) {
      const now = new Date().toISOString();
      const defaultTags = ['احکام', 'وضو', 'نماز', 'روزه', 'آموزش', 'اذکار'];
      for (const name of defaultTags) {
        await this.educationTags.add({ name, createdAt: now });
      }
    }

    const contentCount = await this.educationContents.count();
    if (contentCount === 0) {
      const now = new Date().toISOString();
      await this.educationContents.bulkAdd([
        {
          title: 'احکام وضو',
          text: `وضو یکی از مقدمات مهم نماز است و برای انجام صحیح آن، رعایت شرایط زیر لازم است:

شرایط وضو
برای وضو، ابتدا باید نیت وضو داشته باشید و سپس صورت و دست‌ها را به ترتیب مقرر بشویید و مسح سر و پاها را انجام دهید.

مبطلات وضو
مواردی که وضو را باطل می‌کنند عبارتند از:
- خروج ادرار یا مدفوع
- باد معده
- خوابی که به واسطه آن چشم نبیند و گوش نشنود
- بیهوشی و مستی
- هر کاری که موجب غسل می‌شود.`,
          tags: ['احکام', 'وضو'],
          source: 'توضیح المسائل',
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'آموزش نماز صبح',
          text: `نماز صبح دو رکعت است و وقت آن از طلوع فجر صادق تا طلوع آفتاب است.

نحوه خواندن:
۱. نیت و تکبیره الاحرام (گفتن الله اکبر)
۲. قرائت حمد و سوره در رکعت اول و دوم
۳. رکوع و سجود در هر رکعت
۴. تشهد و سلام در پایان رکعت دوم.`,
          tags: ['نماز', 'آموزش'],
          source: 'آموزش فقه',
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'احکام روزه و مبطلات آن',
          text: `روزه عبارت است از خودداری و امساک از مبطلات روزه از اذان صبح تا اذان مغرب با نیت تقرب به خداوند.

مهم‌ترین مبطلات روزه:
- خوردن و آشامیدن عمداً
- رساندن غبار غلیظ به حلق
- فرو بردن تمام سر در آب (طبق نظر برخی مراجع)
- اماله کردن با چیزهای روان
- قی کردن عمدی.`,
          tags: ['احکام', 'روزه'],
          source: 'رساله عملیه',
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'نماز مسافر و شرایط آن',
          text: `مسافر باید نمازهای چهار رکعتی (ظهر، عصر و عشاء) را دو رکعت بخواند به شرطی که سفر او حداقل ۸ فرسخ (حدود ۴۵ کیلومتر) باشد و قصد ماندن ۱۰ روز در مقصد را نداشته باشد.`,
          tags: ['نماز', 'احکام'],
          source: 'توضیح المسائل',
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'احکام غسل',
          text: `غسل به دو روش انجام می‌شود: غسل ترتیبی و غسل ارتماسی.

در غسل ترتیبی ابتدا سر و گردن، سپس نیمه راست بدن و در نهایت نیمه چپ بدن شسته می‌شود.`,
          tags: ['احکام', 'آموزش'],
          source: 'توضیح المسائل',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // Seed default Dua Tags if empty
    const duaTagCount = await this.duaTags.count();
    if (duaTagCount === 0) {
      const now = new Date().toISOString();
      const defaultDuaTags = ['نماز', 'روزه', 'صبح', 'شب', 'مناسبتها', 'استغفار', 'زیارت'];
      for (const name of defaultDuaTags) {
        await this.duaTags.add({ name, createdAt: now });
      }
    }

    // Seed default Duas if empty
    const duaContentCount = await this.duaContents.count();
    if (duaContentCount === 0) {
      const now = new Date().toISOString();
      await this.duaContents.bulkAdd([
        {
          title: 'دعای بعد از نماز',
          arabicText: 'اللَّهُمَّ رَبَّنَا وَتَقَبَّلْ صَلاَتَنَا وَاغْفِرْ لَنَا وَارْحَمْنَا وَأَنْتَ خَيْرُ الرَّاحِمِينَ',
          persianTranslation: 'پروردگارا، ای خدای ما، نماز ما را بپذیر و ما را ببخش و به ما رحم کن که تو بهترین رحم‌کنندگانی.',
          source: 'مفاتیح الجنان',
          tags: ['نماز'],
          isFavorite: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'دعای روزه',
          arabicText: 'اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ وَعَلَيْكَ تَوَكَّلْتُ',
          persianTranslation: 'خدایا، برای تو روزه گرفتم و به تو ایمان آوردم و با روزی تو افطار کردم و بر تو توکل نمودم.',
          source: 'مفاتیح الجنان',
          tags: ['روزه'],
          isFavorite: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'دعای صبح',
          arabicText: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
          persianTranslation: 'خدایا، تو به صبح رسیدیم و به شام رسیدیم و به تو زنده‌ایم و به تو می‌میریم و بازگشت به سوی توست.',
          source: 'مفاتیح الجنان',
          tags: ['صبح'],
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'دعای کمیل',
          arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِرَحْمَتِكَ الَّتِي وَسِعَتْ كُلَّ شَيْءٍ وَبِقُوَّتِكَ الَّتِي قَهَرْتَ بِهَا كُلَّ شَيْءٍ وَخَضَعَ لَهَا كُلُّ شَيْءٍ',
          persianTranslation: 'خدایا، از تو می‌خواهم به نام رحمتت که همه چیز را فرا گرفته است و به نیرویت که با آن بر هر چیزی چیره شدی و همه چیز در برابرش خاضع گردید.',
          source: 'مفاتیح الجنان',
          tags: ['شب', 'مناسبتها'],
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'دعای عهد',
          arabicText: 'اللَّهُمَّ رَبَّ النُّورِ الْعَظِيمِ وَرَبَّ الْكُرْسِيِّ الرَّفِيعِ وَرَبَّ الْبَحْرِ الْمَسْجُورِ وَمُنْزِلَ التَّوْرَاةِ وَالإِنْجِيلِ وَالزَّبُورِ',
          persianTranslation: 'خدایا، ای پروردگار نور بزرگ و پروردگار تخت بلند و پروردگار دریای پرشده و نازل‌کننده تورات و انجیل و زبور.',
          source: 'مفاتیح الجنان',
          tags: ['صبح', 'مناسبتها'],
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'دعای ندبه',
          arabicText: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ وَصَلَّى اللَّهُ عَلَى سَيِّدِنَا مُحَمَّدٍ نَبِيِّهِ وَآلِهِ وَسَلَّمَ تَسْلِيماً',
          persianTranslation: 'ستایش مخصوص خدای پروردگار جهانیان است و درود و سلام کامل خدا بر آقای ما محمد پیامبر او و خاندانش باد.',
          source: 'مفاتیح الجنان',
          tags: ['مناسبتها'],
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'دعای فرج',
          arabicText: 'إِلَهِي عَظُمَ الْبَلاءُ وَبَرِحَ الْخَفَاءُ وَانْكَشَفَ الْغِطَاءُ وَانْقَطَعَ الرَّجَاءُ وَضَاقَتِ الأَرْضُ وَمُنِعَتِ السَّمَاءُ',
          persianTranslation: 'خدایا! بلا و گرفتاری بزرگ شده و پوشیده آشکار گشته و پرده برافتاده و امید قطع شده و زمین تنگ گشته و آسمان بازداشته شده است.',
          source: 'مفاتیح الجنان',
          tags: ['نماز', 'مناسبتها'],
          isFavorite: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
  }
}

// Single instance for the application
export const db = new MihrabDatabase();

// Initialize seeding on database open
db.on('ready', () => {
  return db.seedInitialDataIfNeeded();
});
