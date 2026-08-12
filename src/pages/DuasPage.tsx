import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from '../components/PageHeader';
import { Search, Plus, Tag as TagIcon, SlidersHorizontal } from 'lucide-react';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { DuaRecord } from '../types/db';
import { DuaCard } from '../components/duas/DuaCard';
import { AddEditDuaModal } from '../components/duas/AddEditDuaModal';
import { TagManagerModal } from '../components/duas/TagManagerModal';
import { DuaReadingView } from '../components/duas/DuaReadingView';
import { SwipeToDeleteItem } from '../components/SwipeToDeleteItem';
import { useToastState } from '../hooks/useToast';

interface DuasPageProps {
  onShowToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning', duration?: number, action?: { label: string; onClick: () => void }) => void;
}

export const DuasPage: React.FC<DuasPageProps> = ({ onShowToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState<string>('all');
  
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingDua, setEditingDua] = useState<DuaRecord | null>(null);
  
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  
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

  const handleDeleteDua = async (id: number) => {
    const dua = await db.duaContents.get(id);
    if (!dua) return;
    
    await db.duaContents.delete(id);
    
    onShowToast('دعا حذف شد', 'success', 3500, {
      label: 'بازگردانی',
      onClick: async () => {
        await db.duaContents.put(dua);
        onShowToast('دعا بازگردانده شد', 'success', 3500);
      }
    });
    
    if (readingDua?.id === id) {
      setSearchParams({}, { replace: true });
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
    <div className="space-y-6">
      <div className="space-y-4 px-4 pb-4">
        <PageHeader
          titleFa="دعاها"
          showBack
          onBackClick={() => navigate('/')}
          centered
        />

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی دعا..."
            className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        </div>

        {/* Tags Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <button
            type="button"
            onClick={() => setIsTagManagerOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-elevated/80 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated border border-neutral-200/80 dark:border-neutral-800 transition-all flex items-center gap-1.5 shrink-0"
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
      </div>

      <div className="space-y-5 pb-20 relative px-4" dir="rtl">
        {filteredDuas.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            {searchQuery 
              ? 'نتیجه‌ای یافت نشد.' 
              : activeTag === 'favorites' 
                ? 'هیچ دعایی در علاقه‌مندی‌ها وجود ندارد.'
                : activeTag !== 'all'
                  ? 'هیچ دعایی با این تگ یافت نشد.'
                  : 'هنوز دعایی اضافه نشده است.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
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
        className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-30 w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all duration-200 active:scale-90 flex items-center justify-center shrink-0"
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
      </button>

      {/* Modals */}
      {isAddEditModalOpen && (
        <AddEditDuaModal
          dua={editingDua}
          onClose={() => { setIsAddEditModalOpen(false); setEditingDua(null); }}
          onSave={handleSaveDua}
        />
      )}

      {isTagManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm sm:backdrop-blur-md transition-opacity">
          <div className="w-full sm:max-w-md h-[80vh] sm:h-[600px] bg-surface-bg sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <TagManagerModal 
              onClose={() => setIsTagManagerOpen(false)} 
              onSelectTagFilter={(tag) => setActiveTag(tag)}
            />
          </div>
        </div>
      )}

      {/* Reading View Overlay */}
      {readingDua && (
        <DuaReadingView
          dua={readingDua}
          onClose={() => setSearchParams({}, { replace: true })}
          onEdit={(d) => { setEditingDua(d); setIsAddEditModalOpen(true); }}
          onDelete={handleDeleteDua}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
};
