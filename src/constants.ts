import { Player, Ball } from "./types";
import { DEFAULT_GAME_PLAYER_COUNT, createGameModeTeam } from "./utils/playerManagement";

// Drawing constants
export const COLORS = ["#FFFFFF"];
export const STROKE_WIDTHS = [
  { name: "S", width: 2 },
  { name: "M", width: 4 },
  { name: "L", width: 8 },
];

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

// Re-export for convenience
export { DEFAULT_GAME_PLAYER_COUNT, createGameModeTeam };
