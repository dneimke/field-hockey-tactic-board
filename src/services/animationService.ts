import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { StoredAnimation } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a secure random token for sharing
 */
const generateShareToken = (): string => {
  // Generate a 32-character alphanumeric token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Get all animations owned by a user
 */
export const getUserAnimations = async (userId: string): Promise<StoredAnimation[]> => {
  try {
    const animationsRef = collection(db, `users/${userId}/animations`);
    const animationsQuery = query(animationsRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(animationsQuery);
    
    const animations: StoredAnimation[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      animations.push({
        ...data,
        id: docSnapshot.id,
      } as StoredAnimation);
    });
    
    return animations;
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError?.code === 'unavailable' || 
        firestoreError?.message?.includes('offline') ||
        firestoreError?.message?.includes('Failed to get document')) {
      throw error;
    }
    console.error('Error fetching user animations:', error);
    throw new Error('Failed to load animations. Please try again.');
  }
};

/**
 * Get all animations shared with a user
 */
export const getSharedAnimations = async (userId: string): Promise<StoredAnimation[]> => {
  try {
    // Use collection group query to search across all users' animations
    const animationsRef = collectionGroup(db, 'animations');
    const animationsQuery = query(
      animationsRef,
      where('sharedWith', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(animationsQuery);
    const sharedAnimations: StoredAnimation[] = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      // Extract userId from the document path: users/{userId}/animations/{animationId}
      const pathParts = docSnapshot.ref.path.split('/');
      const ownerId = pathParts[1]; // users/{userId}/...
      
      // Skip if this is the user's own animation
      if (ownerId === userId) return;
      
      sharedAnimations.push({
        ...data,
        id: docSnapshot.id,
        userId: ownerId, // Preserve owner ID
      } as StoredAnimation);
    });
    
    return sharedAnimations;
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError?.code === 'unavailable' || 
        firestoreError?.message?.includes('offline')) {
      throw error;
    }
    // Check if it's a missing index error
    if (firestoreError?.code === 'failed-precondition') {
      console.warn('Firestore index may be missing. Please create a composite index for animations collection with fields: sharedWith (array-contains) and updatedAt (descending)');
    }
    console.error('Error fetching shared animations:', error);
    throw new Error('Failed to load shared animations. Please try again.');
  }
};

/**
 * Get all animations (own + shared)
 */
export const getAllAnimations = async (userId: string): Promise<{
  own: StoredAnimation[];
  shared: StoredAnimation[];
}> => {
  try {
    const [own, shared] = await Promise.all([
      getUserAnimations(userId),
      getSharedAnimations(userId),
    ]);
    return { own, shared };
  } catch (error) {
    console.error('Error fetching all animations:', error);
    throw error;
  }
};

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
};

/**
 * Save an animation to Firestore
 */
export const saveAnimation = async (userId: string, animation: StoredAnimation): Promise<void> => {
  try {
    const animationRef = doc(db, `users/${userId}/animations/${animation.id}`);
    const now = Timestamp.now();
    
    // Check if animation already exists to preserve createdAt
    const existingDoc = await getDoc(animationRef);
    const existingData = existingDoc.data();
    const createdAt = existingData?.createdAt || now;
    
    // Prepare data and remove undefined values
    const dataToSave = removeUndefined({
      ...animation,
      userId,
      updatedAt: now,
      createdAt,
    });
    
    await setDoc(animationRef, dataToSave, { merge: true });
  } catch (error) {
    console.error('Error saving animation:', error);
    throw new Error('Failed to save animation. Please try again.');
  }
};

/**
 * Delete an animation from Firestore
 */
export const deleteAnimation = async (userId: string, animationId: string): Promise<void> => {
  try {
    const animationRef = doc(db, `users/${userId}/animations/${animationId}`);
    await deleteDoc(animationRef);
    
    // Also delete share token if it exists
    const animationDoc = await getDoc(animationRef).catch(() => null);
    if (animationDoc?.exists()) {
      const data = animationDoc.data();
      if (data.shareToken) {
        const tokenRef = doc(db, `shareTokens/${data.shareToken}`);
        await deleteDoc(tokenRef).catch(() => {
          // Token might not exist, ignore error
        });
      }
    }
  } catch (error) {
    console.error('Error deleting animation:', error);
    throw new Error('Failed to delete animation. Please try again.');
  }
};

/**
 * Share an animation with another user
 */
export const shareAnimation = async (
  ownerId: string,
  animationId: string,
  sharedUserId: string
): Promise<void> => {
  try {
    const animationRef = doc(db, `users/${ownerId}/animations/${animationId}`);
    const animationDoc = await getDoc(animationRef);
    
    if (!animationDoc.exists()) {
      throw new Error('Animation not found');
    }
    
    const data = animationDoc.data();
    const sharedWith = data.sharedWith || [];
    
    if (!sharedWith.includes(sharedUserId)) {
      await updateDoc(animationRef, {
        sharedWith: [...sharedWith, sharedUserId],
      });
    }
  } catch (error) {
    console.error('Error sharing animation:', error);
    throw new Error('Failed to share animation. Please try again.');
  }
};

