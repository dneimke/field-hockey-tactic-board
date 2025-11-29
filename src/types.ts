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
}

export interface Tactic {
  name: string;
  frames: BoardState[];
  paths: Path[];
}

export interface CommandResult {
  action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple';
  moves: Array<{
    targetId: string; // Player ID or 'ball'
    newPosition: Position;
    explanation?: string;
  }>;
  explanation: string;
}