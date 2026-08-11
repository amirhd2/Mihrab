import React, { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon, Check, BookOpen } from 'lucide-react';
import { EducationContentRecord, EducationTagRecord } from '../../types/db';

interface EducationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; text: string; tags: string[]; source?: string }) => Promise<void>;
  initialData?: EducationContentRecord | null;
  availableTags: EducationTagRecord[];
  onAddNewTag: (name: string) => Promise<EducationTagRecord>;
}

export const EducationFormModal: React.FC<EducationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableTags,
  onAddNewTag,
}) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [source, setSource] = useState('');

  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTagInline, setIsAddingTagInline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setText(initialData.text || '');
      setSelectedTags(initialData.tags || []);
      setSource(initialData.source || '');
    } else {
      setTitle('');
      setText('');
      setSelectedTags([]);
      setSource('');
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleCreateInlineTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    try {
      const tagRecord = await onAddNewTag(trimmed);
      if (!selectedTags.includes(tagRecord.name)) {
        setSelectedTags([...selectedTags, tagRecord.name]);
      }
      setNewTagInput('');
      setIsAddingTagInline(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ایجاد تگ جدید');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('لطفاً عنوان مطلب را وارد کنید');
      return;
    }
    if (!text.trim()) {
      setErrorMsg('لطفاً متن اصلی مطلب را وارد کنید');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        text: text.trim(),
        tags: selectedTags,
        source: source.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره‌سازی مطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-surface-card border border-neutral-200/80 dark:border-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-primary-theme">
              {initialData ? 'ویرایش مطلب' : 'افزودن مطلب جدید'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold text-primary-theme mb-1.5">
              عنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: احکام وضو یا آموزش نماز صبح"
              className="w-full bg-surface-bg border border-neutral-200/90 dark:border-neutral-700/80 rounded-2xl px-4 py-2.5 text-sm text-primary-theme placeholder:text-muted-theme focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Main Text Area */}
          <div>
            <label className="block text-xs font-bold text-primary-theme mb-1.5">
              متن اصلی <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="متن آموزش یا حکم شرعی را وارد کنید..."
              className="w-full bg-surface-bg border border-neutral-200/90 dark:border-neutral-700/80 rounded-2xl p-4 text-sm text-primary-theme placeholder:text-muted-theme focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 leading-relaxed resize-y"
            />
          </div>

          {/* Tags Selection & Addition */}
          <div>
            <label className="block text-xs font-bold text-primary-theme mb-2">
              تگ‌ها
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.id || tag.name}
                    type="button"
                    onClick={() => toggleTag(tag.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-surface-bg text-secondary-theme border-neutral-200/80 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {tag.name}
                  </button>
                );
              })}

              {/* Inline Add Tag */}
              {isAddingTagInline ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="نام تگ جدید"
                    className="bg-surface-bg border border-emerald-500 rounded-xl px-2.5 py-1 text-xs text-primary-theme focus:outline-hidden"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateInlineTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateInlineTag}
                    className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700"
                  >
                    ثبت
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTagInline(false)}
                    className="p-1 text-secondary-theme hover:bg-surface-elevated rounded-xl"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTagInline(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن تگ جدید
                </button>
              )}
            </div>
          </div>

          {/* Optional Source */}
          <div>
            <label className="block text-xs font-bold text-primary-theme mb-1.5">
              منبع <span className="text-muted-theme font-normal">(اختیاری)</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="مثلاً: توضیح المسائل آیت‌الله سیستانی"
              className="w-full bg-surface-bg border border-neutral-200/90 dark:border-neutral-700/80 rounded-2xl px-4 py-2.5 text-sm text-primary-theme placeholder:text-muted-theme focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-end gap-3 bg-surface-elevated/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-elevated hover:bg-neutral-200 dark:hover:bg-neutral-800 text-primary-theme text-sm font-medium rounded-2xl transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-40"
          >
            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره مطلب'}
          </button>
        </div>
      </div>
    </div>
  );
};
