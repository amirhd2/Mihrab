import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { EducationContentRecord, EducationTagRecord } from '../../types/db';
import { usePreventBodyScroll } from '../../hooks/usePreventBodyScroll';

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
  usePreventBodyScroll(isOpen);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [source, setSource] = useState('');

  const [newTagInput, setNewTagInput] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);
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
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ایجاد تگ جدید');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !text.trim()) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-neutral-900/40 backdrop-blur-sm" dir="rtl">
      <div className="bg-surface-card w-[calc(100%-1.75rem)] max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <h2 className="text-lg font-bold text-primary-theme">
            {initialData ? 'ویرایش مطلب' : 'افزودن مطلب'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">عنوان</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="مثال: احکام وضو یا آموزش نماز صبح"
            />
          </div>

          {/* Main Text Area */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">متن اصلی</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[120px] leading-relaxed resize-none"
              placeholder="متن آموزش یا حکم شرعی را وارد کنید..."
            />
          </div>

          {/* Source Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">منبع (اختیاری)</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="مثال: توضیح المسائل آیت‌الله سیستانی"
            />
          </div>

          {/* Tags Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">تگ‌ها</label>
              <button
                type="button"
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="text-xs text-emerald-600 font-medium hover:text-emerald-700"
              >
                {showTagSelector ? 'بستن انتخاب تگ' : 'انتخاب از تگ‌های موجود'}
              </button>
            </div>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-xs rounded-full border border-emerald-200 dark:border-emerald-800">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="hover:text-emerald-900 dark:hover:text-emerald-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {showTagSelector && (
              <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 space-y-3">
                {availableTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id || tag.name}
                          type="button"
                          onClick={() => toggleTag(tag.name)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                            isSelected 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200 dark:border-emerald-800' 
                              : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 text-center py-2">هیچ تگی وجود ندارد.</p>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateInlineTag(); } }}
                    placeholder="ایجاد تگ جدید..."
                    className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateInlineTag}
                    disabled={!newTagInput.trim()}
                    className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0 bg-surface-card pb-safe">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!title.trim() || !text.trim() || isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-colors shadow-sm"
          >
            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </div>
    </div>
  );
};
