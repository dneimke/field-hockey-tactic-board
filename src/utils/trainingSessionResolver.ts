import { TrainingSessionRequest, Activity, BoardState, Position, Player, Equipment, Move } from '../types';
import { calculateDrillPositions } from './tacticalTemplates';
import { v4 as uuidv4 } from 'uuid';
import { FIELD_ANCHORS } from '../config/fieldAnchors';

const resolveAnchor = (anchor: string, offset?: { x: number; y: number }): Position => {
  const basePoint = FIELD_ANCHORS[anchor] || FIELD_ANCHORS.center_spot;
  if (offset) {
    return {
      x: Math.max(0, Math.min(100, basePoint.x + offset.x)),
      y: Math.max(0, Math.min(100, basePoint.y + offset.y)),
    };
  }
  return basePoint;
};

const allocateResources = (
  activities: Activity[],
  boardState: BoardState
): Map<string, { players: Player[]; goalkeepers: Player[] }> => {
  const allocation = new Map<string, { players: Player[]; goalkeepers: Player[] }>();
  const availableFieldPlayers = [
    ...boardState.redTeam.filter(p => !p.isGoalkeeper),
    ...boardState.blueTeam.filter(p => !p.isGoalkeeper),
  ];
  const availableGoalkeepers = [
    ...boardState.redTeam.filter(p => p.isGoalkeeper),
    ...boardState.blueTeam.filter(p => p.isGoalkeeper),
  ];
  const usedFieldPlayerIds = new Set<string>();
  const usedGKIds = new Set<string>();
  
  for (const activity of activities) {
    const allocatedPlayers: Player[] = [];
    const allocatedGKs: Player[] = [];
    for (const entityReq of activity.entities) {
      if (entityReq.type === 'player') {
        const needed = entityReq.count;
        let available = availableFieldPlayers.filter(p => !usedFieldPlayerIds.has(p.id));
        
        // Filter by team if specified (and not neutral)
        if (entityReq.team && entityReq.team !== 'neutral') {
          available = available.filter(p => p.team === entityReq.team);
        }
        
        for (let i = 0; i < Math.min(needed, available.length); i++) {
          const player = available[i];
          allocatedPlayers.push(player);
          usedFieldPlayerIds.add(player.id);
        }
      } else if (entityReq.type === 'gk') {
        const needed = entityReq.count;
        let available = availableGoalkeepers.filter(p => !usedGKIds.has(p.id));
        
        // Filter by team if specified (and not neutral)
        if (entityReq.team && entityReq.team !== 'neutral') {
          available = available.filter(p => p.team === entityReq.team);
        }
        
        for (let i = 0; i < Math.min(needed, available.length); i++) {
          const gk = available[i];
          allocatedGKs.push(gk);
          usedGKIds.add(gk.id);
        }
      }
    }
    allocation.set(activity.id, { players: allocatedPlayers, goalkeepers: allocatedGKs });
  }
  return allocation;
};

