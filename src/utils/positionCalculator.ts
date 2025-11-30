import { Position, Player, BoardState, SetPieceAction, DrillAction, TacticalPhaseAction } from '../types';
import { FIELD_ZONES, getFormationPositions } from './formationDefinitions';
import { calculateAPCPositions, calculateDPCPositions, calculateDrillPositions, getOutletPositions, getPressPositions, getShootoutPositions } from './tacticalTemplates';

export const resolveFieldZone = (zone: string): Position | null => {
  const normalizedZone = zone.toLowerCase().trim();

  // Center positions
  if (normalizedZone.includes('center') || normalizedZone.includes('centre')) {
    const x = normalizedZone.includes('defensive') || normalizedZone.includes('defence') || normalizedZone.includes('def')
      ? FIELD_ZONES.DEFENSIVE_THIRD_END / 2
      : normalizedZone.includes('midfield') || normalizedZone.includes('mid')
        ? (FIELD_ZONES.MIDFIELD_START + FIELD_ZONES.MIDFIELD_END) / 2
        : normalizedZone.includes('attacking') || normalizedZone.includes('attack')
          ? (FIELD_ZONES.ATTACKING_THIRD_START + FIELD_ZONES.ATTACKING_THIRD_END) / 2
          : FIELD_ZONES.CENTER;

    return { x, y: FIELD_ZONES.CENTER };
  }

  // Left/Right positions
  if (normalizedZone.includes('left')) {
    const x = normalizedZone.includes('defensive') || normalizedZone.includes('defence') || normalizedZone.includes('def')
      ? FIELD_ZONES.DEFENSIVE_THIRD_END / 2
      : normalizedZone.includes('midfield') || normalizedZone.includes('mid')
        ? (FIELD_ZONES.MIDFIELD_START + FIELD_ZONES.MIDFIELD_END) / 2
        : normalizedZone.includes('attacking') || normalizedZone.includes('attack')
          ? (FIELD_ZONES.ATTACKING_THIRD_START + FIELD_ZONES.ATTACKING_THIRD_END) / 2
          : FIELD_ZONES.CENTER;

    return { x, y: FIELD_ZONES.LEFT_CENTER };
  }

  if (normalizedZone.includes('right')) {
    const x = normalizedZone.includes('defensive') || normalizedZone.includes('defence') || normalizedZone.includes('def')
      ? FIELD_ZONES.DEFENSIVE_THIRD_END / 2
      : normalizedZone.includes('midfield') || normalizedZone.includes('mid')
        ? (FIELD_ZONES.MIDFIELD_START + FIELD_ZONES.MIDFIELD_END) / 2
        : normalizedZone.includes('attacking') || normalizedZone.includes('attack')
          ? (FIELD_ZONES.ATTACKING_THIRD_START + FIELD_ZONES.ATTACKING_THIRD_END) / 2
          : FIELD_ZONES.CENTER;

    return { x, y: FIELD_ZONES.RIGHT_CENTER };
  }

  // Specific zones
  if (normalizedZone.includes('goalkeeper') || normalizedZone.includes('gk') || normalizedZone.includes('goal')) {
    return { x: 5, y: FIELD_ZONES.CENTER };
  }

  return null;
};

export const findPlayerByReference = (
  reference: string,
  boardState: BoardState
): Player | null => {
  const normalizedRef = reference.toLowerCase().trim();

  // Check for team color
  const isRedTeam = normalizedRef.includes('red');
  const isBlueTeam = normalizedRef.includes('blue');

  // Extract number
  const numberMatch = normalizedRef.match(/\d+/);
  if (!numberMatch) {
    return null;
  }

  const number = parseInt(numberMatch[0], 10);

  // Search in appropriate team(s)
  if (isRedTeam) {
    return boardState.redTeam.find((p) => p.number === number) || null;
  } else if (isBlueTeam) {
    return boardState.blueTeam.find((p) => p.number === number) || null;
  } else {
    // Search both teams
    return (
      boardState.redTeam.find((p) => p.number === number) ||
      boardState.blueTeam.find((p) => p.number === number) ||
      null
    );
  }
};

export const calculateFormationPositions = (
  formationName: string,
  isHomeTeam: boolean
): Position[] => {
  return getFormationPositions(formationName, isHomeTeam);
};

