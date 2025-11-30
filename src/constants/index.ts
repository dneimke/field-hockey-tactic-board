// Storage Keys
export const TACTICS_STORAGE_KEY = 'hockey_tactics';
export const SAVED_TACTICS_STORAGE_KEY = 'hockey_saved_tactics';
export const SEEDED_FLAG_KEY = 'hockey_tactics_seeded';

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
export const DEFAULT_GAME_PLAYER_COUNT = 11;
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

// Re-export existing constants
export * from '../constants';

