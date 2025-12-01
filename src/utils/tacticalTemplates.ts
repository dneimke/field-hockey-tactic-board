import { Position, Player, SetPieceAction, DrillAction, BoardState } from '../types';

// Helper to calculate X position on the D arc given a Y position
const getCircleX = (y: number, isRightGoal: boolean): number => {
  // Standard Pitch Dimensions
  // X: 0-100 = 91.4m -> 1 unit = 0.914m
  // Y: 0-100 = 55m -> 1 unit = 0.55m
  // Radius = 14.63m
  // Radius in X units = 14.63 / 0.914 = ~16.0
  // Radius in Y units = 14.63 / 0.55 = ~26.6
  
  const Rx = 16.0;
  const Ry = 26.6;
  const CenterY = 50;
  const GoalX = isRightGoal ? 100 : 0;
  
  // Ellipse equation: ((x-h)/Rx)^2 + ((y-k)/Ry)^2 = 1
  // (x-h)^2 = Rx^2 * (1 - ((y-k)/Ry)^2)
  
  const dy = y - CenterY;
  const term = 1 - (dy * dy) / (Ry * Ry);
  
  if (term < 0) return GoalX; // Inside/Outside range, snap to goal line
  
  const dx = Rx * Math.sqrt(term);
  
  return isRightGoal ? GoalX - dx : GoalX + dx;
};

// APC: Attacking Penalty Corner
export const calculateAPCPositions = (
  config: SetPieceAction['parameters'],
  attackers: Player[],
  isRightSideGoal: boolean = true // Default to attacking right goal
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  // Separate GK and Field Players
  const gk = attackers.find(p => p.isGoalkeeper);
  const fieldPlayers = attackers.filter(p => !p.isGoalkeeper);
  const availableAttackers = [...fieldPlayers];
  
  const forwardDir = isRightSideGoal ? -1 : 1;
  
  // 0. Attacking GK: Keep in goal position (do not move to center)
  // The GK should remain in their defensive position during a PC attack
  if (gk) {
    // Keep GK in goal (slightly off the backline for visibility)
    const gkX = isRightSideGoal ? 95 : 5;
    moves.push({
      targetId: gk.id,
      newPosition: { x: gkX, y: 50 }
    });
  }

  // 1. Injector
  const injectorIdx = config.injectorId 
    ? availableAttackers.findIndex(p => p.id === config.injectorId)
    : 0; // Default to first available field player
    
  if (injectorIdx !== -1 && availableAttackers.length > 0) {
    const injector = availableAttackers[injectorIdx];
    // Injector should be on the backline, 10m from post
    // Post is at y=47/53. 10m is approx 18 units.
    // Standard spot is usually 10m mark (y=45 or y=55)
    // Position slightly off the backline (x offset) to ensure visibility and correct placement
    const yPos = config.injectorSide === 'left' ? 45 : 55;
    // Position injector on backline but slightly offset to avoid appearing inside goal
    // For right goal (x=100), place at x=99.5; for left goal (x=0), place at x=0.5
    const injectorX = isRightSideGoal ? 99.5 : 0.5;
    moves.push({
      targetId: injector.id,
      newPosition: { x: injectorX, y: yPos }
    });
    availableAttackers.splice(injectorIdx, 1);
  }

  // 2. Batteries
  const batteries: Array<{y: number, players: Player[]}> = [];
  
  // Top Battery (y=50)
  if (availableAttackers.length >= 2) {
    const stopper = availableAttackers.shift()!;
    const hitter = availableAttackers.shift()!;
    batteries.push({ y: 50, players: [stopper, hitter] });
  }

  // Second Battery (if requested)
  if (config.batteries === 2 && availableAttackers.length >= 2) {
    const stopper = availableAttackers.shift()!;
    const hitter = availableAttackers.shift()!;
    // Place at y=65? Or y=35 if side preference? Default to Right/Bottom side (y>50)
    batteries.push({ y: 65, players: [stopper, hitter] });
  }
  
  // Place Batteries
  batteries.forEach(battery => {
    const batX = getCircleX(battery.y, isRightSideGoal);
    const [stopper, hitter] = battery.players;
    
    // Stopper exactly on line
    moves.push({
      targetId: stopper.id,
      newPosition: { x: batX, y: battery.y }
    });
    // Hitter 1m behind (approx 1.1 units X)
    moves.push({
      targetId: hitter.id,
      newPosition: { x: batX + (forwardDir * 1.5), y: battery.y } 
    });
  });

  // 3. Troop (Remaining attackers)
  // Distribute around the D arc, avoiding battery positions
  // Preferred Y positions around the D
  // Cover both sides: 25-45 (Left/Top side) and 55-75 (Right/Bottom side)
  const preferredYs = [25, 30, 35, 40, 45, 55, 60, 70, 75];
  
  // Filter out Ys that are close to batteries
  // A battery takes up space approx +/- 4 units around its Y
  const validYs = preferredYs.filter(y => 
    !batteries.some(b => Math.abs(b.y - y) < 6)
  );

  availableAttackers.forEach((p, i) => {
    // Cycle through valid positions
    const yIndex = i % validYs.length;
    const y = validYs[yIndex];
    
    // Add some jitter if wrapping around to avoid exact overlaps
    const jitter = Math.floor(i / validYs.length) * 2;
    // Alternating +/- jitter
    const finalY = y + (i % 2 === 0 ? jitter : -jitter);
    
    const x = getCircleX(finalY, isRightSideGoal);
    
    moves.push({
      targetId: p.id,
      newPosition: { x: x, y: finalY }
    });
  });

  return moves;
};