export const calculateRelativePosition = (
  target: Player | Position,
  relation: string,
  _boardState: BoardState
): Position | null => {
  const targetPos = 'position' in target ? target.position : target;
  const normalizedRelation = relation.toLowerCase().trim();

  // "Near", "next to", "beside" - offset slightly
  if (normalizedRelation.includes('near') || normalizedRelation.includes('next to') || normalizedRelation.includes('beside')) {
    const offset = 5; // 5% offset
    return {
      x: Math.min(100, Math.max(0, targetPos.x + offset)),
      y: targetPos.y,
    };
  }

  // "Behind" - move back
  if (normalizedRelation.includes('behind')) {
    return {
      x: Math.max(0, targetPos.x - 10),
      y: targetPos.y,
    };
  }

  // "In front of" or "ahead" - move forward
  if (normalizedRelation.includes('front') || normalizedRelation.includes('ahead')) {
    return {
      x: Math.min(100, targetPos.x + 10),
      y: targetPos.y,
    };
  }

  // "To the left" - move left
  if (normalizedRelation.includes('left')) {
    return {
      x: targetPos.x,
      y: Math.max(0, targetPos.y - 10),
    };
  }

  // "To the right" - move right
  if (normalizedRelation.includes('right')) {
    return {
      x: targetPos.x,
      y: Math.min(100, targetPos.y + 10),
    };
  }

  return null;
};

export const validatePosition = (position: Position): boolean => {
  return position.x >= 0 && position.x <= 100 && position.y >= 0 && position.y <= 100;
};

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

export const checkPlayerOverlap = (
  newPosition: Position,
  allPlayers: Array<{ position: Position }>,
  minDistance: number = 3
): boolean => {
  return allPlayers.some((player) => calculateDistance(newPosition, player.position) < minDistance);
};

export const resolveOverlaps = (
  moves: Array<{ targetId: string; newPosition: Position; explanation?: string }>,
  existingPlayers: Array<{ id: string; position: Position }>,
  minDistance: number = 4 // Increased slightly to ensure visual separation
): Array<{ targetId: string; newPosition: Position; explanation?: string }> => {
  const resolvedMoves = [...moves];
  const MAX_ITERATIONS = 10;

  // We need to check against both other moving players AND stationary players
  // But primarily we want to fix the *moves* themselves relative to each other

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let hasOverlap = false;

    // Check for overlaps between moving players
    for (let j = 0; j < resolvedMoves.length; j++) {
      for (let k = j + 1; k < resolvedMoves.length; k++) {
        const p1 = resolvedMoves[j];
        const p2 = resolvedMoves[k];

        const dist = calculateDistance(p1.newPosition, p2.newPosition);

        if (dist < minDistance && dist > 0) { // dist > 0 to avoid divide by zero if exact same pos
          hasOverlap = true;

          // Push apart
          const overlap = minDistance - dist;
          const dx = p2.newPosition.x - p1.newPosition.x;
          const dy = p2.newPosition.y - p1.newPosition.y;

          // Normalize
          const nx = dx / dist;
          const ny = dy / dist;

          // Move both equally apart
          const moveX = nx * overlap * 0.5;
          const moveY = ny * overlap * 0.5;

          resolvedMoves[j].newPosition.x -= moveX;
          resolvedMoves[j].newPosition.y -= moveY;
          resolvedMoves[k].newPosition.x += moveX;
          resolvedMoves[k].newPosition.y += moveY;
        } else if (dist === 0) {
          // Exact overlap, just jitter one
          hasOverlap = true;
          resolvedMoves[k].newPosition.x += 1;
        }
      }
    }

    // Check against stationary players (those not being moved)
    // We only move the *moving* player in this case
    const movingIds = new Set(resolvedMoves.map(m => m.targetId));
    const stationaryPlayers = existingPlayers.filter(p => !movingIds.has(p.id));

    for (let j = 0; j < resolvedMoves.length; j++) {
      const mover = resolvedMoves[j];

      for (const stationary of stationaryPlayers) {
        const dist = calculateDistance(mover.newPosition, stationary.position);

        if (dist < minDistance) {
          hasOverlap = true;

          // Push mover away from stationary
          let dx = mover.newPosition.x - stationary.position.x;
          let dy = mover.newPosition.y - stationary.position.y;

          if (dx === 0 && dy === 0) {
            dx = 1; dy = 0;
          }

          const currentDist = Math.sqrt(dx * dx + dy * dy);
          const overlap = minDistance - currentDist;

          const nx = dx / currentDist;
          const ny = dy / currentDist;

          mover.newPosition.x += nx * overlap;
          mover.newPosition.y += ny * overlap;
        }
      }
    }

    if (!hasOverlap) break;
  }

  // Ensure bounds
  resolvedMoves.forEach(move => {
    move.newPosition.x = Math.max(0, Math.min(100, move.newPosition.x));
    move.newPosition.y = Math.max(0, Math.min(100, move.newPosition.y));
  });

  return resolvedMoves;
};