/**
 * Remove share access from an animation
 */
export const unshareAnimation = async (
  ownerId: string,
  animationId: string,
  sharedUserId: string
): Promise<void> => {
  try {
    const animationRef = doc(db, `users/${ownerId}/animations/${animationId}`);
    const animationDoc = await getDoc(animationRef);
    
    if (!animationDoc.exists()) {
      throw new Error('Animation not found');
    }
    
    const data = animationDoc.data();
    const sharedWith = (data.sharedWith || []).filter((id: string) => id !== sharedUserId);
    
    await updateDoc(animationRef, {
      sharedWith,
    });
  } catch (error) {
    console.error('Error unsharing animation:', error);
    throw new Error('Failed to remove share access. Please try again.');
  }
};

/**
 * Generate or get existing share token for an animation
 */
export const getOrCreateShareToken = async (
  ownerId: string,
  animationId: string
): Promise<string> => {
  try {
    const animationRef = doc(db, `users/${ownerId}/animations/${animationId}`);
    const animationDoc = await getDoc(animationRef);
    
    if (!animationDoc.exists()) {
      throw new Error('Animation not found');
    }
    
    const data = animationDoc.data();
    
    // If token exists, return it
    if (data.shareToken) {
      // Verify token still exists in shareTokens collection
      const tokenRef = doc(db, `shareTokens/${data.shareToken}`);
      const tokenDoc = await getDoc(tokenRef);
      if (tokenDoc.exists()) {
        return data.shareToken;
      }
    }
    
    // Generate new token
    const newToken = generateShareToken();
    const tokenRef = doc(db, `shareTokens/${newToken}`);
    
    await setDoc(tokenRef, {
      animationId,
      ownerId,
      createdAt: Timestamp.now(),
    });
    
    // Update animation with token
    await updateDoc(animationRef, {
      shareToken: newToken,
    });
    
    return newToken;
  } catch (error) {
    console.error('Error generating share token:', error);
    throw new Error('Failed to generate share link. Please try again.');
  }
};

/**
 * Regenerate share token (revokes old one)
 */
export const regenerateShareToken = async (
  ownerId: string,
  animationId: string
): Promise<string> => {
  try {
    const animationRef = doc(db, `users/${ownerId}/animations/${animationId}`);
    const animationDoc = await getDoc(animationRef);
    
    if (!animationDoc.exists()) {
      throw new Error('Animation not found');
    }
    
    const data = animationDoc.data();
    
    // Delete old token if it exists
    if (data.shareToken) {
      const oldTokenRef = doc(db, `shareTokens/${data.shareToken}`);
      await deleteDoc(oldTokenRef).catch(() => {
        // Token might not exist, ignore error
      });
    }
    
    // Generate new token
    return await getOrCreateShareToken(ownerId, animationId);
  } catch (error) {
    console.error('Error regenerating share token:', error);
    throw new Error('Failed to regenerate share link. Please try again.');
  }
};

/**
 * Get animation by share token
 */
export const getAnimationByShareToken = async (token: string): Promise<{
  animation: StoredAnimation;
  ownerId: string;
} | null> => {
  try {
    const tokenRef = doc(db, `shareTokens/${token}`);
    const tokenDoc = await getDoc(tokenRef);
    
    if (!tokenDoc.exists()) {
      return null;
    }
    
    const tokenData = tokenDoc.data();
    const ownerId = tokenData.ownerId;
    const animationId = tokenData.animationId;
    
    const animationRef = doc(db, `users/${ownerId}/animations/${animationId}`);
    const animationDoc = await getDoc(animationRef);
    
    if (!animationDoc.exists()) {
      return null;
    }
    
    const animationData = animationDoc.data();
    return {
      animation: {
        ...animationData,
        id: animationDoc.id,
      } as StoredAnimation,
      ownerId,
    };
  } catch (error) {
    console.error('Error getting animation by share token:', error);
    return null;
  }
};

/**
 * Access animation via share token and add user to sharedWith
 */
export const accessAnimationViaToken = async (
  token: string,
  userId: string
): Promise<StoredAnimation> => {
  try {
    const result = await getAnimationByShareToken(token);
    
    if (!result) {
      throw new Error('Invalid or expired share link');
    }
    
    const { animation, ownerId } = result;
    
    // Add user to sharedWith if not already there
    if (ownerId !== userId && !animation.sharedWith.includes(userId)) {
      await shareAnimation(ownerId, animation.id, userId);
      // Refresh animation data
      const animationRef = doc(db, `users/${ownerId}/animations/${animation.id}`);
      const animationDoc = await getDoc(animationRef);
      if (animationDoc.exists()) {
        const updatedData = animationDoc.data();
        return {
          ...updatedData,
          id: animationDoc.id,
        } as StoredAnimation;
      }
    }
    
    return animation;
  } catch (error) {
    console.error('Error accessing animation via token:', error);
    throw error;
  }
};
