import { describe, it, expect } from 'vitest';
import {
  transformPositionForPortrait,
  reversePortraitTransform,
  transformPathForPortrait,
  transformPathsForPortrait,
} from '../coordinateTransform';
import { Position, Path } from '../../types';

describe('coordinateTransform', () => {
  describe('transformPositionForPortrait', () => {
    it('should transform center position correctly', () => {
      const position: Position = { x: 50, y: 50 };
      const result = transformPositionForPortrait(position);
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it('should transform top-left to bottom-left', () => {
      const position: Position = { x: 0, y: 0 };
      const result = transformPositionForPortrait(position);
      expect(result).toEqual({ x: 100, y: 0 });
    });

    it('should transform bottom-right to top-right', () => {
      const position: Position = { x: 100, y: 100 };
      const result = transformPositionForPortrait(position);
      expect(result).toEqual({ x: 0, y: 100 });
    });
  });

  describe('reversePortraitTransform', () => {
    it('should reverse transform correctly', () => {
      const position: Position = { x: 50, y: 50 };
      const transformed = transformPositionForPortrait(position);
      const reversed = reversePortraitTransform(transformed);
      expect(reversed).toEqual(position);
    });

    it('should reverse transform for edge cases', () => {
      const position: Position = { x: 0, y: 100 };
      const transformed = transformPositionForPortrait(position);
      const reversed = reversePortraitTransform(transformed);
      expect(reversed).toEqual(position);
    });
  });

  describe('transformPathForPortrait', () => {
    it('should transform all points in a path', () => {
      const path: Path = {
        id: 'test-path',
        type: 'freehand',
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 50 },
          { x: 100, y: 100 },
        ],
        color: '#FFFFFF',
        strokeWidth: 4,
      };

      const result = transformPathForPortrait(path);
      expect(result.points).toHaveLength(3);
      expect(result.points[0]).toEqual({ x: 100, y: 0 });
      expect(result.points[1]).toEqual({ x: 50, y: 50 });
      expect(result.points[2]).toEqual({ x: 0, y: 100 });
      expect(result.id).toBe(path.id);
      expect(result.type).toBe(path.type);
    });
  });

  describe('transformPathsForPortrait', () => {
    it('should transform multiple paths', () => {
      const paths: Path[] = [
        {
          id: 'path1',
          type: 'freehand',
          points: [{ x: 0, y: 0 }],
          color: '#FFFFFF',
          strokeWidth: 4,
        },
        {
          id: 'path2',
          type: 'arrow',
          points: [{ x: 100, y: 100 }],
          color: '#FFFFFF',
          strokeWidth: 4,
        },
      ];

      const result = transformPathsForPortrait(paths);
      expect(result).toHaveLength(2);
      expect(result[0].points[0]).toEqual({ x: 100, y: 0 });
      expect(result[1].points[0]).toEqual({ x: 0, y: 100 });
    });
  });
});

