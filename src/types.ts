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

export type PieceType = Player | Ball;

export interface Path {
  id: string;
  type: "freehand" | "arrow";
  points: Position[];
  color: string;
  strokeWidth: number;
}

export interface BoardState {
  redTeam: Player[];
  blueTeam: Player[];
  balls: Ball[];
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

export interface SetPieceAction {
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
  explanation: string;
}

export interface DrillAction {
  action: 'drill';
  type: 'small_sided_game' | 'possession';
  parameters: {
    attackers: number;          // Count (e.g., 4)
    defenders: number;          // Count (e.g., 3)
    withGK: boolean;            // true/false
    zone: 'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field';
    shape?: 'wide' | 'narrow';  // Optional hint
  };
  explanation: string;
}

export interface TacticalPhaseAction {
  action: 'tactical_phase';
  type: 'outlet' | 'press';
  team: 'red' | 'blue';
  structure: string;            // Structure name (e.g., 'back_4', 'full_court', 'w_press')
  intensity?: number;           // Optional: 0-100 (for press height/intensity)
  explanation: string;
}

export type CommandResult = 
  | {
      action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple';
      moves: Array<{
        targetId: string; // Player ID or 'ball'
        newPosition: Position;
        explanation?: string;
      }>;
      explanation: string;
    }
  | SetPieceAction
  | DrillAction
  | TacticalPhaseAction;