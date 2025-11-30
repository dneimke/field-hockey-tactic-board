import { Position, Path } from '../types';

/**
 * Transforms a position from standard coordinates to portrait display coordinates.
 * Corresponds to a 90-degree clockwise rotation of the field content.
 * 
 * @param position - Position in standard coordinates (0-100 for both x and y)
 * @returns Position in portrait display coordinates
 */
export const transformPositionForPortrait = (position: Position): Position => {
  return {
    x: 100 - position.y,
    y: position.x,
  };
};

/**
 * Reverses the portrait transformation to convert display coordinates back to standard coordinates.
 * 
 * @param position - Position in portrait display coordinates
 * @returns Position in standard coordinates
 */
export const reversePortraitTransform = (position: Position): Position => {
  return {
    x: position.y,
    y: 100 - position.x,
  };
};

/**
 * Transforms a path's points from standard to portrait coordinates.
 * 
 * @param path - Path with points in standard coordinates
 * @returns Path with points in portrait coordinates
 */
export const transformPathForPortrait = (path: Path): Path => {
  return {
    ...path,
    points: path.points.map(transformPositionForPortrait),
  };
};

/**
 * Transforms multiple paths for portrait display.
 * 
 * @param paths - Array of paths in standard coordinates
 * @returns Array of paths in portrait coordinates
 */
export const transformPathsForPortrait = (paths: Path[]): Path[] => {
  return paths.map(transformPathForPortrait);
};

