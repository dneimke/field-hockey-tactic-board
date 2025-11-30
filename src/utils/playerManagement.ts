import { Player, Position } from '../types';

export const DEFAULT_GAME_PLAYER_COUNT = 11;

/**
 * Creates an initial team with a specified number of players
 */
export const createInitialTeam = (
  team: "red" | "blue",
  playerCount: number,
  includeGK: boolean = true
): Player[] => {
  const players: Player[] = [];
  const prefix = team === "red" ? "R" : "B";
  
  // Calculate positions based on count
  // Simplified formation: distribute players across the field
  const positions = calculatePositionsForCount(playerCount, team, includeGK);
  
  for (let i = 0; i < playerCount; i++) {
    const playerNumber = i + 1;
    const isGK = includeGK && i === 0;
    
    players.push({
      id: `${prefix}${playerNumber}`,
      team,
      number: playerNumber,
      position: positions[i],
      isGoalkeeper: isGK,
    });
  }
  
  return players;
};

/**
 * Calculates positions for a given player count
 * Uses simplified formation logic
 */
const calculatePositionsForCount = (
  count: number,
  team: "red" | "blue",
  includeGK: boolean
): Position[] => {
  const positions: Position[] = [];
  const isRed = team === "red";
  
  if (count === 0) return [];
  
  // Goalkeeper position (if included)
  if (includeGK && count > 0) {
    positions.push({ x: isRed ? 5 : 95, y: 46.5 });
  }
  
  // Distribute remaining players
  const remainingCount = includeGK ? count - 1 : count;
  const startIndex = includeGK ? 1 : 0;
  
  if (remainingCount === 0) return positions;
  
  // Simple distribution: create rows based on count
  const rows = Math.ceil(Math.sqrt(remainingCount));
  const cols = Math.ceil(remainingCount / rows);
  
  for (let i = 0; i < remainingCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    const xBase = isRed ? 25 : 75;
    const xOffset = (row * 15) % 40; // Spread across field
    const x = isRed ? xBase + xOffset : xBase - xOffset;
    
    const ySpacing = 100 / (cols + 1);
    const y = ySpacing * (col + 1);
    
    positions.push({ x, y });
  }
  
  return positions;
};

/**
 * Adds a new player to a team
 */
export const addPlayer = (
  team: Player[],
  teamType: "red" | "blue"
): Player => {
  const prefix = teamType === "red" ? "R" : "B";
  
  // Find the highest existing number
  const maxNumber = team.length > 0
    ? Math.max(...team.map(p => p.number))
    : 0;
  
  const nextNumber = maxNumber + 1;
  const nextId = `${prefix}${nextNumber}`;
  
  // Default position: center of field for that team's side
  const defaultX = teamType === "red" ? 25 : 75;
  const defaultY = 50;
  
  const newPlayer: Player = {
    id: nextId,
    team: teamType,
    number: nextNumber,
    position: { x: defaultX, y: defaultY },
    isGoalkeeper: false,
  };
  
  return newPlayer;
};

/**
 * Removes a player from a team
 */
export const removePlayer = (
  team: Player[],
  playerId: string
): Player[] => {
  return team.filter(p => p.id !== playerId);
};

/**
 * Validates player count based on mode
 */
export const validatePlayerCount = (
  team: Player[],
  mode: "game" | "training"
): boolean => {
  if (mode === "game") {
    return team.length === DEFAULT_GAME_PLAYER_COUNT;
  }
  // Training mode: any count is valid (including 0)
  return true;
};

/**
 * Creates a game mode team (always 11 players with GK)
 */
export const createGameModeTeam = (team: "red" | "blue"): Player[] => {
  return createInitialTeam(team, DEFAULT_GAME_PLAYER_COUNT, true);
};

