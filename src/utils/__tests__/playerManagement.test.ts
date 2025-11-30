import { describe, it, expect } from 'vitest';
import {
  createInitialTeam,
  addPlayer,
  removePlayer,
  validatePlayerCount,
} from '../playerManagement';
import { Player } from '../../types';

describe('playerManagement', () => {
  describe('createInitialTeam', () => {
    it('should create a team with specified player count', () => {
      const team = createInitialTeam('red', 5, false);
      expect(team).toHaveLength(5);
      expect(team.every((p) => p.team === 'red')).toBe(true);
      expect(team.every((p) => !p.isGoalkeeper)).toBe(true);
    });

    it('should include goalkeeper when specified', () => {
      const team = createInitialTeam('blue', 11, true);
      expect(team).toHaveLength(11);
      const gk = team.find((p) => p.isGoalkeeper);
      expect(gk).toBeDefined();
      expect(gk?.number).toBe(1);
    });

    it('should create empty team for count 0', () => {
      const team = createInitialTeam('red', 0, false);
      expect(team).toHaveLength(0);
    });
  });

  describe('addPlayer', () => {
    it('should add a player to an empty team', () => {
      const team: Player[] = [];
      const newPlayer = addPlayer(team, 'red');
      expect(newPlayer.team).toBe('red');
      expect(newPlayer.number).toBe(1);
      expect(newPlayer.id).toBe('R1');
      expect(newPlayer.isGoalkeeper).toBe(false);
    });

    it('should increment player number correctly', () => {
      const team: Player[] = [
        {
          id: 'R1',
          team: 'red',
          number: 1,
          position: { x: 0, y: 0 },
          isGoalkeeper: false,
        },
        {
          id: 'R5',
          team: 'red',
          number: 5,
          position: { x: 0, y: 0 },
          isGoalkeeper: false,
        },
      ];
      const newPlayer = addPlayer(team, 'red');
      expect(newPlayer.number).toBe(6);
      expect(newPlayer.id).toBe('R6');
    });

    it('should use correct prefix for blue team', () => {
      const team: Player[] = [];
      const newPlayer = addPlayer(team, 'blue');
      expect(newPlayer.id).toMatch(/^B\d+$/);
    });
  });

  describe('removePlayer', () => {
    it('should remove player by id', () => {
      const team: Player[] = [
        { id: 'R1', team: 'red', number: 1, position: { x: 0, y: 0 } },
        { id: 'R2', team: 'red', number: 2, position: { x: 0, y: 0 } },
        { id: 'R3', team: 'red', number: 3, position: { x: 0, y: 0 } },
      ];
      const result = removePlayer(team, 'R2');
      expect(result).toHaveLength(2);
      expect(result.find((p) => p.id === 'R2')).toBeUndefined();
    });

    it('should return same array if player not found', () => {
      const team: Player[] = [
        { id: 'R1', team: 'red', number: 1, position: { x: 0, y: 0 } },
      ];
      const result = removePlayer(team, 'R99');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('R1');
    });
  });

  describe('validatePlayerCount', () => {
    it('should validate game mode requires 11 players', () => {
      const team: Player[] = Array(11).fill(null).map((_, i) => ({
        id: `R${i + 1}`,
        team: 'red' as const,
        number: i + 1,
        position: { x: 0, y: 0 },
      }));
      expect(validatePlayerCount(team, 'game')).toBe(true);
    });

    it('should reject game mode with wrong player count', () => {
      const team: Player[] = Array(10).fill(null).map((_, i) => ({
        id: `R${i + 1}`,
        team: 'red' as const,
        number: i + 1,
        position: { x: 0, y: 0 },
      }));
      expect(validatePlayerCount(team, 'game')).toBe(false);
    });

    it('should accept any count in training mode', () => {
      const team: Player[] = Array(5).fill(null).map((_, i) => ({
        id: `R${i + 1}`,
        team: 'red' as const,
        number: i + 1,
        position: { x: 0, y: 0 },
      }));
      expect(validatePlayerCount(team, 'training')).toBe(true);
    });
  });
});

