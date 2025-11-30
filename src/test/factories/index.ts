import { Player, Ball, Position, BoardState } from '../../types';

export const createPosition = (x: number = 50, y: number = 50): Position => ({
  x,
  y,
});

export const createPlayer = (
  id: string,
  team: 'red' | 'blue' = 'red',
  number: number = 1,
  position: Position = createPosition(),
  isGoalkeeper: boolean = false,
): Player => ({
  id,
  team,
  number,
  position,
  isGoalkeeper,
});

export const createBall = (id: string = 'ball', position: Position = createPosition()): Ball => ({
  id,
  position,
});

export const createBoardState = (
  redTeam: Player[] = [],
  blueTeam: Player[] = [],
  balls: Ball[] = [],
  mode: 'game' | 'training' = 'game',
): BoardState => ({
  redTeam,
  blueTeam,
  balls,
  mode,
});

