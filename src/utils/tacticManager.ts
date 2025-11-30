import { BoardState, SavedTactic, Player } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SEED_TACTICS_RAW } from './seedTactics';
import { getCurrentUser } from '../services/authService';
import * as tacticService from '../services/tacticService';

const STORAGE_KEY = 'hockey_saved_tactics';
const SEEDED_FLAG_KEY = 'hockey_tactics_seeded';

// Store current user ID to avoid repeated auth checks
let currentUserId: string | null = null;

/**
 * Get the current authenticated user ID
 */
const getUserId = (): string | null => {
  const user = getCurrentUser();
  currentUserId = user?.uid || null;
  return currentUserId;
};

/**
 * Extracts metadata from tactic name and tags
 * This helps with matching and reduces inference complexity
 */
export const extractMetadataFromTags = (
  name: string,
  tags: string[]
): SavedTactic['metadata'] => {
  const allText = [name, ...tags].join(' ').toLowerCase();
  const metadata: SavedTactic['metadata'] = {};
  
  // Extract primary team
  if (allText.includes('red') || allText.includes(' r ')) {
    metadata.primaryTeam = 'red';
  } else if (allText.includes('blue') || allText.includes(' b ')) {
    metadata.primaryTeam = 'blue';
  }
  
  // Extract phase (attack/defense)
  const isAPC = allText.includes('apc') || 
                allText.includes('attacking') || 
                (allText.includes('penalty corner') && allText.includes('attack'));
  const isDPC = allText.includes('dpc') || 
                allText.includes('defending') || 
                allText.includes('defense') ||
                (allText.includes('penalty corner') && (allText.includes('defend') || allText.includes('defense')));
  const isOutlet = allText.includes('outlet');
  const isPress = allText.includes('press');
  
  if (isDPC) {
    metadata.phase = 'defense';
    metadata.isDPC = true;
  } else if (isAPC) {
    metadata.phase = 'attack';
    metadata.isAPC = true;
  } else if (isOutlet) {
    metadata.phase = 'attack';
    metadata.isOutlet = true;
  } else if (isPress) {
    metadata.phase = 'defense';
    metadata.isPress = true;
  } else if (allText.includes('attack')) {
    metadata.phase = 'attack';
  } else if (allText.includes('defense') || allText.includes('defend')) {
    metadata.phase = 'defense';
  }
  
  // Extract structure
  const structurePatterns = [
    { pattern: /back[_\s]?4|back four/i, value: 'back_4' },
    { pattern: /back[_\s]?3|back three/i, value: 'back_3' },
    { pattern: /three[_\s]?high/i, value: 'three_high' },
    { pattern: /half[_\s]?court/i, value: 'half_court' },
    { pattern: /full[_\s]?court/i, value: 'full_court' },
    { pattern: /w[_\s]?press/i, value: 'w_press' },
    { pattern: /split[_\s]?vision/i, value: 'split_vision' },
    { pattern: /1[-\s]3|one[-\s]three/i, value: '1-3' },
    { pattern: /2[-\s]2|two[-\s]two/i, value: '2-2' },
    { pattern: /line[_\s]?stop/i, value: 'line_stop' },
  ];
  
  for (const { pattern, value } of structurePatterns) {
    if (pattern.test(allText)) {
      metadata.structure = value;
      break;
    }
  }
  
  return Object.keys(metadata).length > 0 ? metadata : undefined;
};

/**
 * Saves a tactic from the current board state
 * Uses Firestore if authenticated, localStorage otherwise
 */