// DPC: Defensive Penalty Corner
export const calculateDPCPositions = (
  config: SetPieceAction['parameters'],
  defenders: Player[],
  isDefendingRightGoal: boolean = true
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  // Separate GK and Field Players
  const gk = defenders.find(p => p.isGoalkeeper);
  const fieldPlayers = defenders.filter(p => !p.isGoalkeeper);
  const availableDefenders = [...fieldPlayers];
  
  const goalX = isDefendingRightGoal ? 100 : 0;
  
  // 1. GK
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: goalX, y: 50 }
    });
  }

  // 2. Runners (Standard is 4)
  const runnerCount = config.runnerCount || 4;
  const runners = availableDefenders.splice(0, Math.min(availableDefenders.length, runnerCount));
  
  // '1-3' structure (1 trail, 3 line) or similar
  // Place them inside goal/backline
  // 1st runner (First Wave) - usually left post
  if (runners.length > 0) {
    moves.push({ targetId: runners[0].id, newPosition: { x: goalX, y: 48 } });
  }
  // 2nd runner (Second Wave) - usually right post
  if (runners.length > 1) {
    moves.push({ targetId: runners[1].id, newPosition: { x: goalX, y: 52 } });
  }
  // 3rd runner - further out or deep
  if (runners.length > 2) {
    moves.push({ targetId: runners[2].id, newPosition: { x: goalX, y: 46 } });
  }
  // 4th runner
  if (runners.length > 3) {
    moves.push({ targetId: runners[3].id, newPosition: { x: goalX, y: 54 } });
  }

  // 3. Rest (Halfway)
  // CRITICAL: Filter out the Goalkeeper when calculating the "Rest of Team" group
  const halfwayX = 50;
  availableDefenders.filter(p => !p.isGoalkeeper).forEach((p, i) => {
    moves.push({
      targetId: p.id,
      newPosition: { x: halfwayX, y: 30 + (i * 5) }
    });
  });

  return moves;
};

// Helper function to get zone boundaries
const getZoneBoundaries = (
  zone: 'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field',
  gameIndex: number = 0,
  totalGames: number = 1
): { zoneXStart: number; zoneXEnd: number; zoneYStart: number; zoneYEnd: number } => {
  let zoneXStart = 0, zoneXEnd = 100;
  const zoneYStart = 0;
  const zoneYEnd = 100;
  
  switch (zone) {
    case 'attacking_25':
      zoneXStart = 75; zoneXEnd = 100;
      break;
    case 'midfield':
      // For multiple games in midfield, split into left and right halves
      if (totalGames > 1 && zone === 'midfield') {
        const midWidth = 33; // Midfield width (33 to 66)
        const gameWidth = midWidth / totalGames;
        zoneXStart = 33 + (gameIndex * gameWidth);
        zoneXEnd = 33 + ((gameIndex + 1) * gameWidth);
        // Also split vertically for better separation
        const gameHeight = 100 / totalGames;
        return {
          zoneXStart,
          zoneXEnd,
          zoneYStart: gameIndex * gameHeight,
          zoneYEnd: (gameIndex + 1) * gameHeight
        };
      } else {
        zoneXStart = 33; zoneXEnd = 66;
      }
      break;
    case 'defensive_circle':
      zoneXStart = 0; zoneXEnd = 25; // Using 25 as approx 23m area which includes circle
      break;
    case 'full_field':
    default:
      // Default full field
      break;
  }
  
  return { zoneXStart, zoneXEnd, zoneYStart, zoneYEnd };
};

