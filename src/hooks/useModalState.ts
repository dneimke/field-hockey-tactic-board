import { useState, useCallback } from 'react';

export interface ModalState {
  isSaveModalOpen: boolean;
  isLoadModalOpen: boolean;
  isPlaybookModalOpen: boolean;
  isEditTacticModalOpen: boolean;
  isCommandInputOpen: boolean;
  isAuthModalOpen: boolean;
}

export interface ModalActions {
  openSaveModal: () => void;
  closeSaveModal: () => void;
  openLoadModal: () => void;
  closeLoadModal: () => void;
  openPlaybookModal: () => void;
  closePlaybookModal: () => void;
  openEditTacticModal: () => void;
  closeEditTacticModal: () => void;
  openCommandInput: () => void;
  closeCommandInput: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useModalState = (): ModalState & ModalActions => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isPlaybookModalOpen, setIsPlaybookModalOpen] = useState(false);
  const [isEditTacticModalOpen, setIsEditTacticModalOpen] = useState(false);
  const [isCommandInputOpen, setIsCommandInputOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return {
    isSaveModalOpen,
    isLoadModalOpen,
    isPlaybookModalOpen,
    isEditTacticModalOpen,
    isCommandInputOpen,
    isAuthModalOpen,
    openSaveModal: useCallback(() => setIsSaveModalOpen(true), []),
    closeSaveModal: useCallback(() => setIsSaveModalOpen(false), []),
    openLoadModal: useCallback(() => setIsLoadModalOpen(true), []),
    closeLoadModal: useCallback(() => setIsLoadModalOpen(false), []),
    openPlaybookModal: useCallback(() => setIsPlaybookModalOpen(true), []),
    closePlaybookModal: useCallback(() => setIsPlaybookModalOpen(false), []),
    openEditTacticModal: useCallback(() => setIsEditTacticModalOpen(true), []),
    closeEditTacticModal: useCallback(() => setIsEditTacticModalOpen(false), []),
    openCommandInput: useCallback(() => setIsCommandInputOpen(true), []),
    closeCommandInput: useCallback(() => setIsCommandInputOpen(false), []),
    openAuthModal: useCallback(() => setIsAuthModalOpen(true), []),
    closeAuthModal: useCallback(() => setIsAuthModalOpen(false), []),
  };
};