export const saveTactic = async (
  boardState: BoardState,
  name: string,
  tags: string[],
  type: 'single_team' | 'full_scenario',
  metadata?: SavedTactic['metadata']
): Promise<SavedTactic> => {
  const positions: SavedTactic['positions'] = [];
  
  // Helper to add team positions
  const addTeamPositions = (team: Player[], teamColor: 'red' | 'blue') => {
    // Sort players by number for consistent relative indexing
    const sortedPlayers = [...team].sort((a, b) => a.number - b.number);
    
    sortedPlayers.forEach((player, index) => {
      // For field players, calculate relativeIndex excluding GK
      // This ensures correct matching when loading
      let relativeIndex = index;
      if (!player.isGoalkeeper) {
        // Count how many field players come before this one in the sorted list
        const fieldPlayersBefore = sortedPlayers
          .slice(0, index)
          .filter(p => !p.isGoalkeeper).length;
        relativeIndex = fieldPlayersBefore;
      }
      
      positions.push({
        team: teamColor,
        role: player.isGoalkeeper ? 'GK' : 'Player',
        relativeIndex: relativeIndex,
        x: player.position.x,
        y: player.position.y,
      });
    });
  };
  
  if (type === 'full_scenario') {
    // Save both teams
    addTeamPositions(boardState.redTeam, 'red');
    addTeamPositions(boardState.blueTeam, 'blue');
  } else {
    // Single team: determine which team to save based on which has more players or is more "active"
    // For now, save the team with more players, or default to red
    const redCount = boardState.redTeam.length;
    const blueCount = boardState.blueTeam.length;
    
    if (blueCount > redCount) {
      addTeamPositions(boardState.blueTeam, 'blue');
    } else {
      addTeamPositions(boardState.redTeam, 'red');
    }
  }
  
  // Auto-extract metadata if not provided
  const tacticMetadata = metadata || extractMetadataFromTags(name, tags);
  
  const savedTactic: SavedTactic = {
    id: uuidv4(),
    name,
    tags,
    type,
    metadata: tacticMetadata,
    positions,
  };
  
  // Save to appropriate storage
  const userId = getUserId();
  if (userId) {
    // Save to Firestore
    await tacticService.saveTactic(userId, savedTactic);
  } else {
    // Save to localStorage
    const existingTactics = getAllTacticsLocal();
    existingTactics.push(savedTactic);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingTactics));
  }
  
  // Clear AI matching cache since tactics have changed
  clearTacticCache();
  
  return savedTactic;
};

/**
 * Loads a tactic by ID
 * Checks Firestore if authenticated, localStorage otherwise
 */
export const loadTactic = async (id: string): Promise<SavedTactic | null> => {
  const tactics = await getAllTactics();
  return tactics.find(t => t.id === id) || null;
};

/**
 * Get all tactics from localStorage (synchronous, for fallback)
 */
const getAllTacticsLocal = (): SavedTactic[] => {
  const tacticsJson = localStorage.getItem(STORAGE_KEY);
  if (!tacticsJson) {
    return [];
  }
  
  try {
    const tactics = JSON.parse(tacticsJson);
    return Array.isArray(tactics) ? tactics : [];
  } catch (error) {
    console.error('Failed to parse saved tactics:', error);
    return [];
  }
};

/**
 * Seeds default tactics for new users (localStorage only)
 * Only runs once per user (tracked via localStorage flag)
 */