// Helper function to position players for a single game
const positionPlayersForGame = (
  gameAttackers: Player[],
  gameDefenders: Player[],
  gameGoalkeepers: Player[],
  zone: 'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field',
  gameIndex: number,
  totalGames: number,
  withGK: boolean
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const { zoneXStart, zoneXEnd, zoneYStart, zoneYEnd } = getZoneBoundaries(zone, gameIndex, totalGames);
  const zoneWidth = zoneXEnd - zoneXStart;
  const zoneHeight = zoneYEnd - zoneYStart;
  const centerX = zoneXStart + zoneWidth / 2;
  const centerY = zoneYStart + zoneHeight / 2;

  // Distribute Attackers (Wide Arc / Shape)
  gameAttackers.forEach((p, i) => {
    const spreadX = zoneWidth * 0.6;
    const spreadY = zoneHeight * 0.8;
    
    const t = gameAttackers.length > 1 ? i / (gameAttackers.length - 1) : 0.5;
    const xOffset = Math.sin(t * Math.PI) * (spreadX / 2);
    const yPos = zoneYStart + (zoneHeight * 0.1) + (t * spreadY);
    const xPos = zoneXStart + (zoneWidth * 0.2) + xOffset;

    moves.push({
      targetId: p.id,
      newPosition: { x: xPos, y: yPos }
    });
  });

  // Handle goalkeepers if explicitly requested
  if (withGK && gameGoalkeepers.length > 0) {
    const gk = gameGoalkeepers[0];
    const gkX = zone === 'attacking_25' ? 100 : (zone === 'defensive_circle' ? 0 : centerX);
    moves.push({ targetId: gk.id, newPosition: { x: gkX, y: 50 } });
    
    gameGoalkeepers.slice(1).forEach((p) => {
      moves.push({ targetId: p.id, newPosition: { x: -5, y: 50 } });
    });
  }

  // Distribute Defenders (Compact, between ball/attackers and goal)
  gameDefenders.forEach((p, i) => {
    const spreadY = zoneHeight * 0.4;
    const t = gameDefenders.length > 1 ? i / (gameDefenders.length - 1) : 0.5;
    
    const xPos = centerX + (zoneWidth * 0.2);
    const yPos = centerY - (spreadY/2) + (t * spreadY);

    moves.push({
      targetId: p.id,
      newPosition: { x: xPos, y: yPos }
    });
  });
  
  return moves;
};

// Drills / Small Sided Games
export const calculateDrillPositions = (
  config: DrillAction['parameters'],
  attackers: Player[],
  defenders: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  // CRITICAL: Filter out goalkeepers first, then select field players
  // "5v5" means 5 FIELD PLAYERS per team, not including goalkeepers
  const fieldAttackers = attackers.filter(p => !p.isGoalkeeper);
  const fieldDefenders = defenders.filter(p => !p.isGoalkeeper);
  const goalkeepers = [...attackers, ...defenders].filter(p => p.isGoalkeeper);

  // Determine number of games
  const gameCount = config.gameCount || 1;
  
  // Determine zones for each game
  const gameZones: Array<'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field'> = [];
  if (config.gameZones && config.gameZones.length === gameCount) {
    gameZones.push(...config.gameZones);
  } else {
    // Auto-distribute: if multiple games and zone is midfield, split it
    // Otherwise, use the same zone for all games
    for (let i = 0; i < gameCount; i++) {
      gameZones.push(config.zone);
    }
  }

  // Calculate total players needed across all games
  const totalAttackersNeeded = config.attackers * gameCount;
  const totalDefendersNeeded = config.defenders * gameCount;

  // Select field players (may need more if multiple games)
  const activeAttackers = fieldAttackers.slice(0, totalAttackersNeeded);
  const activeDefenders = fieldDefenders.slice(0, totalDefendersNeeded);
  
  // Move unused field players to bench (off-field or sideline)
  const unusedAttackers = fieldAttackers.slice(totalAttackersNeeded);
  const unusedDefenders = fieldDefenders.slice(totalDefendersNeeded);
  
  unusedAttackers.forEach((p) => moves.push({ targetId: p.id, newPosition: { x: -5, y: -5 } })); // Off-field
  unusedDefenders.forEach((p) => moves.push({ targetId: p.id, newPosition: { x: 105, y: 105 } })); // Off-field

  // Handle goalkeepers: move off-field unless explicitly requested
  if (!config.withGK) {
    goalkeepers.forEach((p) => {
      moves.push({ targetId: p.id, newPosition: { x: -5, y: 50 } }); // Off-field
    });
  }

  // Distribute players across games
  for (let gameIndex = 0; gameIndex < gameCount; gameIndex++) {
    const gameAttackers = activeAttackers.slice(
      gameIndex * config.attackers,
      (gameIndex + 1) * config.attackers
    );
    const gameDefenders = activeDefenders.slice(
      gameIndex * config.defenders,
      (gameIndex + 1) * config.defenders
    );
    
    // Distribute goalkeepers across games if requested
    const gameGoalkeepers = config.withGK && goalkeepers.length > 0
      ? [goalkeepers[gameIndex % goalkeepers.length]].filter(Boolean)
      : [];

    const gameZone = gameZones[gameIndex];
    const gameMoves = positionPlayersForGame(
      gameAttackers,
      gameDefenders,
      gameGoalkeepers,
      gameZone,
      gameIndex,
      gameCount,
      config.withGK
    );
    
    moves.push(...gameMoves);
  }
  
  return moves;
};

