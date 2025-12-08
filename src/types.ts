// Fix: Provide concrete type definitions for the application's data structures.
export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  team: "red" | "blue";
  number: number;
  position: Position;
  isGoalkeeper?: boolean;
}

export interface Ball {
  id: string;
  position: Position;
}

export interface Equipment {
  id: string;
  type: "cone" | "mini_goal" | "coach";
  position: Position;
  color?: string;
  rotation?: number; // degrees, 0-360
}

export type PieceType = Player | Ball | Equipment;

export interface Path {
  id: string;
  type: "freehand" | "arrow";
  points: Position[];
  color: string;
  strokeWidth: number;
  style?: "solid" | "dashed";
}

export interface BoardState {
  redTeam: Player[];
  blueTeam: Player[];
  balls: Ball[];
  equipment?: Equipment[];
  mode?: "game" | "training";
}

export type FieldType = "standard" | "circle_detail";

export interface Tactic {
  name: string;
  frames: BoardState[];
  paths: Path[];
  fieldType?: FieldType;
}

export interface SavedTactic {
  id: string;
  name: string;
  tags: string[];
  type: 'single_team' | 'full_scenario';
  metadata?: {
    primaryTeam?: 'red' | 'blue';
    phase?: 'attack' | 'defense';
    isAPC?: boolean;
    isDPC?: boolean;
    isOutlet?: boolean;
    isPress?: boolean;
    structure?: string;  // e.g., "back_4", "half_court", "1-3"
  };
  positions: {
    team: 'red' | 'blue';
    role: 'GK' | 'Player';
    relativeIndex: number;
    x: number;
    y: number;
  }[];
}

export type MovementType = 'sprint' | 'curve' | 'jockey' | 'jog';

export interface Move {
  targetId: string; // Player ID or 'ball'
  newPosition: Position;
  movementType?: MovementType;
  explanation?: string;
}

export interface BaseAction {
  reasoning?: string;
  explanation: string;
  rawResponse?: string;
}

export interface SetPieceAction extends BaseAction {
  action: 'set_piece';
  type: 'APC' | 'DPC' | 'shootout';
  parameters: {
    // APC Params
    batteries?: 1 | 2;              // Number of batteries (castles)
    injectorSide?: 'left' | 'right'; // Side of the goal
    injectorId?: string;            // Optional: specific player to inject
    battery1Type?: 'top' | 'right'; // Location of primary battery
    
    // DPC Params
    defenseStructure?: '1-3' | '2-2' | 'line_stop';
    runnerCount?: number;           // Standard is 4 runners + GK
    
    // Shootout Params
    attackerId?: string;            // The taker
    gkId?: string;                  // The defending GK
  };
}

export interface DrillAction extends BaseAction {
  action: 'drill';
  type: 'small_sided_game' | 'possession';
  parameters: {
    attackers: number;          // Count of FIELD PLAYERS (e.g., 4 means 4 field players, NOT including GK)
    defenders: number;          // Count of FIELD PLAYERS (e.g., 3 means 3 field players, NOT including GK)
    withGK: boolean;            // true/false - only set true if goalkeepers are explicitly requested
    zone: 'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field';
    shape?: 'wide' | 'narrow';  // Optional hint
    gameCount?: number;         // Optional: number of separate games (default: 1)
    gameZones?: Array<'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field'>; // Optional: zones for each game (must match gameCount)
  };
}

export interface TacticalPhaseAction extends BaseAction {
  action: 'tactical_phase';
  type: 'outlet' | 'press';
  team: 'red' | 'blue';
  structure: string;            // Structure name (e.g., 'back_4', 'full_court', 'w_press')
  intensity?: number;           // Optional: 0-100 (for press height/intensity)
}

export interface MoveAction extends BaseAction {
  action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple';
  moves: Move[];
}

// Training Session Request Types (Phase 1: Unified Field Model)
export interface EntityRequest {
  type: "player" | "gk" | "cone" | "mini_goal" | "coach" | "ball";
  count: number;
  team?: "red" | "blue" | "neutral";
  behavior?: "static" | "active";
}

export interface Activity {
  id: string;
  name: string; // e.g., "GK Saving Drill"
  template_type: "ron_do" | "possession" | "shuttle" | "match_play" | "technical" | "small_sided_game";
  location: {
    anchor: "center_spot" | "top_D_left" | "top_D_right" | "baseline_center" | "custom" | "sideline_middle_left" | "sideline_middle_right" | "goal_circle_bottom";
    offset?: { x: number; y: number }; // Relative to anchor
    dimensions?: { width: number; height: number }; // For bounding box
    coordinate_system?: "relative_zone" | "absolute_offset";
    center_x?: number; // For absolute_offset
    center_y?: number; // For absolute_offset
  };
  entities: EntityRequest[];
  attributes?: {
    custom_dimensions?: { length: number; width: number; unit: "meters" };
    goals?: { count: number; type: "mini_goals" };
    [key: string]: any; // Allow for future extensions
  };
}

export interface TrainingSessionRequest {
  meta: {
    context_type: "training_session";
    pitch_view: "full_pitch" | "half_pitch" | "circle_detail";
  };
  activities: Activity[];
}

export interface TrainingSessionAction extends BaseAction {
  action: "training_session";
  request: TrainingSessionRequest;
}

export type CommandResult = 
  | MoveAction
  | SetPieceAction
  | DrillAction
  | TacticalPhaseAction
  | TrainingSessionAction;

// Chat / Conversational Types (Phase 2)
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  actionResult?: CommandResult;
}

export interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  isOpen: boolean;
}
