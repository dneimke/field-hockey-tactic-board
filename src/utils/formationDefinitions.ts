import { Position } from '../types';

export interface Formation {
  name: string;
  positions: Position[];
}

// Field zones for reference (percentages)
export const FIELD_ZONES = {
  // X coordinates (width)
  DEFENSIVE_THIRD_START: 0,
  DEFENSIVE_THIRD_END: 33.33,
  MIDFIELD_START: 33.33,
  MIDFIELD_END: 66.66,
  ATTACKING_THIRD_START: 66.66,
  ATTACKING_THIRD_END: 100,
  
  // Y coordinates (height)
  LEFT_WING: 0,
  LEFT_CENTER: 25,
  CENTER: 50,
  RIGHT_CENTER: 75,
  RIGHT_WING: 100,
} as const;

// Common formations
const FORMATION_433: Formation = {
  name: '4-3-3',
  positions: [
    { x: 5, y: 50 }, // GK
    { x: 18, y: 15 }, // DEF
    { x: 18, y: 35 }, // DEF
    { x: 18, y: 65 }, // DEF
    { x: 18, y: 85 }, // DEF
    { x: 35, y: 25 }, // MID
    { x: 35, y: 50 }, // MID
    { x: 35, y: 75 }, // MID
    { x: 52, y: 15 }, // FWD
    { x: 52, y: 50 }, // FWD
    { x: 52, y: 85 }, // FWD
  ],
};

const FORMATION_442: Formation = {
  name: '4-4-2',
  positions: [
    { x: 5, y: 50 }, // GK
    { x: 18, y: 15 }, // DEF
    { x: 18, y: 35 }, // DEF
    { x: 18, y: 65 }, // DEF
    { x: 18, y: 85 }, // DEF
    { x: 35, y: 20 }, // MID
    { x: 35, y: 40 }, // MID
    { x: 35, y: 60 }, // MID
    { x: 35, y: 80 }, // MID
    { x: 52, y: 30 }, // FWD
    { x: 52, y: 70 }, // FWD
  ],
};

const FORMATION_352: Formation = {
  name: '3-5-2',
  positions: [
    { x: 5, y: 50 }, // GK
    { x: 18, y: 25 }, // DEF
    { x: 18, y: 50 }, // DEF
    { x: 18, y: 75 }, // DEF
    { x: 35, y: 15 }, // MID
    { x: 35, y: 35 }, // MID
    { x: 35, y: 50 }, // MID
    { x: 35, y: 65 }, // MID
    { x: 35, y: 85 }, // MID
    { x: 52, y: 30 }, // FWD
    { x: 52, y: 70 }, // FWD
  ],
};

const FORMATION_343: Formation = {
  name: '3-4-3',
  positions: [
    { x: 5, y: 50 }, // GK
    { x: 18, y: 25 }, // DEF
    { x: 18, y: 50 }, // DEF
    { x: 18, y: 75 }, // DEF
    { x: 35, y: 20 }, // MID
    { x: 35, y: 40 }, // MID
    { x: 35, y: 60 }, // MID
    { x: 35, y: 80 }, // MID
    { x: 52, y: 15 }, // FWD
    { x: 52, y: 50 }, // FWD
    { x: 52, y: 85 }, // FWD
  ],
};

const FORMATION_532: Formation = {
  name: '5-3-2',
  positions: [
    { x: 5, y: 50 }, // GK
    { x: 18, y: 10 }, // DEF
    { x: 18, y: 25 }, // DEF
    { x: 18, y: 50 }, // DEF
    { x: 18, y: 75 }, // DEF
    { x: 18, y: 90 }, // DEF
    { x: 35, y: 35 }, // MID
    { x: 35, y: 50 }, // MID
    { x: 35, y: 65 }, // MID
    { x: 52, y: 30 }, // FWD
    { x: 52, y: 70 }, // FWD
  ],
};

export const FORMATIONS: Record<string, Formation> = {
  '4-3-3': FORMATION_433,
  '4-4-2': FORMATION_442,
  '3-5-2': FORMATION_352,
  '3-4-3': FORMATION_343,
  '5-3-2': FORMATION_532,
};

export const getFormation = (name: string): Formation | null => {
  // Try exact match first
  if (FORMATIONS[name]) {
    return FORMATIONS[name];
  }
  
  // Try case-insensitive match
  const normalizedName = name.toLowerCase().replace(/\s+/g, '');
  const match = Object.keys(FORMATIONS).find(
    (key) => key.toLowerCase().replace(/\s+/g, '') === normalizedName
  );
  
  return match ? FORMATIONS[match] : null;
};

export const getFormationPositions = (formationName: string, isHomeTeam: boolean): Position[] => {
  const formation = getFormation(formationName);
  if (!formation) {
    return [];
  }
  
  if (isHomeTeam) {
    return formation.positions;
  } else {
    // Flip positions for away team (mirror horizontally)
    return formation.positions.map((pos) => ({
      x: 100 - pos.x,
      y: pos.y,
    }));
  }
};