// Helper to mirror X coordinate for blue team
const mirrorX = (x: number, team: 'red' | 'blue'): number => {
  return team === 'blue' ? 100 - x : x;
};

// Outletting Structures

// Back 4 (Dish) structure
const calculateBack4 = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  // Separate GK and Field Players
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  // GK stays in goal
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Need at least 4 field players for Back 4
  if (availablePlayers.length < 4) {
    // If not enough players, distribute what we have
    availablePlayers.forEach((p, i) => {
      const x = mirrorX(10 + (i * 5), team);
      const y = 20 + (i * 20);
      moves.push({ targetId: p.id, newPosition: { x, y } });
    });
    return moves;
  }
  
  // CBs deep and split (x≈10, y≈35/65)
  if (availablePlayers.length >= 2) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(10, team), y: 35 }
    });
    moves.push({
      targetId: availablePlayers[1].id,
      newPosition: { x: mirrorX(10, team), y: 65 }
    });
    availablePlayers.splice(0, 2);
  }
  
  // Fullbacks wide and higher (x≈25, y≈5/95)
  if (availablePlayers.length >= 2) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(25, team), y: 5 }
    });
    moves.push({
      targetId: availablePlayers[1].id,
      newPosition: { x: mirrorX(25, team), y: 95 }
    });
    availablePlayers.splice(0, 2);
  }
  
  // Remaining players distribute in midfield
  availablePlayers.forEach((p, i) => {
    const x = mirrorX(35 + (i * 3), team);
    const y = 20 + (i * 15);
    moves.push({ targetId: p.id, newPosition: { x, y } });
  });
  
  return moves;
};

// Back 3 (Cup) structure
const calculateBack3 = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Need at least 3 field players for Back 3
  if (availablePlayers.length < 3) {
    availablePlayers.forEach((p, i) => {
      const x = mirrorX(10 + (i * 5), team);
      const y = 30 + (i * 20);
      moves.push({ targetId: p.id, newPosition: { x, y } });
    });
    return moves;
  }
  
  // Central CB high (x≈20, y=50)
  if (availablePlayers.length > 0) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(20, team), y: 50 }
    });
    availablePlayers.splice(0, 1);
  }
  
  // Side backs deep and wide (x≈10, y≈20/80)
  if (availablePlayers.length >= 2) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(10, team), y: 20 }
    });
    moves.push({
      targetId: availablePlayers[1].id,
      newPosition: { x: mirrorX(10, team), y: 80 }
    });
    availablePlayers.splice(0, 2);
  }
  
  // Remaining players distribute
  availablePlayers.forEach((p, i) => {
    const x = mirrorX(35 + (i * 3), team);
    const y = 20 + (i * 15);
    moves.push({ targetId: p.id, newPosition: { x, y } });
  });
  
  return moves;
};