const calculateActivityPositions = (
  activity: Activity,
  allocatedResources: { players: Player[]; goalkeepers: Player[] },
  activityCenter: Position,
  startingBallIndex: number
): { moves: Move[]; equipment: Equipment[]; nextBallIndex: number } => {
  const moves: Move[] = [];
  const equipment: Equipment[] = [];
  let currentBallIndex = startingBallIndex;
  
  const allPlayers = [...allocatedResources.players, ...allocatedResources.goalkeepers];
  
  // Guard against empty player list to prevent division by zero or NaN calculations
  if (allPlayers.length > 0) {
    if (activity.template_type === 'small_sided_game') {
      const attackers = allocatedResources.players.slice(0, Math.ceil(allocatedResources.players.length / 2));
      const defenders = allocatedResources.players.slice(Math.ceil(allocatedResources.players.length / 2));
      const drillMoves = calculateDrillPositions(
        { attackers: attackers.length, defenders: defenders.length, withGK: allocatedResources.goalkeepers.length > 0, zone: 'full_field' },
        attackers,
        defenders
      );
      const localMoves = drillMoves.map(move => {
        const player = allPlayers.find(p => p.id === move.targetId);
        if (!player) return null;
        const index = allPlayers.findIndex(p => p.id === move.targetId);
        // Ensure we don't divide by zero (though check above should prevent this)
        const divisor = allPlayers.length || 1; 
        const angle = (index / divisor) * 2 * Math.PI;
        // Use 0 radius if only 1 total player, otherwise 8
        const radius = allPlayers.length === 1 ? 0 : 8;
        return {
          targetId: move.targetId,
          newPosition: {
            x: Math.max(0, Math.min(100, activityCenter.x + radius * Math.cos(angle))),
            y: Math.max(0, Math.min(100, activityCenter.y + radius * Math.sin(angle))),
          },
          explanation: `Positioned for ${activity.name}`,
        };
      }).filter((m): m is Move => m !== null);
      moves.push(...localMoves);
    } else {
      allPlayers.forEach((player, index) => {
        const divisor = allPlayers.length || 1;
        const angle = (index / divisor) * 2 * Math.PI;
        // Use 0 radius if only 1 total player, otherwise 6
        const radius = allPlayers.length === 1 ? 0 : 6;
        moves.push({
          targetId: player.id,
          newPosition: {
            x: Math.max(0, Math.min(100, activityCenter.x + radius * Math.cos(angle))),
            y: Math.max(0, Math.min(100, activityCenter.y + radius * Math.sin(angle))),
          },
          explanation: `Positioned for ${activity.name}`,
        });
      });
    }
  }
  
  for (const entityReq of activity.entities) {
    if (entityReq.type === 'cone') {
      for (let i = 0; i < entityReq.count; i++) {
        const angle = (i / entityReq.count) * 2 * Math.PI;
        // Use 0 radius if count is 1, otherwise 5
        const radius = entityReq.count === 1 ? 0 : 5;
        equipment.push({
          id: `equipment_${uuidv4()}`,
          type: 'cone',
          position: { x: Math.max(0, Math.min(100, activityCenter.x + radius * Math.cos(angle))), y: Math.max(0, Math.min(100, activityCenter.y + radius * Math.sin(angle))) },
          color: '#FFD700',
        });
      }
    } else if (entityReq.type === 'mini_goal') {
      for (let i = 0; i < entityReq.count; i++) {
        const offsetX = i % 2 === 0 ? -4 : 4;
        equipment.push({
          id: `equipment_${uuidv4()}`,
          type: 'mini_goal',
          position: { x: Math.max(0, Math.min(100, activityCenter.x + offsetX)), y: activityCenter.y },
        });
      }
    } else if (entityReq.type === 'coach') {
      for (let i = 0; i < entityReq.count; i++) {
        equipment.push({
          id: `equipment_${uuidv4()}`,
          type: 'coach',
          position: { x: activityCenter.x, y: activityCenter.y - 3 },
        });
      }
    } else if (entityReq.type === 'ball') {
      for (let i = 0; i < entityReq.count; i++) {
        // Determine ball ID: "ball" for index 0, "ball_2" for index 1, etc.
        const ballId = currentBallIndex === 0 ? 'ball' : `ball_${currentBallIndex + 1}`;
        
        // Place ball at activity center
        moves.push({
          targetId: ballId,
          newPosition: { x: activityCenter.x, y: activityCenter.y },
          explanation: `Placed for ${activity.name}`
        });
        
        currentBallIndex++;
      }
    }
  }
  return { moves, equipment, nextBallIndex: currentBallIndex };
};

export const resolveTrainingSession = (
  request: TrainingSessionRequest,
  boardState: BoardState
): { moves: Move[]; equipment: Equipment[] } => {
  const allMoves: Move[] = [];
  const allEquipment: Equipment[] = [];
  const resourceAllocation = allocateResources(request.activities, boardState);
  
  // Track allocated player IDs
  const allocatedPlayerIds = new Set<string>();
  
  // Track ball index
  let currentBallIndex = 0;

  for (const activity of request.activities) {
    const allocated = resourceAllocation.get(activity.id);
    if (!allocated) continue;
    
    // Mark players as allocated
    allocated.players.forEach(p => allocatedPlayerIds.add(p.id));
    allocated.goalkeepers.forEach(p => allocatedPlayerIds.add(p.id));

    let activityCenter: Position;
    if (activity.location.coordinate_system === 'absolute_offset' && activity.location.center_x !== undefined && activity.location.center_y !== undefined) {
      activityCenter = { x: activity.location.center_x, y: activity.location.center_y };
    } else {
      activityCenter = resolveAnchor(activity.location.anchor, activity.location.offset);
    }
    
    const { moves, equipment: activityEquipment, nextBallIndex } = calculateActivityPositions(
      activity, 
      allocated, 
      activityCenter, 
      currentBallIndex
    );
    
    allMoves.push(...moves);
    allEquipment.push(...activityEquipment);
    currentBallIndex = nextBallIndex;
  }

  // Handle Unused Players: Move them off-pitch to reduce clutter
  const allPlayers = [...boardState.redTeam, ...boardState.blueTeam];
  const unusedPlayers = allPlayers.filter(p => !allocatedPlayerIds.has(p.id));

  unusedPlayers.forEach((p, index) => {
    // Stack them neatly off the side of the pitch
    // Red team on left (-5), Blue team on right (105)
    const xPos = p.team === 'red' ? -5 : 105;
    const yPos = 10 + (index * 5); // Stagger vertically
    
    allMoves.push({
      targetId: p.id,
      newPosition: { x: xPos, y: yPos },
      explanation: "Moved to bench (unused in current drills)"
    });
  });

  return { moves: allMoves, equipment: allEquipment };
};
