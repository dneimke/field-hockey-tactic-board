import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readTacticsFromStorage,
  writeTacticToStorage,
  tacticExists,
} from '../storageOperations';
import { Tactic } from '../../types';
import { TACTICS_STORAGE_KEY } from '../../constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('storageOperations', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal('localStorage', localStorageMock);
  });

  describe('readTacticsFromStorage', () => {
    it('should return empty array when storage is empty', () => {
      const tactics = readTacticsFromStorage();
      expect(tactics).toEqual([]);
    });

    it('should read tactics from storage', () => {
      const tactic: Tactic = {
        name: 'Test Tactic',
        frames: [],
        paths: [],
      };
      localStorageMock.setItem(TACTICS_STORAGE_KEY, JSON.stringify([tactic]));
      const tactics = readTacticsFromStorage();
      expect(tactics).toHaveLength(1);
      expect(tactics[0].name).toBe('Test Tactic');
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem(TACTICS_STORAGE_KEY, 'invalid json');
      const tactics = readTacticsFromStorage();
      expect(tactics).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('writeTacticToStorage', () => {
    it('should write new tactic to storage', () => {
      const tactic: Tactic = {
        name: 'New Tactic',
        frames: [],
        paths: [],
      };
      writeTacticToStorage(tactic);
      const tactics = readTacticsFromStorage();
      expect(tactics).toHaveLength(1);
      expect(tactics[0].name).toBe('New Tactic');
    });

    it('should update existing tactic', () => {
      const tactic1: Tactic = {
        name: 'Existing Tactic',
        frames: [],
        paths: [],
      };
      const tactic2: Tactic = {
        name: 'Existing Tactic',
        frames: [{ redTeam: [], blueTeam: [], balls: [] }],
        paths: [],
      };
      writeTacticToStorage(tactic1);
      writeTacticToStorage(tactic2);
      const tactics = readTacticsFromStorage();
      expect(tactics).toHaveLength(1);
      expect(tactics[0].frames).toHaveLength(1);
    });
  });

  describe('tacticExists', () => {
    it('should return false when tactic does not exist', () => {
      expect(tacticExists('Non-existent')).toBe(false);
    });

    it('should return true when tactic exists', () => {
      const tactic: Tactic = {
        name: 'Existing Tactic',
        frames: [],
        paths: [],
      };
      writeTacticToStorage(tactic);
      expect(tacticExists('Existing Tactic')).toBe(true);
    });
  });
});

