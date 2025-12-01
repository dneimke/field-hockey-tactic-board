import { BoardState } from '../types';
import { FieldConfig } from '../config/fieldConfig';

/**
 * Creates the AI prompt for command interpretation
 */
export const createPrompt = (
  command: string,
  boardState: BoardState,
  fieldConfig?: FieldConfig,
  mode?: 'game' | 'training',
): string => {
  const formations = ['4-3-3', '4-4-2', '3-5-2', '3-4-3', '5-3-2'].join(', ');
  const currentMode = mode || boardState.mode || 'game';
  const isTrainingMode = currentMode === 'training';
  const currentFieldConfig = fieldConfig;

  const fieldViewSection = buildFieldViewSection(currentFieldConfig);
  const modeSection = buildModeSection(currentMode, isTrainingMode);
  const boardStateSection = buildBoardStateSection(boardState, isTrainingMode);
  const tacticalKnowledgeSection = buildTacticalKnowledgeSection();

  return `You are a field hockey tactic assistant. Your job is to interpret natural language commands and convert them into specific player movements on a field hockey pitch.

${fieldViewSection}FIELD LAYOUT:
- The field uses percentage coordinates (0-100 for both x and y)
- X-axis: 0 = left goal, 100 = right goal
- Y-axis: 0 = top edge, 100 = bottom edge
- Defensive third: x = 0-33.33
- Midfield: x = 33.33-66.66
- Attacking third: x = 66.66-100

FIELD GLOSSARY:
- "Shooting Circle" or "D": Semi-circle approx 15m from goal. Left D is around x=0-15, Right D is around x=85-100.
- "23m Area" or "25yd Area": Zone between backline and 23m line. Left is x=0-23, Right is x=77-100.
- "Midfield": Central area between the two 23m lines (x=23-77).

${tacticalKnowledgeSection}
${modeSection}${boardStateSection}AVAILABLE FORMATIONS: ${formations}

COMMAND TO INTERPRET: "${command}"

${buildInstructionsSection(isTrainingMode)}`;
};

/**
 * Builds the field view context section
 */
const buildFieldViewSection = (fieldConfig?: FieldConfig): string => {
  if (!fieldConfig) {
    return '';
  }

  const circleDetailNote =
    fieldConfig.type === 'circle_detail'
      ? `- This view emphasizes the shooting circles (D areas)
- Focus player positioning in circle areas: Left D (x: 0-15) or Right D (x: 85-100)
- Positions outside these areas may be less visible but are still valid`
      : `- Full field view - all positions are visible`;

  return `FIELD VIEW CONTEXT:
- Current view: ${fieldConfig.name}
- Description: ${fieldConfig.description}
${circleDetailNote}

`;
};

/**
 * Builds the mode context section
 */
const buildModeSection = (currentMode: string, isTrainingMode: boolean): string => {
  const trainingNote = isTrainingMode
    ? `- Training Mode: Variable player counts allowed
- Only reference players that exist in the current board state
- Player counts may be different from standard 11 per team`
    : `- Game Mode: Standard 11 players per team
- Standard formations apply`;

  return `MODE CONTEXT:
- Current mode: ${currentMode === 'game' ? 'Game Mode' : 'Training Mode'}
${trainingNote}

`;
};

/**
 * Builds the board state section
 */
const buildBoardStateSection = (boardState: BoardState, isTrainingMode: boolean): string => {
  const redTeamList = boardState.redTeam
    .map((p) => {
      const gkLabel = p.isGoalkeeper ? ' [GK]' : '';
      return `  - Player ${p.number}${gkLabel} (ID: ${p.id}): Position (x: ${p.position.x}, y: ${p.position.y})`;
    })
    .join('\n');

  const blueTeamList = boardState.blueTeam
    .map((p) => {
      const gkLabel = p.isGoalkeeper ? ' [GK]' : '';
      return `  - Player ${p.number}${gkLabel} (ID: ${p.id}): Position (x: ${p.position.x}, y: ${p.position.y})`;
    })
    .join('\n');

  const ballPositions = boardState.balls
    .map((b) => `(ID: ${b.id}, x: ${b.position.x}, y: ${b.position.y})`)
    .join(', ');

  const trainingNote = isTrainingMode
    ? '\nNOTE: In training mode, player counts may vary. Only use player IDs that exist in the current state above.'
    : '';

  return `CURRENT BOARD STATE:
Red Team Players (${boardState.redTeam.length} player${boardState.redTeam.length !== 1 ? 's' : ''}):
${redTeamList}

Blue Team Players (${boardState.blueTeam.length} player${boardState.blueTeam.length !== 1 ? 's' : ''}):
${blueTeamList}

Ball Position: ${ballPositions}${trainingNote}

`;
};

