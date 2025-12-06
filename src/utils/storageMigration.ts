import {
  ANIMATIONS_STORAGE_KEY,
  PLAYBOOK_STORAGE_KEY,
  LEGACY_TACTICS_STORAGE_KEY,
  LEGACY_SAVED_TACTICS_STORAGE_KEY
} from '../constants';

export const migrateStorage = () => {
  try {
    // 1. Migrate Animations (hockey_tactics -> hockey_animations)
    const legacyAnimations = localStorage.getItem(LEGACY_TACTICS_STORAGE_KEY);
    const newAnimations = localStorage.getItem(ANIMATIONS_STORAGE_KEY);

    if (legacyAnimations && !newAnimations) {
      console.log('Migrating animations to new storage key...');
      localStorage.setItem(ANIMATIONS_STORAGE_KEY, legacyAnimations);
      // Optional: Remove legacy key after successful migration
      // localStorage.removeItem(LEGACY_TACTICS_STORAGE_KEY); 
    }

    // 2. Migrate Playbook (hockey_saved_tactics -> hockey_playbook)
    const legacyPlaybook = localStorage.getItem(LEGACY_SAVED_TACTICS_STORAGE_KEY);
    const newPlaybook = localStorage.getItem(PLAYBOOK_STORAGE_KEY);

    if (legacyPlaybook && !newPlaybook) {
      console.log('Migrating playbook to new storage key...');
      localStorage.setItem(PLAYBOOK_STORAGE_KEY, legacyPlaybook);
      // Optional: Remove legacy key after successful migration
      // localStorage.removeItem(LEGACY_SAVED_TACTICS_STORAGE_KEY);
    }
    
    console.log('Storage migration check complete.');
  } catch (error) {
    console.error('Error during storage migration:', error);
  }
};

