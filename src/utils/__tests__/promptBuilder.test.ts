import { describe, it, expect } from 'vitest';
import { createPrompt } from '../promptBuilder';
import { BoardState, Player, Ball } from '../../types';

describe('promptBuilder', () => {
  const mockRedPlayer: Player = { id: 'R1', team: 'red', number: 1, position: { x: 50, y: 50 }, isGoalkeeper: true };
  const mockBluePlayer: Player = { id: 'B1', team: 'blue', number: 1, position: { x: 50, y: 50 }, isGoalkeeper: false };
  const mockBall: Ball = { id: 'ball', position: { x: 50, y: 50 } };

  const mockBoardState: BoardState = {
    redTeam: [mockRedPlayer],
    blueTeam: [mockBluePlayer],
    balls: [mockBall],
    mode: 'game',
  };

  it('should create a prompt with basic structure', () => {
    const prompt = createPrompt('test command', mockBoardState);
    expect(prompt).toContain('You are a field hockey tactic assistant');
    expect(prompt).toContain('test command');
  });

  it('should include geometry anchors', () => {
    const prompt = createPrompt('test command', mockBoardState);
    expect(prompt).toContain('FIELD GEOMETRY ANCHORS');
    expect(prompt).toContain('Center Spot: {x: 50, y: 50}');
  });

  it('should separate goalkeepers from field players in board state', () => {
    const prompt = createPrompt('test command', mockBoardState);
    expect(prompt).toContain('[RED TEAM]');
    expect(prompt).toContain('Goalkeeper:');
    expect(prompt).toContain('Field Players:');
    expect(prompt).toContain('[BLUE TEAM]');
  });

  it('should include specific interfaces and instructions for game mode', () => {
    const prompt = createPrompt('test command', { ...mockBoardState, mode: 'game' }, undefined, 'game');
    expect(prompt).toContain('interface SetPieceAction');
    expect(prompt).toContain('interface TacticalPhaseAction');
    expect(prompt).not.toContain('interface DrillAction'); // Should NOT be in game mode
    expect(prompt).toContain('MODE: GAME');
  });

  it('should include specific interfaces and instructions for training mode', () => {
    const prompt = createPrompt('test command', { ...mockBoardState, mode: 'training' }, undefined, 'training');
    expect(prompt).toContain('interface DrillAction');
    expect(prompt).not.toContain('interface SetPieceAction'); // Should NOT be in training mode
    expect(prompt).toContain('MODE: TRAINING');
  });

  it('should enforce reasoning field', () => {
    const prompt = createPrompt('test command', mockBoardState);
    expect(prompt).toContain('"reasoning" field must come first');
  });
});