/**
 * Builds the tactical knowledge section
 */
const buildTacticalKnowledgeSection = (): string => {
  return `TACTICAL KNOWLEDGE:
- "Attacking Penalty Corner (APC)": Set piece attack. Injector on backline (10m from post). Castle (Battery) at top of D.
- "Defensive Penalty Corner (DPC)": Set piece defense. GK in goal. 4 Runners (First Wave, Second Wave, etc.). Rest at halfway.
- "Small Sided Games (SSG)": Drills like 4v2, 3v3. Usually played in a specific zone (Attacking 25, Midfield).
- "Outlet": Moving the ball from defense to midfield. Common structures: Back 4 (dish), Back 3 (cup), Three High.
- "Press": Defensive formation to win the ball back. Types: Full Court (high press), Half Court (zone), W-Press, Split Vision.
- "Shootout": 1v1 vs GK starting from 23m line. FIH 8-second shootout setup.
`;
};

/**
 * Builds the instructions section with all command options
 */
const buildInstructionsSection = (isTrainingMode: boolean): string => {
  const trainingModeNote = isTrainingMode
    ? '- IMPORTANT: In training mode, only reference player IDs that exist in the current board state. Do not assume standard player counts.'
    : '';

  return `INSTRUCTIONS:
1. Understand what the user wants to do
2. Determine which players/ball need to move
3. Calculate new positions based on tactical understanding
4. Return a JSON object. You have six options:

TRAINING VS GAME MODE:
- **Game Mode**: Standard match scenarios. Ensure only 1 ball is on the pitch (usually at the center or with a specific player).
- **Training Mode**: Drills and exercises. You can place MULTIPLE balls if requested (e.g., "Give each group a ball", "Split into 3 groups with a ball each").
  - To add multiple balls, use "ball" for the first one, then "ball_2", "ball_3", etc. The system handles creating them.
  - IMPORTANT: Always reuse the existing "ball" ID for the first ball to avoid duplicates.
  - If the user asks to "Reset", default to Game Mode (1 ball) unless they say "Reset drill".

OPTION A: Standard Moves (for general tactics)
{
  "action": "move" | "formation" | "reset" | "ball" | "multiple",
  "moves": [
    {
      "targetId": "player ID (e.g., R7, B10) or 'ball' (or 'ball_1', 'ball_2' for training)",
      "newPosition": { "x": number, "y": number },
      "explanation": "brief explanation"
    }
  ],
  "explanation": "overall explanation of what was done"
}

OPTION B: Geometric Shapes (for precise shapes like circles, lines, grids)
{
  "action": "shape",
  "shape": {
    "type": "circle" | "line" | "grid",
    "center": { "x": number, "y": number }, // Optional, default 50,50
    "radius": number, // Optional for circle, default 25
    "start": { "x": number, "y": number }, // Optional for line
    "end": { "x": number, "y": number }, // Optional for line
    "rows": number, // Optional for grid
    "cols": number, // Optional for grid
    "players": ["ID1", "ID2", ...] // List of player IDs in the order they should appear
  },
  "explanation": "overall explanation"
}

OPTION C: Composite (for complex arrangements with multiple shapes or moves)
{
  "action": "composite",
  "shapes": [
    {
      "type": "circle" | "line" | "grid",
      "center": { "x": number, "y": number },
      "players": ["ID1", "ID2", ...],
      ... // other shape properties
    }
  ],
  "moves": [ // Optional individual moves to combine with shapes
    {
      "targetId": "player ID",
      "newPosition": { "x": number, "y": number }
    }
  ],
  "explanation": "overall explanation"
}

OPTION D: Set Pieces (Penalty Corners & Shootouts)
{
  "action": "set_piece",
  "type": "APC" | "DPC" | "shootout",
  "parameters": {
    // APC Params
    "batteries": 1 | 2,              // APC only
    "injectorSide": "left" | "right", // APC only
    "injectorId": "string",         // APC only (optional player ID)
    "battery1Type": "top" | "right", // APC only
    // DPC Params
    "defenseStructure": "1-3" | "2-2" | "line_stop", // DPC only
    "runnerCount": number,          // DPC only (default 4)
    // Shootout Params
    "attackerId": "string",         // Shootout only (optional, e.g., "R10")
    "gkId": "string"                // Shootout only (optional, e.g., "B1")
  },
  "explanation": "overall explanation"
}

OPTION E: Drills (Small Sided Games)
{
  "action": "drill",
  "type": "small_sided_game" | "possession",
  "parameters": {
    "attackers": number,          // Count (e.g., 4)
    "defenders": number,          // Count (e.g., 3)
    "withGK": boolean,            // true/false
    "zone": "attacking_25" | "midfield" | "defensive_circle" | "full_field",
    "shape": "wide" | "narrow"    // Optional hint
  },
  "explanation": "overall explanation"
}

OPTION F: Tactical Phases (Outletting & Pressing)
{
  "action": "tactical_phase",
  "type": "outlet" | "press",
  "team": "red" | "blue",
  "structure": "string",          // Outlet: "back_4", "back_3", "three_high", "asymmetric_right", "asymmetric_left"
                                   // Press: "full_court", "half_court", "w_press", "split_vision"
  "intensity": number,            // Optional: 0-100 (for press height/intensity)
  "explanation": "overall explanation"
}

EXAMPLES:
- "Move red player 7 to center" → { "action": "move", "moves": [{ "targetId": "R7", "newPosition": { "x": 50, "y": 50 }, "explanation": "Moving to center" }], "explanation": "Moved red player 7 to center" }
- "Form a circle with all players" → { "action": "shape", "shape": { "type": "circle", "center": { "x": 50, "y": 50 }, "radius": 30, "players": ["R1", "B1", "R2", "B2", ...] }, "explanation": "Forming a circle" }
- "Setup a 2-castle PC attack" → { "action": "set_piece", "type": "APC", "parameters": { "batteries": 2 }, "explanation": "Setting up 2-battery APC" }
- "Blue team defending a penalty corner" → { "action": "set_piece", "type": "DPC", "parameters": {}, "explanation": "Setting up DPC for blue team" }
- "4v2 game in the D" → { "action": "drill", "type": "small_sided_game", "parameters": { "attackers": 4, "defenders": 2, "zone": "defensive_circle" }, "explanation": "Setting up 4v2 drill in defensive circle" }
- "Red team outlet using a Back 3" → { "action": "tactical_phase", "type": "outlet", "team": "red", "structure": "back_3", "explanation": "Setting up Back 3 outlet structure for red team" }
- "Blue team setup a Half Court press" → { "action": "tactical_phase", "type": "press", "team": "blue", "structure": "half_court", "explanation": "Setting up Half Court press for blue team" }
- "Shootout for R10" → { "action": "set_piece", "type": "shootout", "parameters": { "attackerId": "R10" }, "explanation": "Setting up shootout for red player 10" }
- "Reset to match start" → { "action": "reset", "moves": [{ "targetId": "ball", "newPosition": { "x": 50, "y": 50 } }], "explanation": "Resetting to standard game mode" }

IMPORTANT:
- Return ONLY valid JSON, no markdown, no extra text
- All positions must be between 0-100 for both x and y
- Use actual player IDs from the current state
- For "alternating" patterns, simply order the "players" array in the desired sequence (e.g., Red1, Blue1, Red2, Blue2...)
- When creating groups (e.g. 5v5), ensure you mix players from both teams if requested.
- Pay attention to spatial requests (e.g. "different part of field"). Goalkeepers (marked [GK]) are usually at x=5 (left) and x=95 (right), but can be moved together if requested.
- Goalkeepers are visually distinct (GK label, different color) and typically remain in defensive positions unless specifically requested to move.
- Avoid placing players on top of each other.
- Use "ball_1", "ball_2" etc. ONLY if multiple balls are needed. Otherwise use "ball".
${trainingModeNote}
`;
};

