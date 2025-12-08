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

  // Adjusted baseline to be slightly inside pitch (x=2) to prevent clipping
  baseline_center: { x: 2, y: 50 },
  goal_circle_bottom: { x: 16, y: 76.6 }, 
  
  // Adjusted sidelines to be slightly inside pitch (y=2/98) to prevent clipping
  sideline_middle_left: { x: 50, y: 2 },
  sideline_middle_right: { x: 50, y: 98 },

  // Goals (GK Placement)
  // Adjusted slightly inside the pitch (2% = ~1.8m) to keep GKs in play
  goal_left: { x: 2, y: 50 },
  goal_right: { x: 98, y: 50 },

  // Corners (Adjusted to 2% inset to prevent clipping)
  corner_top_left: { x: 2, y: 2 },
  corner_bottom_left: { x: 2, y: 98 },
  corner_top_right: { x: 98, y: 2 },
  corner_bottom_right: { x: 98, y: 98 },

  // 23m Line Intersections (Long Corner Marks)
  // 22.9m / 91.44m = 25%
  // Y-coords inset to 2/98
  // Left side (x=25)
  '23m_left_top': { x: 25, y: 2 },
  '23m_left_bottom': { x: 25, y: 98 },
  // Right side (x=75)
  '23m_right_top': { x: 75, y: 2 },
  '23m_right_bottom': { x: 75, y: 98 },

  // Penalty Corner Injection Spots (Backline, 10m from post)
  // Inset x to 2/98 to match baseline
  penalty_corner_injector_left_top: { x: 2, y: 30 },
  penalty_corner_injector_left_bottom: { x: 2, y: 70 },
  penalty_corner_injector_right_top: { x: 98, y: 30 },
  penalty_corner_injector_right_bottom: { x: 98, y: 70 },
};
