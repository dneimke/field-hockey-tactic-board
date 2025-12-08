import { Position } from '../types';

export const FIELD_ANCHORS: Record<string, Position> = {
  // Standard Points
  center_spot: { x: 50, y: 50 },
  
  // Shooting Circles (D)
  // Radius is 14.63m. Pitch length 91.44m => 16% x-offset
  // Apex is at y=50
  top_D_left: { x: 16, y: 50 },  // Apex of Left D
  top_D_right: { x: 84, y: 50 }, // Apex of Right D
  top_D_center: { x: 16, y: 50 }, // Legacy/Alias

  baseline_center: { x: 0, y: 50 },
  goal_circle_bottom: { x: 16, y: 76.6 }, // Bottom edge of D (y-offset approx 26.6%)
  
  sideline_middle_left: { x: 50, y: 0 },
  sideline_middle_right: { x: 50, y: 100 },

  // Goals (GK Placement)
  // Adjusted slightly inside the pitch (2% = ~1.8m) to keep GKs in play
  goal_left: { x: 2, y: 50 },
  goal_right: { x: 98, y: 50 },

  // Corners (0,0 is top-left in this coordinate system)
  corner_top_left: { x: 0, y: 0 },
  corner_bottom_left: { x: 0, y: 100 },
  corner_top_right: { x: 100, y: 0 },
  corner_bottom_right: { x: 100, y: 100 },

  // 23m Line Intersections (Long Corner Marks)
  // 22.9m / 91.44m = 25%
  // Left side (x=25)
  '23m_left_top': { x: 25, y: 0 },
  '23m_left_bottom': { x: 25, y: 100 },
  // Right side (x=75)
  '23m_right_top': { x: 75, y: 0 },
  '23m_right_bottom': { x: 75, y: 100 },

  // Penalty Corner Injection Spots (Backline, 10m from post)
  // Post approx y=47/53. 10m is approx 18% width (18 units).
  // 47 - 18 = 29. 53 + 18 = 71. Rounding to 30/70 for clarity.
  penalty_corner_injector_left_top: { x: 0, y: 30 },
  penalty_corner_injector_left_bottom: { x: 0, y: 70 },
  penalty_corner_injector_right_top: { x: 100, y: 30 },
  penalty_corner_injector_right_bottom: { x: 100, y: 70 },
};