// Three High structure
const calculateThreeHigh = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Need at least 3 field players
  if (availablePlayers.length < 3) {
    availablePlayers.forEach((p, i) => {
      const x = mirrorX(10 + (i * 15), team);
      const y = 30 + (i * 20);
      moves.push({ targetId: p.id, newPosition: { x, y } });
    });
    return moves;
  }
  
  // Single deep CB (x≈10, y=50)
  if (availablePlayers.length > 0) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(10, team), y: 50 }
    });
    availablePlayers.splice(0, 1);
  }
  
  // Two very high side backs (x≈40)
  if (availablePlayers.length >= 2) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(40, team), y: 25 }
    });
    moves.push({
      targetId: availablePlayers[1].id,
      newPosition: { x: mirrorX(40, team), y: 75 }
    });
    availablePlayers.splice(0, 2);
  }
  
  // Remaining players distribute
  availablePlayers.forEach((p, i) => {
    const x = mirrorX(30 + (i * 3), team);
    const y = 20 + (i * 15);
    moves.push({ targetId: p.id, newPosition: { x, y } });
  });
  
  return moves;
};

// Asymmetric Right structure
const calculateAsymmetricRight = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Asymmetric right: stronger right side
  // Distribute players with more on the right (higher y values)
  availablePlayers.forEach((p, i) => {
    const x = mirrorX(10 + (i % 3) * 8, team);
    const y = 40 + (i * 8); // Bias toward right side
    moves.push({ targetId: p.id, newPosition: { x, y } });
  });
  
  return moves;
};

// Asymmetric Left structure
const calculateAsymmetricLeft = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Asymmetric left: stronger left side
  // Distribute players with more on the left (lower y values)
  availablePlayers.forEach((p, i) => {
    const x = mirrorX(10 + (i % 3) * 8, team);
    const y = 60 - (i * 8); // Bias toward left side
    moves.push({ targetId: p.id, newPosition: { x, y } });
  });
  
  return moves;
};

// Outlet pattern map
const OUTLET_PATTERNS: Record<string, (team: 'red' | 'blue', players: Player[]) => Array<{ targetId: string; newPosition: Position }>> = {
  'back_4': calculateBack4,
  'back_3': calculateBack3,
  'three_high': calculateThreeHigh,
  'asymmetric_right': calculateAsymmetricRight,
  'asymmetric_left': calculateAsymmetricLeft,
};

// Main outlet function
export const getOutletPositions = (
  structure: string,
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const normalizedStructure = structure.toLowerCase().replace(/[-\s]/g, '_');
  const calculator = OUTLET_PATTERNS[normalizedStructure] || OUTLET_PATTERNS['back_4'];
  return calculator(team, players);
};

// Pressing Structures

// Full Court Press
const calculateFullCourtPress = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  // GK stays deep
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Full court: Man-to-man matching high (x > 75)
  // Distribute all 10 outfield players high up the field
  const forwardX = mirrorX(80, team);
  availablePlayers.forEach((p, i) => {
    const y = 10 + (i * 8); // Spread across width
    moves.push({ targetId: p.id, newPosition: { x: forwardX, y } });
  });
  
  return moves;
};

// Half Court Zone
const calculateHalfCourtZone = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Half Court: All 10 outfield players behind x=50
  // 3 lines: Forward (x=45), Midfield (x=35), Defense (x=25)
  const forwardLine = mirrorX(45, team);
  const midfieldLine = mirrorX(35, team);
  const defenseLine = mirrorX(25, team);
  
  // Distribute players across 3 lines
  const playersPerLine = Math.ceil(availablePlayers.length / 3);
  
  availablePlayers.forEach((p, i) => {
    let x: number;
    if (i < playersPerLine) {
      x = forwardLine; // Forward line
    } else if (i < playersPerLine * 2) {
      x = midfieldLine; // Midfield line
    } else {
      x = defenseLine; // Defense line
    }
    
    const lineIndex = i % playersPerLine;
    const y = 15 + (lineIndex * (70 / Math.max(playersPerLine - 1, 1)));
    moves.push({ targetId: p.id, newPosition: { x, y } });
  });
  
  return moves;
};

// W-Press structure
const calculateWPress = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // W-Press: Specific shape for forwards
  // Center Forward (x=60, y=50)
  if (availablePlayers.length > 0) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(60, team), y: 50 }
    });
    availablePlayers.splice(0, 1);
  }
  
  // Wingers (x=60, y=20/80)
  if (availablePlayers.length >= 2) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(60, team), y: 20 }
    });
    moves.push({
      targetId: availablePlayers[1].id,
      newPosition: { x: mirrorX(60, team), y: 80 }
    });
    availablePlayers.splice(0, 2);
  }
  
  // Inner Mids (x=50, y=35/65)
  if (availablePlayers.length >= 2) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(50, team), y: 35 }
    });
    moves.push({
      targetId: availablePlayers[1].id,
      newPosition: { x: mirrorX(50, team), y: 65 }
    });
    availablePlayers.splice(0, 2);
  }
  
  // Remaining players distribute behind
  availablePlayers.forEach((p, i) => {
    const x = mirrorX(40 - (i * 3), team);
    const y = 20 + (i * 15);
    moves.push({ targetId: p.id, newPosition: { x, y } });
  });
  
  return moves;
};

