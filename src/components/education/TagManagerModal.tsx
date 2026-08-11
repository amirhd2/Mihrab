import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Tag as TagIcon, Layers } from 'lucide-react';
import { EducationTagRecord } from '../../types/db';

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
  const [newTagName, setNewTagName] = useState('');
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState('');
  const [deletingTagName, setDeletingTagName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-surface-card border border-neutral-200/80 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="نام تگ جدید..."
              className="flex-1 bg-surface-card border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl px-3.5 py-2 text-sm text-primary-theme placeholder:text-muted-theme focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            />
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              افزودن
            </button>
          </form>
          {errorMsg && <p className="text-xs text-red-500 mt-2">{errorMsg}</p>}
        </div>

        {/* Tag List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                <div
                  key={tag.id || tag.name}
                  className="flex items-center justify-between p-3 rounded-2xl bg-surface-bg border border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 pl-2">
                      <input
                        type="text"
                        value={editInputVal}
                        onChange={(e) => setEditInputVal(e.target.value)}
                        className="flex-1 bg-surface-card border border-emerald-500 rounded-lg px-2.5 py-1 text-sm text-primary-theme focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(tag.name)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        title="ذخیره"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTagName(null)}
                        className="p-1.5 text-secondary-theme hover:bg-surface-elevated rounded-lg transition-colors"
                        title="انصراف"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectTagFilter) {
                              onSelectTagFilter(tag.name);
                              onClose();
                            }
                          }}
                          className="font-semibold text-sm text-primary-theme hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-right"
                        >
                          {tag.name}
                        </button>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                          {count} مطلب
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartRename(tag)}
                          className="p-1.5 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated rounded-lg transition-colors"
                          title="ویرایش تگ"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTagName(tag.name)}
                          className="p-1.5 text-secondary-theme hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="حذف تگ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Alert Overlay */}
        {deletingTagName && (
          <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-xs text-primary-theme flex flex-col gap-3">
            <p className="font-semibold text-red-600 dark:text-red-400">
              آیا از حذف تگ «{deletingTagName}» اطمینان دارید؟
            </p>
            <p className="text-secondary-theme">
              با حذف تگ، مطالب مربوط به آن حذف نخواهند شد و فقط تگ از آن‌ها جدا می‌شود.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingTagName(null)}
                className="px-3 py-1.5 bg-surface-card hover:bg-surface-elevated text-primary-theme rounded-xl font-medium border border-neutral-200 dark:border-neutral-700"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
};