export interface ShapeConfig {
  type: 'circle' | 'line' | 'grid';
  center?: Position; // For circle/grid
  radius?: number; // For circle
  start?: Position; // For line
  end?: Position; // For line
  rows?: number; // For grid
  cols?: number; // For grid
  players: string[]; // List of player IDs in order
}

export const calculateShapePositions = (config: ShapeConfig): Array<{ targetId: string; newPosition: Position }> => {
  const { type, players } = config;
  const moves: Array<{ targetId: string; newPosition: Position }> = [];

  if (type === 'circle') {
    const center = config.center || { x: 50, y: 50 };
    const radius = config.radius || 25;
    const angleStep = (2 * Math.PI) / players.length;

    players.forEach((playerId, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      moves.push({
        targetId: playerId,
        newPosition: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) },
      });
    });
  } else if (type === 'line') {
    const start = config.start || { x: 10, y: 50 };
    const end = config.end || { x: 90, y: 50 };

    players.forEach((playerId, index) => {
      const t = players.length > 1 ? index / (players.length - 1) : 0.5;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      moves.push({
        targetId: playerId,
        newPosition: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) },
      });
    });
  } else if (type === 'grid') {
    const center = config.center || { x: 50, y: 50 };
    const cols = config.cols || Math.ceil(Math.sqrt(players.length));
    const rows = config.rows || Math.ceil(players.length / cols);
    const spacingX = 10;
    const spacingY = 10;

    const startX = center.x - ((cols - 1) * spacingX) / 2;
    const startY = center.y - ((rows - 1) * spacingY) / 2;

    players.forEach((playerId, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      moves.push({
        targetId: playerId,
        newPosition: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) },
      });
    });
  }

  return moves;
};

export const calculateTacticalPositions = (
  action: SetPieceAction | DrillAction | TacticalPhaseAction,
  boardState: BoardState
): Array<{ targetId: string; newPosition: Position; explanation?: string }> => {
  let moves: Array<{ targetId: string; newPosition: Position }> = [];
  const explanation = action.explanation;

  // Default Assumption: Red is Attacking Team, Blue is Defending Team
  // In a full game engine, we'd track possession.
  const attackingTeam = boardState.redTeam;
  const defendingTeam = boardState.blueTeam;
  const isRightSideGoal = true; // Attacking towards Right (x=100)

  if (action.action === 'set_piece') {
    if (action.type === 'APC') {
      // Setup Attackers for APC
      const attackerMoves = calculateAPCPositions(action.parameters, attackingTeam, isRightSideGoal);
      
      // Setup Defenders for Default DPC (to ensure clean board)
      // Even though it's an "APC" command, we need to manage the opponents
      const defenderMoves = calculateDPCPositions({}, defendingTeam, isRightSideGoal);
      
      moves = [...attackerMoves, ...defenderMoves];
    } else if (action.type === 'DPC') {
      // Setup Defenders for DPC
      const defenderMoves = calculateDPCPositions(action.parameters, defendingTeam, isRightSideGoal);
      
      // Setup Attackers for APC (to ensure clean board)
      // Assuming standard 1 battery attack if not specified
      const attackerMoves = calculateAPCPositions({}, attackingTeam, isRightSideGoal);
      
      moves = [...defenderMoves, ...attackerMoves];
    } else if (action.type === 'shootout') {
      // Setup Shootout positions
      moves = getShootoutPositions(action.parameters.attackerId, action.parameters.gkId, boardState);
    }
  } else if (action.action === 'drill') {
    moves = calculateDrillPositions(action.parameters, attackingTeam, defendingTeam);
  } else if (action.action === 'tactical_phase') {
    // Get the team players
    const teamPlayers = action.team === 'red' ? boardState.redTeam : boardState.blueTeam;
    
    if (action.type === 'outlet') {
      moves = getOutletPositions(action.structure, action.team, teamPlayers);
    } else if (action.type === 'press') {
      moves = getPressPositions(action.structure, action.team, teamPlayers, action.intensity);
    }
  }

  return moves.map(m => ({ ...m, explanation: explanation || 'Tactical move' }));
};
