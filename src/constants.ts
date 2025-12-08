import { Player, Ball } from "./types";

// Storage Keys
export const ANIMATIONS_STORAGE_KEY = 'hockey_animations';
export const PLAYBOOK_STORAGE_KEY = 'hockey_playbook';
export const SEEDED_FLAG_KEY = 'hockey_tactics_seeded';

// Legacy Storage Keys (for migration)
export const LEGACY_TACTICS_STORAGE_KEY = 'hockey_tactics';
export const LEGACY_SAVED_TACTICS_STORAGE_KEY = 'hockey_saved_tactics';

// Drawing constants
export const COLORS = ["#FFFFFF"];

// Helper function to check if a player is a goalkeeper
export const isGoalkeeper = (player: Player): boolean => {
  return player.isGoalkeeper === true || player.number === 1;
};

// Initial formation: 4-3-3 for both teams
export const INITIAL_RED_TEAM: Player[] = [
  { id: "R1", team: "red", number: 1, position: { x: 5, y: 50 }, isGoalkeeper: true }, // GK
  { id: "R2", team: "red", number: 2, position: { x: 18, y: 15 } }, // DEF
  { id: "R3", team: "red", number: 3, position: { x: 18, y: 40 } }, // DEF
  { id: "R4", team: "red", number: 4, position: { x: 18, y: 60 } }, // DEF
  { id: "R5", team: "red", number: 5, position: { x: 18, y: 85 } }, // DEF
  { id: "R6", team: "red", number: 6, position: { x: 35, y: 25 } }, // MID
  { id: "R7", team: "red", number: 7, position: { x: 35, y: 50 } }, // MID
  { id: "R8", team: "red", number: 8, position: { x: 35, y: 75 } }, // MID
  { id: "R9", team: "red", number: 9, position: { x: 45, y: 15 } }, // FWD
  { id: "R10", team: "red", number: 10, position: { x: 45, y: 50 } }, // FWD
  { id: "R11", team: "red", number: 11, position: { x: 45, y: 85 } }, // FWD
];

export const INITIAL_BLUE_TEAM: Player[] = [
  { id: "B1", team: "blue", number: 1, position: { x: 95, y: 50 }, isGoalkeeper: true }, // GK
  { id: "B2", team: "blue", number: 2, position: { x: 82, y: 15 } }, // DEF
  { id: "B3", team: "blue", number: 3, position: { x: 82, y: 40 } }, // DEF
  { id: "B4", team: "blue", number: 4, position: { x: 82, y: 60 } }, // DEF
  { id: "B5", team: "blue", number: 5, position: { x: 82, y: 85 } }, // DEF
  { id: "B6", team: "blue", number: 6, position: { x: 65, y: 25 } }, // MID
  { id: "B7", team: "blue", number: 7, position: { x: 65, y: 50 } }, // MID
  { id: "B8", team: "blue", number: 8, position: { x: 65, y: 75 } }, // MID
  { id: "B9", team: "blue", number: 9, position: { x: 55, y: 15 } }, // FWD
  { id: "B10", team: "blue", number: 10, position: { x: 55, y: 50 } }, // FWD
  { id: "B11", team: "blue", number: 11, position: { x: 55, y: 85 } }, // FWD
];

export const INITIAL_BALLS: Ball[] = [{ id: "ball", position: { x: 50, y: 50 } }];

// ID Prefixes
export const RED_PLAYER_PREFIX = 'R';
export const BLUE_PLAYER_PREFIX = 'B';
export const BALL_PREFIX = 'ball';

// Field Dimensions (percentage-based coordinates)
export const FIELD_DIMENSIONS = {
  MIN_X: 0,
  MAX_X: 100,
  MIN_Y: 0,
  MAX_Y: 100,
  CENTER_X: 50,
  CENTER_Y: 50,
} as const;

// Field Zones
export const FIELD_ZONES = {
  DEFENSIVE_THIRD_START: 0,
  DEFENSIVE_THIRD_END: 33.33,
  MIDFIELD_START: 33.33,
  MIDFIELD_END: 66.66,
  ATTACKING_THIRD_START: 66.66,
  ATTACKING_THIRD_END: 100,
  LEFT_D_START: 0,
  LEFT_D_END: 15,
  RIGHT_D_START: 85,
  RIGHT_D_END: 100,
  TWENTY_THREE_METER_LEFT_START: 0,
  TWENTY_THREE_METER_LEFT_END: 23,
  TWENTY_THREE_METER_RIGHT_START: 77,
  TWENTY_THREE_METER_RIGHT_END: 100,
} as const;

// Default Positions
export const DEFAULT_POSITIONS = {
  RED_GOALKEEPER: { x: 5, y: 50 },
  BLUE_GOALKEEPER: { x: 95, y: 50 },
  CENTER: { x: 50, y: 50 },
  RED_DEFAULT: { x: 25, y: 50 },
  BLUE_DEFAULT: { x: 75, y: 50 },
} as const;

// Player Counts
export const MIN_PLAYERS_PER_TEAM = 0;
export const MAX_PLAYERS_PER_TEAM = 11;

// Animation
export const ANIMATION_DEFAULTS = {
  BASE_INTERVAL_MS: 2250,
  MIN_SPEED: 0.5,
  MAX_SPEED: 3,
  DEFAULT_SPEED: 1,
  TRANSITION_DURATION_MS: 1500,
} as const;

// Drawing
export const DRAWING_DEFAULTS = {
  DEFAULT_COLOR: '#FFFFFF',
  DEFAULT_STROKE_WIDTH: 4,
  MIN_STROKE_WIDTH: 2,
  MAX_STROKE_WIDTH: 8,
} as const;
