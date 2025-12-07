import { Position } from '../types';

export const FIELD_ANCHORS: Record<string, Position> = {
  // Standard Points
  center_spot: { x: 50, y: 50 },
  top_D_left: { x: 14.6, y: 35 },
  top_D_right: { x: 85.4, y: 35 },
  top_D_center: { x: 14.6, y: 50 },
  baseline_center: { x: 0, y: 50 },
  goal_circle_bottom: { x: 14.6, y: 65 }, // Note: This seems to be a specific legacy anchor, keeping it.
  sideline_middle_left: { x: 50, y: 0 },
  sideline_middle_right: { x: 50, y: 100 },

  // Goals
  goal_left: { x: 0, y: 50 },
  goal_right: { x: 100, y: 50 },

  // Corners (0,0 is top-left in this coordinate system)
  corner_top_left: { x: 0, y: 0 },
  corner_bottom_left: { x: 0, y: 100 },
  corner_top_right: { x: 100, y: 0 },
  corner_bottom_right: { x: 100, y: 100 },

  // 23m Line Intersections (Long Corner Marks)
  // Left side (x=23)
  '23m_left_top': { x: 23, y: 0 },
  '23m_left_bottom': { x: 23, y: 100 },
  // Right side (x=77)
  '23m_right_top': { x: 77, y: 0 },
  '23m_right_bottom': { x: 77, y: 100 },

  // Penalty Corner Injection Spots (Backline, 10m from post)
  // Posts are approx at y=45 and y=55. 10m from post means roughly y=35 and y=65 if we assume standard width?
  // Let's stick to standard marks. Standard injection marks are 10m from the goal post.
  // If goal is centered at 50, and width is 3.66m (approx 4%), posts are at ~48 and ~52.
  // Actually, in this system, goal posts are defined as {x: 0, y: 45/55} in promptBuilder.
  // So posts are at 45 and 55.
  // 10m from post (assuming 1 unit = 1 meter approx? Field is 100x60 usually? No, hockey is 91.4x55. 
  // In the coordinate system x:0-100, y:0-100.
  // If y=0 to 100 covers 55m, then 1 unit = 0.55m.
  // 10m = ~18 units.
  // Post at 45 -> 10m "up" (towards 0) = 45 - 18 = 27?
  // Post at 55 -> 10m "down" (towards 100) = 55 + 18 = 73?
  // Let's refine based on "Top of D" being 14.6m radius.
  // In promptBuilder: Top of D Left is {x: 14.6, y: 35}. 
  // If x=14.6 represents 14.63m, then x scale is 1unit=1m?
  // If y=35 is top left of D... D radius is 14.63m. Center is (0, 50).
  // Then y=35 implies 50 - 15. So 15 units = 14.63m. Roughly 1 unit = 1m.
  // So posts at 45/55 are 5m from center? Goal is 3.66m wide. 1.83m each side.
  // If 1 unit = 1m, posts should be at 48.17 and 51.83.
  // However, the prompts say "Goal Posts: {x: 0, y: 45/55}". This suggests the goal is 10 units wide (approx 10m?). That's huge.
  // But let's follow the existing coordinate system conventions implied by the "Top of D" anchors.
  // Top of D Left y=35. Top of D Right y=35. (Wait, Right D should be x=85.4).
  // Center y=50.
  // Let's define Injector spots based on the 10m mark.
  // If goal post is approx 47/53 (real world), 10m out is ~37 and ~63.
  // If we assume the existing system has posts at 45/55, then 10m (approx 10 units) from there would be 35 and 65.
  // "Top of D" left is at y=35. So that aligns with the injection mark being at the edge of the D?
  // Usually injection mark is 10m from goal post.
  // Let's just use 35 and 65 as safe bets for "Injection Spots" given the current geometry seems to use 35/65 as key "width" markers for the D.
  
  penalty_corner_injector_left_top: { x: 0, y: 35 },
  penalty_corner_injector_left_bottom: { x: 0, y: 65 },
  penalty_corner_injector_right_top: { x: 100, y: 35 },
  penalty_corner_injector_right_bottom: { x: 100, y: 65 },
};
