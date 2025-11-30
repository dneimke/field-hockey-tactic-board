import { Tactic } from '../types';
import { TACTICS_STORAGE_KEY } from '../constants';

/**
 * Reads tactics from localStorage
 */
export const readTacticsFromStorage = (): Tactic[] => {
  const tacticsJson = localStorage.getItem(TACTICS_STORAGE_KEY);
  if (!tacticsJson) {
    return [];
  }
  try {
    const tactics = JSON.parse(tacticsJson) as Tactic[];
    return Array.isArray(tactics) ? tactics : [];
  } catch (error) {
    console.error('Failed to parse tactics from storage:', error);
    return [];
  }
};

/**
 * Writes a tactic to localStorage
 */
export const writeTacticToStorage = (tactic: Tactic): void => {
  const tactics = readTacticsFromStorage();

  const existingIndex = tactics.findIndex((t) => t.name === tactic.name);
  if (existingIndex > -1) {
    tactics[existingIndex] = tactic;
  } else {
    tactics.push(tactic);
  }

  localStorage.setItem(TACTICS_STORAGE_KEY, JSON.stringify(tactics));
};

/**
 * Checks if a tactic with the given name already exists
 */
export const tacticExists = (name: string): boolean => {
  const tactics = readTacticsFromStorage();
  return tactics.some((t) => t.name === name);
};

