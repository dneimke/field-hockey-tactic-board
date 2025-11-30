import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SavedTactic } from '../types';

/**
 * Get all tactics for a user
 */
export const getUserTactics = async (userId: string): Promise<SavedTactic[]> => {
  try {
    const tacticsRef = collection(db, `users/${userId}/tactics`);
    const tacticsQuery = query(tacticsRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(tacticsQuery);
    
    const tactics: SavedTactic[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      // Extract only SavedTactic fields, excluding Firestore metadata
      const { createdAt, updatedAt, ...tacticData } = data;
      tactics.push({
        ...tacticData,
        id: docSnapshot.id,
      } as SavedTactic);
    });
    
    return tactics;
  } catch (error: any) {
    // Re-throw offline errors so they can be handled upstream
    if (error?.code === 'unavailable' || 
        error?.message?.includes('offline') ||
        error?.message?.includes('Failed to get document')) {
      throw error;
    }
    console.error('Error fetching user tactics:', error);
    throw new Error('Failed to load tactics. Please try again.');
  }
};

/**
 * Save a tactic to Firestore
 * Creates a new document or updates existing one
 */
export const saveTactic = async (userId: string, tactic: SavedTactic): Promise<void> => {
  try {
    const tacticRef = doc(db, `users/${userId}/tactics/${tactic.id}`);
    const now = Timestamp.now();
    
    // Check if tactic already exists to preserve createdAt
    const existingDoc = await getDoc(tacticRef);
    const existingData = existingDoc.data();
    const createdAt = existingData?.createdAt || now;
    
    await setDoc(tacticRef, {
      ...tactic,
      updatedAt: now,
      createdAt,
    }, { merge: true });
  } catch (error) {
    console.error('Error saving tactic:', error);
    throw new Error('Failed to save tactic. Please try again.');
  }
};

/**
 * Delete a tactic from Firestore
 */
export const deleteTactic = async (userId: string, tacticId: string): Promise<void> => {
  try {
    const tacticRef = doc(db, `users/${userId}/tactics/${tacticId}`);
    await deleteDoc(tacticRef);
  } catch (error) {
    console.error('Error deleting tactic:', error);
    throw new Error('Failed to delete tactic. Please try again.');
  }
};

/**
 * Update a tactic's metadata in Firestore
 */
export const updateTactic = async (
  userId: string,
  tacticId: string,
  updates: Partial<Pick<SavedTactic, 'name' | 'tags' | 'type' | 'metadata'>>
): Promise<void> => {
  try {
    const tacticRef = doc(db, `users/${userId}/tactics/${tacticId}`);
    await updateDoc(tacticRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating tactic:', error);
    throw new Error('Failed to update tactic. Please try again.');
  }
};

/**
 * Save multiple tactics in a batch (useful for seeding default tactics)
 */
export const saveTacticsBatch = async (userId: string, tactics: SavedTactic[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    tactics.forEach((tactic) => {
      const tacticRef = doc(db, `users/${userId}/tactics/${tactic.id}`);
      batch.set(tacticRef, {
        ...tactic,
        updatedAt: now,
        createdAt: now, // Use current time for batch operations
      }, { merge: false }); // Use set instead of merge for batch operations
    });
    
    await batch.commit();
  } catch (error: any) {
    // Re-throw offline errors so they can be handled upstream
    if (error?.code === 'unavailable' || 
        error?.message?.includes('offline') ||
        error?.message?.includes('Failed to get document')) {
      throw error;
    }
    console.error('Error batch saving tactics:', error);
    throw new Error('Failed to save tactics. Please try again.');
  }
};


