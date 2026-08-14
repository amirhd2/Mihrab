import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/PageHeader';
import { Search, Plus, Tag as TagIcon, SlidersHorizontal, SearchX, FileText } from 'lucide-react';
import { SearchField } from '../components/SearchField';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { DuaRecord } from '../types/db';
import { DuaCard } from '../components/duas/DuaCard';
import { AddEditDuaModal } from '../components/duas/AddEditDuaModal';
import { TagManagerModal } from '../components/duas/TagManagerModal';
import { DuaReadingView } from '../components/duas/DuaReadingView';
import { SwipeToDeleteItem } from '../components/SwipeToDeleteItem';
import { Dialog } from '../components/Dialog';
import { useToastState } from '../hooks/useToast';
import { useMobileStickyScroll } from '../hooks/useMobileStickyScroll';

interface DuasPageProps {
  onShowToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning', duration?: number, action?: { label: string; onClick: () => void }) => void;
}

export const DuasPage: React.FC<DuasPageProps> = ({ onShowToast }) => {
  const isStickyVisible = useMobileStickyScroll();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState<string>('all');
  
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingDua, setEditingDua] = useState<DuaRecord | null>(null);
  
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [duaToDelete, setDuaToDelete] = useState<DuaRecord | null>(null);
  const isPopStateBack = useRef(false);

  // Listen for browser popstate (e.g. swipe-back or back button) to suppress exit animation
  useEffect(() => {
    const handlePopState = () => {
      isPopStateBack.current = true;
      setTimeout(() => {
        isPopStateBack.current = false;
      }, 400);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const readingDuaId = searchParams.get('dua');

  const duas = useLiveQuery(() => db.duaContents.toArray()) || [];
  const tags = useLiveQuery(() => db.duaTags.toArray()) || [];

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tags]);

  const readingDua = useMemo(() => {
    if (!readingDuaId) return null;
    return duas.find(d => d.id === Number(readingDuaId)) || null;
  }, [readingDuaId, duas]);

  const filteredDuas = useMemo(() => {
    let result = duas.filter((dua) => {
      // 1. Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          dua.title.toLowerCase().includes(query) ||
          dua.arabicText.toLowerCase().includes(query) ||
          dua.persianTranslation.toLowerCase().includes(query) ||
          (dua.tags && dua.tags.some(t => t.toLowerCase().includes(query)));
        
        if (!matchesSearch) return false;
      }

      // 2. Tag filter
      if (activeTag !== 'all') {
        if (!dua.tags || !dua.tags.includes(activeTag)) return false;
      }

      return true;
    });

    // Sort by updatedAt descending
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return result;
  }, [duas, searchQuery, activeTag]);

  const handleSaveDua = async (duaData: Omit<DuaRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingDua && editingDua.id) {
      await db.duaContents.update(editingDua.id, {
        ...duaData,
        updatedAt: new Date().toISOString(),
      });
      
      // Update reading view if open
      if (readingDua && readingDua.id === editingDua.id) {
        const updated = await db.duaContents.get(editingDua.id);
        // URL param will automatically re-evaluate readingDua from 'duas' query
      }
    } else {
      await db.duaContents.add({
        ...duaData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    setIsAddEditModalOpen(false);
    setEditingDua(null);
  };

  const confirmDeleteDua = async (dua: DuaRecord) => {
    if (!dua.id) return;
    const deletedId = dua.id;
    
    await db.duaContents.delete(deletedId);
    
    onShowToast('دعا حذف شد', 'success', 4000, {
      label: 'بازگردانی',
      onClick: async () => {
        await db.duaContents.put(dua);
        onShowToast('دعا بازگردانده شد', 'success', 3500);
      }
    });
    
    if (readingDua?.id === deletedId) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleDeleteDua = (id: number) => {
    const dua = duas.find(d => d.id === id);
    if (dua) {
      setDuaToDelete(dua);
    }
  };

  const handleToggleFavorite = async (id: number) => {
    const dua = await db.duaContents.get(id);
    if (dua) {
      const newState = !dua.isFavorite;
      await db.duaContents.update(id, { isFavorite: newState });
      if (readingDua?.id === id) {
        // State automatically re-evaluated from db query
      }
    }
  };

  return (
    <div className="space-y-5 pb-20 relative" dir="rtl">
      {/* Header */}
      <PageHeader
        titleFa="دعاها"
        showBack
        onBackClick={() => navigate('/')}
        centered
      />

      {/* Live Search Field */}
      <div>
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholderFa="جستجوی دعا، متن یا تگ‌ها..."
        />
      </div>

      {/* Tags Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        <button
          type="button"
          onClick={() => setIsTagManagerOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-elevated/80 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated border border-neutral-200/80 dark:border-neutral-800 transition-all flex items-center gap-1.5 shrink-0"
          title="مدیریت تگ‌ها"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">مدیریت تگ‌ها</span>
        </button>

        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 shrink-0 mx-1" />

        <button
          onClick={() => setActiveTag('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
            activeTag === 'all'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-surface-card text-secondary-theme border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          همه
        </button>

        {sortedTags.map(tag => (
          <button
            key={tag.id}
            onClick={() => setActiveTag(tag.name)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
              activeTag === tag.name
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-surface-card text-secondary-theme border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <div>
        {filteredDuas.length === 0 ? (
          <div className="bg-surface-card border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 my-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              {searchQuery ? (
                <SearchX className="w-6 h-6" />
              ) : activeTag !== 'all' && activeTag !== 'favorites' ? (
                <TagIcon className="w-6 h-6" />
              ) : (
                <FileText className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-primary-theme">
                {searchQuery
                  ? 'دعایی پیدا نشد'
                  : activeTag === 'favorites'
                  ? 'هیچ دعایی در علاقه‌مندی‌ها نیست'
                  : activeTag !== 'all'
                  ? `هیچ دعایی با تگ «${activeTag}» یافت نشد`
                  : 'هنوز دعایی اضافه نشده'}
              </h3>
              <p className="text-xs text-secondary-theme leading-relaxed">
                {searchQuery
                  ? 'عبارت دیگری را جستجو کنید یا فیلترها را تغییر دهید.'
                  : activeTag === 'favorites'
                  ? 'می‌توانید با انتخاب آیکون قلب، دعاها را به این لیست اضافه کنید.'
                  : activeTag !== 'all'
                  ? 'می‌توانید تگ دیگری را انتخاب کرده یا دعای جدیدی اضافه کنید.'
                  : 'با استفاده از دکمه افزودن، اولین دعای خود را ثبت کنید.'}
              </p>
            </div>

            {activeTag === 'all' && !searchQuery && (
              <button
                type="button"
                onClick={() => { setEditingDua(null); setIsAddEditModalOpen(true); }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                افزودن دعای جدید
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredDuas.map(dua => (
              <DuaCard 
                key={dua.id}
                dua={dua} 
                onSelect={(d) => setSearchParams({ dua: d.id.toString() })} 
                onDelete={(d) => handleDeleteDua(d.id!)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditingDua(null); setIsAddEditModalOpen(true); }}
        className={`fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-30 w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all duration-300 ease-in-out active:scale-90 flex items-center justify-center shrink-0 ${
          isStickyVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0'
        }`}
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
      </button>

      {/* Modals */}
      <AnimatePresence>
        {isAddEditModalOpen && (
          <AddEditDuaModal
            isOpen={isAddEditModalOpen}
            dua={editingDua}
            onClose={() => { setIsAddEditModalOpen(false); setEditingDua(null); }}
            onSave={handleSaveDua}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTagManagerOpen && (
          <div 
            key="duas-tag-manager"
            className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4" 
            dir="rtl"
          >
            <motion.div
              key="duas-tag-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsTagManagerOpen(false)}
            />
            <motion.div
              key="duas-tag-modal-card"
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="relative w-[calc(100%-1.75rem)] max-w-md h-[80vh] sm:h-[600px] bg-surface-bg rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto"
            >
              <TagManagerModal 
                isOpen={isTagManagerOpen}
                onClose={() => setIsTagManagerOpen(false)} 
                onSelectTagFilter={(tag) => setActiveTag(tag)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!duaToDelete}
        onClose={() => setDuaToDelete(null)}
        titleFa="تأیید حذف دعا"
        actions={
          <>
            <button
              type="button"
              onClick={() => setDuaToDelete(null)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-secondary-theme hover:bg-surface-elevated rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={() => {
                if (duaToDelete) {
                  confirmDeleteDua(duaToDelete);
                  setDuaToDelete(null);
                }
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
            >
              حذف دعا
            </button>
          </>
        }
      >
        <p className="text-right py-2 text-primary-theme">
          آیا از حذف دعای <span className="font-bold text-emerald-600 dark:text-emerald-400">«{duaToDelete?.title}»</span> اطمینان دارید؟
        </p>
      </Dialog>

      {/* Reading View Overlay */}
      <AnimatePresence>
        {readingDua && (
          <DuaReadingView
            dua={readingDua}
            isPopStateBack={isPopStateBack.current}
            onClose={() => {
              isPopStateBack.current = false;
              setSearchParams({}, { replace: true });
            }}
            onEdit={(d) => { setEditingDua(d); setIsAddEditModalOpen(true); }}
            onDelete={handleDeleteDua}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
