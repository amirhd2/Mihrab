import { usePreventBodyScroll } from '../../hooks/usePreventBodyScroll';
import React, { useState } from 'react';
import { X, Plus, Edit2, Check, Tag as TagIcon, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EducationTagRecord } from '../../types/db';
import { SwipeToDeleteItem } from '../SwipeToDeleteItem';
import { Dialog } from '../Dialog';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: EducationTagRecord[];
  tagUsageCounts: Record<string, number>;
  onAddTag: (name: string) => Promise<any>;
  onRenameTag: (oldName: string, newName: string) => Promise<void>;
  onDeleteTag: (tagName: string) => Promise<void>;
  onSelectTagFilter?: (tagName: string) => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  tags,
  tagUsageCounts,
  onAddTag,
  onRenameTag,
  onDeleteTag,
  onSelectTagFilter,
}) => {
  
  usePreventBodyScroll(isOpen);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState('');
  const [deletingTagName, setDeletingTagName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setErrorMsg('');
    try {
      await onAddTag(newTagName.trim());
      setNewTagName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در افزودن تگ');
    }
  };

  const handleStartRename = (tag: EducationTagRecord) => {
    setEditingTagName(tag.name);
    setEditInputVal(tag.name);
  };

  const handleSaveRename = async (oldName: string) => {
    if (!editInputVal.trim()) return;
    setErrorMsg('');
    try {
      await onRenameTag(oldName, editInputVal.trim());
      setEditingTagName(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ویرایش تگ');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTagName) return;
    setErrorMsg('');
    try {
      await onDeleteTag(deletingTagName);
      setDeletingTagName(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در حذف تگ');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div 
            key="education-tag-manager"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" 
            dir="rtl"
          >
            <motion.div
              key="education-tag-backdrop"
                                      initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
              className="absolute inset-0 bg-black/60"
              onClick={onClose}
            />
            <motion.div
              key="education-tag-card"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ 
                opacity: [0, 1, 1, 1], 
                scale: [0.75, 1.05, 0.97, 1],
                transition: { duration: 0.45, ease: [0.175, 0.885, 0.32, 1.275], times: [0, 0.65, 0.85, 1] }
              }}
              exit={{ 
                opacity: [1, 1, 0], 
                scale: [1, 1.06, 0.7],
                transition: { duration: 0.35, ease: [0.6, -0.28, 0.735, 0.045], times: [0, 0.3, 1] }
              }}
              className="relative bg-surface-card border border-neutral-200/80 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-surface-elevated/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TagIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary-theme">مدیریت تگ‌ها</h2>
                <p className="text-xs text-secondary-theme">دسته‌بندی مطالب آموزش و احکام</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Tag Input Form */}
          <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-surface-bg/50">
            <form onSubmit={handleCreate} className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="نام تگ جدید..."
                className="flex-1 min-w-0 bg-surface-card border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl px-3.5 py-2 text-sm text-primary-theme placeholder:text-muted-theme focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
              />
              <button
                type="submit"
                disabled={!newTagName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                افزودن
              </button>
            </form>
            {errorMsg && <p className="text-xs text-red-500 mt-2">{errorMsg}</p>}
          </div>

          {/* Tag List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {tags.length === 0 ? (
              <div className="text-center py-8 text-secondary-theme">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-theme" />
                <p className="text-xs">هنوز تگی ثبت نشده است.</p>
              </div>
            ) : (
              tags.map((tag) => {
                const count = tagUsageCounts[tag.name] || 0;
                const isEditing = editingTagName === tag.name;

                return (
                  <div key={tag.id || tag.name} className="h-16 w-full relative">
                    <SwipeToDeleteItem
                      key={tag.id || tag.name}
                      id={tag.id || tag.name}
                      onDelete={() => setDeletingTagName(tag.name)}
                      className="h-full w-full"
                    >
                      <div className="w-full h-full p-3 flex items-center justify-between gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editInputVal}
                              onChange={(e) => setEditInputVal(e.target.value)}
                              className="flex-1 min-w-0 bg-surface-bg border border-blue-500 rounded-xl px-3 py-1.5 text-sm font-medium text-primary-theme focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(tag.name)}
                              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shrink-0"
                              title="ذخیره"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTagName(null)}
                              className="p-2 text-secondary-theme hover:bg-surface-elevated rounded-xl transition-colors shrink-0"
                              title="انصراف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Right Side: Interactive Tag Button */}
                            <div className="flex items-center gap-2 min-w-0 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectTagFilter) {
                                    onSelectTagFilter(tag.name);
                                    onClose();
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 group/tag truncate"
                                title="کلیک کنید برای فیلتر بر اساس این تگ"
                              >
                                <TagIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover/tag:scale-110 transition-transform shrink-0" />
                                <span className="truncate">{tag.name}</span>
                              </button>
                            </div>

                            {/* Center: Usage Count Badge */}
                            <div className="flex-1 flex justify-center items-center px-1">
                              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-elevated text-secondary-theme font-medium shrink-0">
                                {count} مطلب
                              </span>
                            </div>

                            {/* Left Side: Rename Action Button */}
                            <button
                              type="button"
                              onClick={() => handleStartRename(tag)}
                              className="p-2 text-secondary-theme hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors shrink-0"
                              title="ویرایش نام تگ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </SwipeToDeleteItem>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 flex justify-end bg-surface-elevated/30">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-surface-elevated hover:bg-neutral-200 dark:hover:bg-neutral-800 text-primary-theme text-sm font-medium rounded-xl transition-colors"
            >
              بستن
            </button>
          </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standard Delete Confirmation Popup */}
      <Dialog
        isOpen={!!deletingTagName}
        onClose={() => setDeletingTagName(null)}
        titleFa="تایید حذف تگ"
        actions={
          <>
            <button
              type="button"
              onClick={() => setDeletingTagName(null)}
              className="px-4 py-2 bg-surface-elevated hover:bg-neutral-200 dark:hover:bg-neutral-800 text-primary-theme text-xs font-bold rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
            >
              بله، حذف شود
            </button>
          </>
        }
      >
        <div className="space-y-2 text-right">
          <p className="font-bold text-primary-theme text-sm">
            آیا از حذف تگ «{deletingTagName}» اطمینان دارید؟
          </p>
          <p className="text-xs text-secondary-theme leading-relaxed">
            با حذف این تگ، مطالب مربوط به آن حذف نخواهند شد و فقط این تگ از دسته‌بندی آن‌ها جدا می‌گردد.
          </p>
        </div>
      </Dialog>
    </>
  );
};
