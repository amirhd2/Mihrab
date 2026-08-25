import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PendingChangeItem, ChangeCategory, ChangeActionType } from '../types/pendingChanges';
import { PendingChangesService } from '../services/pendingChangesService';

interface PendingChangesContextType {
  changes: PendingChangeItem[];
  count: number;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  addChange: (title: string, category: ChangeCategory, type?: ChangeActionType, description?: string) => void;
  removeChange: (id: string) => void;
  clearAllChanges: () => void;
}

const PendingChangesContext = createContext<PendingChangesContextType | undefined>(undefined);

export const PendingChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [changes, setChanges] = useState<PendingChangeItem[]>(() => PendingChangesService.getChanges());
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const refreshChanges = useCallback(() => {
    setChanges(PendingChangesService.getChanges());
  }, []);

  useEffect(() => {
    // Initial sync
    refreshChanges();

    // Subscribe to updates from any service or page
    const unsubscribe = PendingChangesService.subscribe(refreshChanges);
    return () => unsubscribe();
  }, [refreshChanges]);

  const addChange = useCallback(
    (title: string, category: ChangeCategory, type: ChangeActionType = 'update', description?: string) => {
      PendingChangesService.logChange(title, category, type, description);
      refreshChanges();
    },
    [refreshChanges]
  );

  const removeChange = useCallback(
    (id: string) => {
      PendingChangesService.removeChange(id);
      refreshChanges();
    },
    [refreshChanges]
  );

  const clearAllChanges = useCallback(() => {
    PendingChangesService.clearAll();
    refreshChanges();
  }, [refreshChanges]);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  return (
    <PendingChangesContext.Provider
      value={{
        changes,
        count: changes.length,
        isPanelOpen,
        openPanel,
        closePanel,
        addChange,
        removeChange,
        clearAllChanges,
      }}
    >
      {children}
    </PendingChangesContext.Provider>
  );
};

export const usePendingChanges = (): PendingChangesContextType => {
  const context = useContext(PendingChangesContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      changes: PendingChangesService.getChanges(),
      count: PendingChangesService.getChanges().length,
      isPanelOpen: false,
      openPanel: () => {},
      closePanel: () => {},
      addChange: (title, category, type, desc) => PendingChangesService.logChange(title, category, type, desc),
      removeChange: (id) => PendingChangesService.removeChange(id),
      clearAllChanges: () => PendingChangesService.clearAll(),
    };
  }
  return context;
};