// Split Vision Press
const calculateSplitVision = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Split Vision: Split the field, press on one side
  // Distribute players with emphasis on one side
  const halfCount = Math.ceil(availablePlayers.length / 2);
  
  availablePlayers.forEach((p, i) => {
    if (i < halfCount) {
      // Left side press (lower y)
      const x = mirrorX(55, team);
      const y = 20 + (i * 10);
      moves.push({ targetId: p.id, newPosition: { x, y } });
    } else {
      // Right side drop (higher y)
      const x = mirrorX(35, team);
      const y = 60 + ((i - halfCount) * 10);
      moves.push({ targetId: p.id, newPosition: { x, y } });
    }
  });
  
  return moves;
};

// Press pattern map
const PRESS_PATTERNS: Record<string, (team: 'red' | 'blue', players: Player[]) => Array<{ targetId: string; newPosition: Position }>> = {
  'full_court': calculateFullCourtPress,
  'half_court': calculateHalfCourtZone,
  'w_press': calculateWPress,
  'split_vision': calculateSplitVision,
};

// Main press function
export const getPressPositions = (
  structure: string,
  team: 'red' | 'blue',
  players: Player[],
  intensity?: number
): Array<{ targetId: string; newPosition: Position }> => {
  const normalizedStructure = structure.toLowerCase().replace(/[-\s]/g, '_');
  const calculator = PRESS_PATTERNS[normalizedStructure] || PRESS_PATTERNS['half_court'];
  let moves = calculator(team, players);
  
  // Adjust positions based on intensity (0-100)
  // Intensity affects the height of the press block
  if (intensity !== undefined && intensity >= 0 && intensity <= 100) {
    const intensityFactor = intensity / 100; // 0 to 1
    moves = moves.map(move => {
      // Only adjust outfield players (not GK)
      const player = players.find(p => p.id === move.targetId);
      if (player && !player.isGoalkeeper) {
        // Adjust X position based on intensity
        // Higher intensity = higher up the field
        const baseX = team === 'blue' ? 100 - move.newPosition.x : move.newPosition.x;
        const adjustedX = baseX + (intensityFactor * 20); // Can push up to 20 units higher
        return {
          ...move,
          newPosition: {
            ...move.newPosition,
            x: mirrorX(adjustedX, team)
          }
        };
      }
      return move;
    });
  }
  
  return moves;
};

// Shootout Positions
export const getShootoutPositions = (
  attackerId: string | undefined,
  gkId: string | undefined,
  boardState: BoardState
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  // Find attacker and goalkeeper
  const allPlayers = [...boardState.redTeam, ...boardState.blueTeam];
  const attacker = attackerId ? allPlayers.find(p => p.id === attackerId) : null;
  const gk = gkId ? allPlayers.find(p => p.id === gkId) : allPlayers.find(p => p.isGoalkeeper);
  
  // Determine which goal (attacker's team determines direction)
  const isAttackingRight = attacker ? attacker.team === 'red' : true; // Default to red attacking right
  
  // Attacker at center of 23m line (x=75, y=50 or x=25, y=50)
  if (attacker) {
    const attackerX = isAttackingRight ? 75 : 25;
    moves.push({
      targetId: attacker.id,
      newPosition: { x: attackerX, y: 50 }
    });
  }
  
  // Goalkeeper on goal line (x=100, y=50 or x=0, y=50)
  if (gk) {
    const gkX = isAttackingRight ? 100 : 0;
    moves.push({
      targetId: gk.id,
      newPosition: { x: gkX, y: 50 }
    });
  }
  
  // All other players moved behind center line (x=50) for isolation
  // Ensure no non-active players in 23m area (x < 23 or x > 77)
  const activeIds = new Set([attacker?.id, gk?.id].filter(Boolean));
  allPlayers.forEach(p => {
    if (!activeIds.has(p.id)) {
      // Move behind center line
      const x = 50;
      const y = 20 + (moves.length * 5); // Distribute vertically
      moves.push({
        targetId: p.id,
        newPosition: { x, y }
      });
    }
  });
  
  return moves;
};