const seedDefaultTacticsLocal = (): void => {
  const hasSeeded = localStorage.getItem(SEEDED_FLAG_KEY);
  if (hasSeeded) {
    return; // Already seeded
  }

  try {
    // Check if user already has tactics
    const existingTactics = localStorage.getItem(STORAGE_KEY);
    if (existingTactics) {
      // User has tactics, mark as seeded but don't overwrite
      localStorage.setItem(SEEDED_FLAG_KEY, 'true');
      return;
    }

    // Seed default tactics with metadata extracted
    const seedTacticsWithMetadata: SavedTactic[] = SEED_TACTICS_RAW.map(tactic => ({
      ...tactic,
      metadata: extractMetadataFromTags(tactic.name, tactic.tags)
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTacticsWithMetadata));
    localStorage.setItem(SEEDED_FLAG_KEY, 'true');
    console.log('Seeded default tactics for new user (localStorage)');
  } catch (error) {
    console.error('Failed to seed default tactics:', error);
  }
};

/**
 * Seeds default tactics for authenticated users (Firestore)
 */
const seedDefaultTacticsFirestore = async (userId: string): Promise<void> => {
  try {
    // Check if user already has tactics
    const existingTactics = await tacticService.getUserTactics(userId);
    if (existingTactics.length > 0) {
      return; // User already has tactics, don't overwrite
    }

    // Seed default tactics with metadata extracted
    const seedTacticsWithMetadata: SavedTactic[] = SEED_TACTICS_RAW.map(tactic => ({
      ...tactic,
      metadata: extractMetadataFromTags(tactic.name, tactic.tags)
    }));
    
    await tacticService.saveTacticsBatch(userId, seedTacticsWithMetadata);
    console.log('Seeded default tactics for new user (Firestore)');
  } catch (error: any) {
    // If offline, gracefully skip seeding - it will happen when online
    const isOffline = error?.code === 'unavailable' || 
                     error?.message?.includes('offline') ||
                     error?.message?.includes('Failed to get document');
    if (isOffline) {
      console.warn('Firestore offline, skipping seed operation (will retry when online)');
      return;
    }
    console.error('Failed to seed default tactics in Firestore:', error);
  }
};

/**
 * Gets all saved tactics
 * Automatically seeds default tactics for new users on first call
 * Uses Firestore if authenticated, localStorage otherwise
 */
export const getAllTactics = async (): Promise<SavedTactic[]> => {
  const userId = getUserId();
  
  if (userId) {
    // Use Firestore
    try {
      await seedDefaultTacticsFirestore(userId);
      return await tacticService.getUserTactics(userId);
    } catch (error) {
      console.error('Failed to get tactics from Firestore, falling back to localStorage:', error);
      // Fallback to localStorage on error
      seedDefaultTacticsLocal();
      return getAllTacticsLocal();
    }
  } else {
    // Use localStorage
    seedDefaultTacticsLocal();
    return getAllTacticsLocal();
  }
};

/**
 * Searches tactics by name and tags using fuzzy matching
 */
export const searchTactics = async (query: string): Promise<SavedTactic[]> => {
  if (!query.trim()) {
    return getAllTactics();
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  const tactics = await getAllTactics();
  
  return tactics.filter(tactic => {
    // Check name
    const nameMatch = tactic.name.toLowerCase().includes(normalizedQuery);
    
    // Check tags
    const tagMatch = tactic.tags.some(tag => 
      tag.toLowerCase().includes(normalizedQuery)
    );
    
    return nameMatch || tagMatch;
  });
};

/**
 * Deletes a tactic by ID
 * Uses Firestore if authenticated, localStorage otherwise
 */
export const deleteTactic = async (id: string): Promise<void> => {
  const userId = getUserId();
  
  if (userId) {
    // Delete from Firestore
    await tacticService.deleteTactic(userId, id);
  } else {
    // Delete from localStorage
    const tactics = getAllTacticsLocal();
    const filtered = tactics.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  
  // Clear AI matching cache since tactics have changed
  clearTacticCache();
};

// Helper to clear AI matching cache (avoids circular dependency)
const clearTacticCache = (): void => {
  if (typeof window !== 'undefined') {
    // Dynamic import to avoid circular dependency
    import('./commandInterpreter').then(module => {
      if (module.clearTacticMatchCache) {
        module.clearTacticMatchCache();
      }
    }).catch(() => {
      // Ignore errors - cache clearing is optional
    });
  }
};

/**
 * Updates a tactic's metadata (name, tags, type, metadata)
 * Note: Cannot update positions - user must load, adjust, and re-save for position changes
 * Uses Firestore if authenticated, localStorage otherwise
 */
export const updateTactic = async (
  id: string,
  updates: { name?: string; tags?: string[]; type?: 'single_team' | 'full_scenario'; metadata?: SavedTactic['metadata'] }
): Promise<SavedTactic | null> => {
  const userId = getUserId();
  
  if (userId) {
    // Update in Firestore
    await tacticService.updateTactic(userId, id, updates);
    // Reload to return updated tactic
    const tactics = await tacticService.getUserTactics(userId);
    const updated = tactics.find(t => t.id === id);
    
    // Clear AI matching cache since tactics have changed
    clearTacticCache();
    
    return updated || null;
  } else {
    // Update in localStorage
    const tactics = getAllTacticsLocal();
    const index = tactics.findIndex(t => t.id === id);
    if (index === -1) {
      return null;
    }
    
    tactics[index] = { ...tactics[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tactics));
    
    // Clear AI matching cache since tactics have changed
    clearTacticCache();
    
    return tactics[index];
  }
};

/**
 * Flips tactic coordinates horizontally (mirror across center line)
 * Used when same-phase, opposite-team match (e.g., "Blue APC" using "Red APC" positions)
 * This is a pure function with no side effects
 */
export function flipTacticCoordinates(
  tactic: SavedTactic,
  targetTeam: 'red' | 'blue'
): SavedTactic {
  const oppositeTeam = targetTeam === 'red' ? 'blue' : 'red';
  
  // Build flipped positions for both teams
  const flippedPositions: SavedTactic['positions'] = [];
  
  // 1. Target team gets opposite team's positions (flipped)
  const oppositeTeamPositions = tactic.positions.filter(p => p.team === oppositeTeam);
  oppositeTeamPositions.forEach(p => {
    flippedPositions.push({
      ...p,
      team: targetTeam, // Change to target team
      x: 100 - p.x,     // Flip X coordinate
      y: p.y            // Keep Y coordinate
    });
  });
  
  // 2. Other team gets the target team's original positions (flipped)
  const targetTeamOriginalPositions = tactic.positions.filter(p => p.team === targetTeam);
  targetTeamOriginalPositions.forEach(p => {
    flippedPositions.push({
      ...p,
      team: oppositeTeam, // Change to the other team
      x: 100 - p.x,       // Flip X coordinate
      y: p.y              // Keep Y coordinate
    });
  });
  
  return {
    ...tactic,
    positions: flippedPositions
  };
}

/**
 * Converts a SavedTactic to CommandResult format for execution
 * @param savedTactic - The saved tactic to convert (should be pre-flipped if needed)
 * @param boardState - Current board state for player matching
 * @param teamFilter - Optional team filter: if specified, only apply positions for that team
 */
export const savedTacticToMoves = (
  savedTactic: SavedTactic,
  boardState: BoardState,
  teamFilter?: 'red' | 'blue'
): Array<{ targetId: string; newPosition: { x: number; y: number } }> => {
  const moves: Array<{ targetId: string; newPosition: { x: number; y: number } }> = [];
  
  // Filter positions by team if specified
  const positionsToApply = teamFilter 
    ? savedTactic.positions.filter(p => p.team === teamFilter)
    : savedTactic.positions;
  
  // Group positions by team
  const redPositions = positionsToApply.filter(p => p.team === 'red');
  const bluePositions = positionsToApply.filter(p => p.team === 'blue');
  
  // Helper to match positions to current players
  const matchPositionsToPlayers = (
    positions: SavedTactic['positions'],
    currentPlayers: Player[]
  ) => {
    // Sort current players by number to match relativeIndex
    const sortedPlayers = [...currentPlayers].sort((a, b) => a.number - b.number);
    
    positions.forEach(savedPos => {
      // Find player by role and relative index
      let matchedPlayer: Player | undefined;
      
      if (savedPos.role === 'GK') {
        // Match goalkeeper
        matchedPlayer = sortedPlayers.find(p => p.isGoalkeeper);
      } else {
        // Match field players, skipping GK
        const fieldPlayers = sortedPlayers.filter(p => !p.isGoalkeeper);
        matchedPlayer = fieldPlayers[savedPos.relativeIndex];
      }
      
      if (matchedPlayer) {
        moves.push({
          targetId: matchedPlayer.id,
          newPosition: { x: savedPos.x, y: savedPos.y },
        });
      }
    });
  };
  
  // Match positions for each team
  if (redPositions.length > 0) {
    matchPositionsToPlayers(redPositions, boardState.redTeam);
  }
  
  if (bluePositions.length > 0) {
    matchPositionsToPlayers(bluePositions, boardState.blueTeam);
  }
  
  return moves;
};

/**
 * Update the stored user ID (called when auth state changes)
 */
export const setCurrentUserId = (userId: string | null): void => {
  currentUserId = userId;
};

