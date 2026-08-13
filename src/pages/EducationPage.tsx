import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SearchField } from '../components/SearchField';
import { EducationContentRecord, EducationTagRecord } from '../types/db';
import { EducationService } from '../services/educationService';
import { EducationCard } from '../components/education/EducationCard';
import { EducationReadingView } from '../components/education/EducationReadingView';
import { EducationFormModal } from '../components/education/EducationFormModal';
import { TagManagerModal } from '../components/education/TagManagerModal';
import { Dialog } from '../components/Dialog';
import { Plus, Tag as TagIcon, BookOpen, SlidersHorizontal, FileText, SearchX } from 'lucide-react';
import { ToastAction, ToastType } from '../hooks/useToast';
import { useMobileStickyScroll } from '../hooks/useMobileStickyScroll';

interface EducationPageProps {
  onShowToast?: (message: string, type?: ToastType, duration?: number, action?: ToastAction) => void;
}

// Helper to normalize Persian characters for seamless search
const normalizePersian = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/آ/g, 'ا')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .trim();
};

export const EducationPage: React.FC<EducationPageProps> = ({ onShowToast }) => {
  const isStickyVisible = useMobileStickyScroll();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const articleId = searchParams.get('article');

  const [contents, setContents] = useState<EducationContentRecord[]>([]);
  const [tags, setTags] = useState<EducationTagRecord[]>([]);
  const [tagUsageCounts, setTagUsageCounts] = useState<Record<string, number>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('همه');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationContentRecord | null>(null);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EducationContentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived active reading item based on URL article search param
  const activeReadingItem = useMemo(() => {
    if (!articleId) return null;
    return contents.find((c) => c.id === Number(articleId)) || null;
  }, [contents, articleId]);

  // Load contents and tags from DB
  const loadData = async () => {
    try {
      const allContents = await EducationService.getAllContents();
      const allTags = await EducationService.getAllTags();
      const usage = await EducationService.getTagUsageCounts();

      setContents(allContents);
      setTags(allTags);
      setTagUsageCounts(usage);
    } catch (err) {
      console.error('Error loading education data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered contents based on search query and selected tag
  const filteredContents = useMemo(() => {
    const q = normalizePersian(searchQuery);

    return contents.filter((item) => {
      // 1. Tag Filter
      if (selectedTag !== 'همه') {
        if (!item.tags || !item.tags.includes(selectedTag)) {
          return false;
        }
      }

      // 2. Search Query Filter across title, text, tags, source
      if (q) {
        const titleMatch = normalizePersian(item.title).includes(q);
        const textMatch = normalizePersian(item.text).includes(q);
        const sourceMatch = item.source ? normalizePersian(item.source).includes(q) : false;
        const tagMatch = item.tags ? item.tags.some(t => normalizePersian(t).includes(q)) : false;

        return titleMatch || textMatch || sourceMatch || tagMatch;
      }

      return true;
    });
  }, [contents, searchQuery, selectedTag]);

  // Handle Add or Edit Content
  const handleSaveContent = async (data: {
    title: string;
    text: string;
    tags: string[];
    source?: string;
  }) => {
    if (editingItem && editingItem.id) {
      await EducationService.updateContent(editingItem.id, data);
      if (onShowToast) onShowToast('مطلب با موفقیت بروزرسانی شد', 'success');
    } else {
      await EducationService.addContent(data);
      if (onShowToast) onShowToast('مطلب جدید با موفقیت ذخیره شد', 'success');
    }
    setEditingItem(null);
    await loadData();
  };

  // Confirm and delete item with undo toast
  const confirmDeleteContent = async (item: EducationContentRecord) => {
    if (!item.id) return;

    try {
      await EducationService.deleteContent(item.id);

      // If viewing reading page, exit reading view
      if (activeReadingItem?.id === item.id) {
        setSearchParams({}, { replace: true });
      }

      await loadData();

      // Show Toast with Undo ("بازگردانی")
      if (onShowToast) {
        onShowToast('مطلب حذف شد', 'info', 5000, {
          label: 'بازگردانی',
          onClick: async () => {
            await EducationService.restoreContent(item);
            await loadData();
            if (onShowToast) onShowToast('مطلب بازگردانده شد', 'success');
          },
        });
      }
    } catch (err) {
      console.error('Error deleting content:', err);
      if (onShowToast) onShowToast('خطا در حذف مطلب', 'error');
    }
  };

  const handleDeleteContent = (item: EducationContentRecord) => {
    setItemToDelete(item);
  };

  // Tag Management handlers
  const handleAddTag = async (name: string): Promise<EducationTagRecord> => {
    const tagRecord = await EducationService.addTag(name);
    await loadData();
    return tagRecord;
  };

  const handleRenameTag = async (oldName: string, newName: string) => {
    await EducationService.renameTag(oldName, newName);
    if (selectedTag === oldName) {
      setSelectedTag(newName);
    }
    await loadData();
  };

  const handleDeleteTag = async (tagName: string) => {
    await EducationService.deleteTag(tagName);
    if (selectedTag === tagName) {
      setSelectedTag('همه');
    }
    await loadData();
  };

  // Open Form for Adding New Content
  const handleOpenAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Content
  const handleOpenEditForm = (item: EducationContentRecord) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  // If Reading View is Active
  if (activeReadingItem) {
    return (
      <div className="space-y-6">
        <EducationReadingView
          item={activeReadingItem}
          onBack={() => setSearchParams({}, { replace: true })}
          onEdit={(item) => handleOpenEditForm(item)}
          onDelete={(item) => handleDeleteContent(item)}
          onShowToast={(msg, type) => onShowToast && onShowToast(msg, type)}
        />

        {/* Form Modal for Editing */}
        <EducationFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveContent}
          initialData={editingItem}
          availableTags={tags}
          onAddNewTag={handleAddTag}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 relative" dir="rtl">
      {/* Header */}
      <PageHeader
        titleFa="آموزش و احکام"
        subtitleFa="کتابخانه مطالب آموزشی و احکام شرعی"
        showBack
        onBackClick={() => navigate('/')}
        centered
      />

      {/* Live Search Field */}
      <div>
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderFa="جستجو در عنوان، متن، تگ‌ها و منابع..."
        />
      </div>

      {/* Tag Filters Row + Tag Management Action */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {/* Tag Management Button */}
        <button
          type="button"
          onClick={() => setIsTagModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-elevated/80 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated border border-neutral-200/80 dark:border-neutral-800 transition-all flex items-center gap-1.5 shrink-0"
          title="مدیریت تگ‌ها"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">مدیریت تگ‌ها</span>
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 shrink-0 mx-1" />

        {/* Scrollable Filter Chips */}
        <button
          type="button"
          onClick={() => setSelectedTag('همه')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
            selectedTag === 'همه'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-surface-card text-secondary-theme border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          همه
        </button>

        {tags.map((tag) => {
          const isSelected = selectedTag === tag.name;
          return (
            <button
              key={tag.id || tag.name}
              type="button"
              onClick={() => setSelectedTag(tag.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-surface-card text-secondary-theme border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {tag.name}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid / Empty States */}
      {loading ? (
        <div className="py-12 text-center text-secondary-theme text-xs animate-pulse">
          در حال بارگذاری مطالب...
        </div>
      ) : filteredContents.length > 0 ? (
        /* Responsive Grid Layout: 1 col mobile, 2 col md, 3 col lg tablet landscape */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredContents.map((item) => (
            <EducationCard
              key={item.id}
              item={item}
              onSelect={(selectedItem) => {
                if (selectedItem.id) {
                  setSearchParams({ article: selectedItem.id.toString() });
                }
              }}
              onDelete={handleDeleteContent}
            />
          ))}
        </div>
      ) : (
        /* Clean Empty States */
        <div className="bg-surface-card border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 my-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            {searchQuery ? (
              <SearchX className="w-6 h-6" />
            ) : selectedTag !== 'همه' ? (
              <TagIcon className="w-6 h-6" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-primary-theme">
              {searchQuery
                ? 'مطلبی پیدا نشد'
                : selectedTag !== 'همه'
                ? `هیچ مطلبی با تگ «${selectedTag}» یافت نشد`
                : 'هنوز مطلبی اضافه نشده'}
            </h3>
            <p className="text-xs text-secondary-theme leading-relaxed">
              {searchQuery
                ? 'عبارت دیگری را جستجو کنید یا فیلترها را تغییر دهید.'
                : selectedTag !== 'همه'
                ? 'می‌توانید تگ دیگری را انتخاب کرده یا مطلب جدیدی اضافه کنید.'
                : 'با استفاده از دکمه افزودن مطلب، اولین آموزش یا حکم شرعی را ثبت کنید.'}
            </p>
          </div>

          {selectedTag === 'همه' && !searchQuery && (
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              افزودن مطلب جدید
            </button>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) for Adding New Content */}
      <button
        type="button"
        onClick={handleOpenAddForm}
        aria-label="افزودن مطلب جدید"
        title="افزودن مطلب جدید"
        className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-30 w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all duration-200 active:scale-90 flex items-center justify-center shrink-0"
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
      </button>

      {/* Add / Edit Form Modal */}
      <EducationFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveContent}
        initialData={editingItem}
        availableTags={tags}
        onAddNewTag={handleAddTag}
      />

      {/* Tag Manager Modal */}
      <TagManagerModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={tags}
        tagUsageCounts={tagUsageCounts}
        onAddTag={handleAddTag}
        onRenameTag={handleRenameTag}
        onDeleteTag={handleDeleteTag}
        onSelectTagFilter={(tagName) => setSelectedTag(tagName)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        titleFa="تأیید حذف مطلب"
        actions={
          <>
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-secondary-theme hover:bg-surface-elevated rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={() => {
                if (itemToDelete) {
                  confirmDeleteContent(itemToDelete);
                  setItemToDelete(null);
                }
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
            >
              حذف مطلب
            </button>
          </>
        }
      >
        <p className="text-right py-2 text-primary-theme">
          آیا از حذف مطلب <span className="font-bold text-emerald-600 dark:text-emerald-400">«{itemToDelete?.title}»</span> اطمینان دارید؟
        </p>
      </Dialog>
    </div>
  );
};
