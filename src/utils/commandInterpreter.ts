import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { BoardState, CommandResult, Position, SavedTactic } from '../types';
import { getGeminiConfig } from '../config/aiConfig';
import { validatePosition, calculateShapePositions, ShapeConfig, resolveOverlaps } from './positionCalculator';
import { FieldConfig } from '../config/fieldConfig';
import { searchTactics, savedTacticToMoves, getAllTactics, flipTacticCoordinates } from './tacticManager';

// Simple in-memory cache for AI matching responses
// Key: normalized command, Value: { result, timestamp }
const aiMatchCache = new Map<string, { result: { tactic: SavedTactic; needsFlip: boolean; reason: string } | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Clear cache when tactics are saved/deleted (called from external code)
export const clearTacticMatchCache = (): void => {
  aiMatchCache.clear();
};

const extractJSONFromResponse = (text: string): string => {
  // Try to extract JSON from markdown code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1];
  }

  // Try to find JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text;
};

const createPrompt = (
  command: string,
  boardState: BoardState,
  fieldConfig?: FieldConfig,
  mode?: "game" | "training"
): string => {
  const formations = ['4-3-3', '4-4-2', '3-5-2', '3-4-3', '5-3-2'].join(', ');
  const currentMode = mode || boardState.mode || "game";
  const isTrainingMode = currentMode === "training";
  const currentFieldConfig = fieldConfig;

  // Build field view context
  const fieldViewSection = currentFieldConfig
    ? `FIELD VIEW CONTEXT:
- Current view: ${currentFieldConfig.name}
- Description: ${currentFieldConfig.description}
${currentFieldConfig.type === 'circle_detail'
  ? `- This view emphasizes the shooting circles (D areas)
- Focus player positioning in circle areas: Left D (x: 0-15) or Right D (x: 85-100)
- Positions outside these areas may be less visible but are still valid`
  : `- Full field view - all positions are visible`}

`
    : '';

  // Build mode context
  const modeSection = `MODE CONTEXT:
- Current mode: ${currentMode === "game" ? "Game Mode" : "Training Mode"}
${isTrainingMode
  ? `- Training Mode: Variable player counts allowed
- Only reference players that exist in the current board state
- Player counts may be different from standard 11 per team`
  : `- Game Mode: Standard 11 players per team
- Standard formations apply`}

`;

  // Build board state with mode awareness
  const boardStateSection = `CURRENT BOARD STATE:
Red Team Players (${boardState.redTeam.length} player${boardState.redTeam.length !== 1 ? 's' : ''}):
${boardState.redTeam.map((p) => {
  const gkLabel = p.isGoalkeeper ? ' [GK]' : '';
  return `  - Player ${p.number}${gkLabel} (ID: ${p.id}): Position (x: ${p.position.x}, y: ${p.position.y})`;
}).join('\n')}

Blue Team Players (${boardState.blueTeam.length} player${boardState.blueTeam.length !== 1 ? 's' : ''}):
${boardState.blueTeam.map((p) => {
  const gkLabel = p.isGoalkeeper ? ' [GK]' : '';
  return `  - Player ${p.number}${gkLabel} (ID: ${p.id}): Position (x: ${p.position.x}, y: ${p.position.y})`;
}).join('\n')}

Ball Position: ${boardState.balls.map(b => `(ID: ${b.id}, x: ${b.position.x}, y: ${b.position.y})`).join(', ')}
${isTrainingMode ? '\nNOTE: In training mode, player counts may vary. Only use player IDs that exist in the current state above.' : ''}

`;

  const tacticalKnowledgeSection = `TACTICAL KNOWLEDGE:
- "Attacking Penalty Corner (APC)": Set piece attack. Injector on backline (10m from post). Castle (Battery) at top of D.
- "Defensive Penalty Corner (DPC)": Set piece defense. GK in goal. 4 Runners (First Wave, Second Wave, etc.). Rest at halfway.
- "Small Sided Games (SSG)": Drills like 4v2, 3v3. Usually played in a specific zone (Attacking 25, Midfield).
- "Outlet": Moving the ball from defense to midfield. Common structures: Back 4 (dish), Back 3 (cup), Three High.
- "Press": Defensive formation to win the ball back. Types: Full Court (high press), Half Court (zone), W-Press, Split Vision.
- "Shootout": 1v1 vs GK starting from 23m line. FIH 8-second shootout setup.
`;

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

INSTRUCTIONS:
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
${isTrainingMode ? '- IMPORTANT: In training mode, only reference player IDs that exist in the current board state. Do not assume standard player counts.' : ''}

Now interpret this command: "${command}"`;
};

// Internal type for AI response parsing
type AIResponse =
  | CommandResult
  | { action: 'shape'; shape: ShapeConfig; explanation: string }
  | { action: 'composite'; shapes?: ShapeConfig[]; moves?: Array<{ targetId: string; newPosition: Position }>; explanation: string };

/**
 * Extracts team color from command text
 */
const extractTeamFromCommand = (command: string): 'red' | 'blue' | null => {
  const normalized = command.toLowerCase();
  if (normalized.includes('red') || normalized.includes('r ')) {
    return 'red';
  }
  if (normalized.includes('blue') || normalized.includes('b ')) {
    return 'blue';
  }
  return null;
};

/**
 * Extracts tactical phase from command text
 */
const extractPhaseFromCommand = (command: string): { type: 'attack' | 'defense' | null; isAPC: boolean; isDPC: boolean } => {
  const normalized = command.toLowerCase();
  const isAPC = normalized.includes('apc') || 
                 normalized.includes('attacking') || 
                 normalized.includes('attack') ||
                 (normalized.includes('penalty corner') && (normalized.includes('attack') || normalized.includes('attacking')));
  const isDPC = normalized.includes('dpc') || 
                 normalized.includes('defending') || 
                 normalized.includes('defense') ||
                 (normalized.includes('penalty corner') && (normalized.includes('defend') || normalized.includes('defense')));
  
  let type: 'attack' | 'defense' | null = null;
  if (isDPC || normalized.includes('defend')) {
    type = 'defense';
  } else if (isAPC || normalized.includes('attack')) {
    type = 'attack';
  }
  
  return { type, isAPC, isDPC };
};

/**
 * AI-based matching: Uses AI to find the best tactic match for a command
 * Returns the matched tactic and whether coordinates need to be flipped
 */
async function findTacticMatchViaAI(
  command: string,
  availableTactics: SavedTactic[]
): Promise<{ tactic: SavedTactic; needsFlip: boolean; reason: string } | null> {
  if (availableTactics.length === 0) {
    return null;
  }

  // Check cache first
  const normalizedCommand = command.toLowerCase().trim();
  const cacheKey = normalizedCommand;
  const cached = aiMatchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    // Build prompt with command and tactic list
    const tacticsList = availableTactics.map(t => {
      const metadataStr = t.metadata ? JSON.stringify(t.metadata) : 'none';
      return `- ID: "${t.id}", Name: "${t.name}", Tags: [${t.tags.join(', ')}], Type: ${t.type}, Metadata: ${metadataStr}`;
    }).join('\n');

    const prompt = `You are a field hockey tactic matching assistant. Your job is to find the best matching saved tactic for a user's command.

USER COMMAND: "${command}"

AVAILABLE SAVED TACTICS:
${tacticsList}

INSTRUCTIONS:
1. Analyze the user's command to understand what they want (team, phase, structure, etc.)
2. **CRITICAL: Only return a match if the command is clearly requesting a tactical setup that matches the saved tactic**
3. **If the command is about drills, groups, formations, shapes, or anything unrelated to the saved tactics, return null**
4. Find the best matching tactic from the list above (only if step 2 passes)
5. **IMPORTANT: Determine if coordinates need to be flipped**
   - If the command requests a team (e.g., "Blue APC") and the saved tactic is for the opposite team (e.g., "Red APC") with the SAME phase (both APC or both DPC), set needsCoordinateFlip: true
   - Example: Command "show a blue apc" with saved "Red APC" → needsCoordinateFlip: true
   - Example: Command "blue apc" with saved "Blue APC" → needsCoordinateFlip: false
6. Return ONLY valid JSON, no markdown, no extra text

RETURN FORMAT:
{
  "tacticId": "id of the best matching tactic, or null if no good match",
  "needsCoordinateFlip": boolean,  // true if same phase but opposite team (needs coordinate flip)
  "reason": "brief explanation of why this tactic was chosen"
}

EXAMPLES:
- Command: "Setup Blue PC Defense" → Match: tactic with name/tags containing "blue", "dpc", "defense", needsCoordinateFlip: false
- Command: "Red Outlet Back 4" → Match: tactic with "red", "outlet", "back_4" in name/tags/metadata, needsCoordinateFlip: false
- Command: "Blue APC" or "show a blue apc" with saved "Red APC" → Match: "Red APC" with needsCoordinateFlip: true (opposite team, same phase)
- Command: "Blue DPC" with saved "Red APC" → Return null (different phases, not a match)
- Command: "Split into 3 groups" → Return null (this is a drill, not a saved tactic)
- Command: "Form a circle" → Return null (this is a shape command, not a saved tactic)
- Command: "Split into 3 groups of 4, each with a ball" → Return null (this is a drill command, not a saved tactic)

Now analyze the command and return the best match (or null if no relevant match):`;

    const config = getGeminiConfig();
    const generateContent = httpsCallable<{ prompt: string; model: string }, { text: string }>(
      functions,
      'generateContent'
    );

    const aiResult = await generateContent({ prompt, model: config.model });
    const text = aiResult.data.text;

    // Extract JSON from response
    const jsonText = extractJSONFromResponse(text);
    const aiResponse = JSON.parse(jsonText) as {
      tacticId: string | null;
      needsCoordinateFlip: boolean;
      reason: string;
    };

    if (!aiResponse.tacticId) {
      return null;
    }

    const matchedTactic = availableTactics.find(t => t.id === aiResponse.tacticId);
    if (!matchedTactic) {
      console.warn('AI returned invalid tactic ID:', aiResponse.tacticId);
      return null;
    }

    const matchResult = {
      tactic: matchedTactic,
      needsFlip: aiResponse.needsCoordinateFlip || false,
      reason: aiResponse.reason || 'Matched via AI'
    };

    // Cache the result
    aiMatchCache.set(cacheKey, {
      result: matchResult,
      timestamp: Date.now()
    });

    return matchResult;
  } catch (error) {
    console.warn('AI matching failed, falling back to simple matching:', error);
    return null;
  }
}

/**
 * Simple keyword-based matching fallback
 * Uses basic keyword matching on name/tags and filters by metadata if available
 */
function findTacticMatchSimple(
  command: string,
  tactics: SavedTactic[]
): SavedTactic | null {
  if (tactics.length === 0) {
    return null;
  }

  const normalizedCommand = command.toLowerCase().trim();
  const commandWords = normalizedCommand.split(/\s+/).filter(w => w.length > 0);
  
  // Filter out common stop words that shouldn't be used for matching
  const stopWords = new Set(['a', 'an', 'the', 'with', 'of', 'into', 'each', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'by', 'is', 'are', 'was', 'were']);
  const meaningfulWords = commandWords.filter(word => 
    word.length > 1 && !stopWords.has(word) && !/^\d+$/.test(word) // Exclude single chars, stop words, and pure numbers
  );

  // If no meaningful words after filtering, don't match anything
  if (meaningfulWords.length === 0) {
    return null;
  }

  // Extract command context for filtering
  const commandTeam = extractTeamFromCommand(normalizedCommand);
  const commandPhase = extractPhaseFromCommand(normalizedCommand);

  // Filter tactics by keyword matching
  const keywordMatches = tactics.filter(tactic => {
    const allText = [tactic.name, ...tactic.tags].join(' ').toLowerCase();
    
    // Check if at least one meaningful word matches (not just any word)
    const hasMatch = meaningfulWords.some(word => allText.includes(word));
    if (!hasMatch) return false;

    // Filter by metadata if available
    if (tactic.metadata) {
      // Team filter - but allow same-phase, opposite-team matches (needs coordinate flip)
      if (commandTeam && tactic.metadata.primaryTeam) {
        // Same phase, opposite team = valid match (will flip coordinates)
        const isSamePhase = commandPhase.type && tactic.metadata.phase && 
                           commandPhase.type === tactic.metadata.phase &&
                           ((commandPhase.isAPC && tactic.metadata.isAPC) || 
                            (commandPhase.isDPC && tactic.metadata.isDPC));
        
        if (commandTeam !== tactic.metadata.primaryTeam) {
          // Opposite team - only allow if same phase (for coordinate flipping) or full scenario
          if (!isSamePhase && tactic.type !== 'full_scenario') {
            return false;
          }
        }
      }

      // Phase filter
      if (commandPhase.type && tactic.metadata.phase && tactic.metadata.phase !== commandPhase.type) {
        return false;
      }

      // PC type filter
      if (commandPhase.isAPC && tactic.metadata.isDPC) return false;
      if (commandPhase.isDPC && tactic.metadata.isAPC) return false;
    }

    return true;
  });

  // Return first match (or null if none)
  return keywordMatches.length > 0 ? keywordMatches[0] : null;
}

/**
 * Searches saved tactics for a match against the command
 * Uses AI-based semantic matching with simple keyword fallback
 * Returns the matched tactic and whether coordinates need to be flipped
 */
const searchSavedTactics = async (command: string): Promise<{
  tactic: SavedTactic;
  needsFlip: boolean;
} | null> => {
  const allTactics = await getAllTactics();
  if (allTactics.length === 0) {
    return null;
  }
  
  // Try AI matching first
  const aiMatch = await findTacticMatchViaAI(command, allTactics);
  if (aiMatch) {
    return {
      tactic: aiMatch.tactic,
      needsFlip: aiMatch.needsFlip
    };
  }
  
  // Fallback to simple keyword matching
  const simpleMatch = findTacticMatchSimple(command, allTactics);
  if (simpleMatch) {
    // Check if coordinate flip is needed (same phase, opposite team)
    const commandTeam = extractTeamFromCommand(command.toLowerCase());
    const commandPhase = extractPhaseFromCommand(command.toLowerCase());
    const needsFlip = commandTeam && 
                     simpleMatch.metadata?.primaryTeam && 
                     commandTeam !== simpleMatch.metadata.primaryTeam &&
                     commandPhase.type && 
                     simpleMatch.metadata?.phase &&
                     commandPhase.type === simpleMatch.metadata.phase &&
                     ((commandPhase.isAPC && simpleMatch.metadata.isAPC) || 
                      (commandPhase.isDPC && simpleMatch.metadata.isDPC));
    
    return {
      tactic: simpleMatch,
      needsFlip: needsFlip || false
    };
  }
  
  return null;
};

export const interpretCommand = async (
  command: string,
  boardState: BoardState,
  modelOverride?: string,
  fieldConfig?: FieldConfig,
  mode?: "game" | "training"
): Promise<CommandResult> => {
  try {
    // Lookup First: Check saved tactics before using AI
    const match = await searchSavedTactics(command);
    
    if (match) {
      // Apply coordinate flip if needed
      const tacticToApply = match.needsFlip 
        ? flipTacticCoordinates(match.tactic, extractTeamFromCommand(command.toLowerCase()) || 'red')
        : match.tactic;
      
      // For full_scenario tactics, always apply ALL positions (both teams)
      // For single_team tactics, we can filter by team if specified
      const commandTeam = extractTeamFromCommand(command.toLowerCase());
      const teamFilter = tacticToApply.type === 'full_scenario' ? undefined : (commandTeam || undefined);
      
      // Convert saved tactic to moves
      const moves = savedTacticToMoves(tacticToApply, boardState, teamFilter);
      
      // Validate moves
      const allPlayers = [...boardState.redTeam, ...boardState.blueTeam, ...boardState.balls];
      const validationErrors: string[] = [];
      
      for (const move of moves) {
        if (!validatePosition(move.newPosition)) {
          validationErrors.push(
            `Invalid position for ${move.targetId}: (${move.newPosition.x}, ${move.newPosition.y})`
          );
        }
        
        const targetExists = allPlayers.some((p) => p.id === move.targetId);
        if (!targetExists) {
          validationErrors.push(`Target not found: ${move.targetId}`);
        }
      }
      
      if (validationErrors.length > 0) {
        // If validation fails, fall through to AI
        console.warn('Saved tactic validation failed, falling back to AI:', validationErrors);
      } else {
        // Return saved tactic as CommandResult
        return {
          action: 'multiple',
          moves: moves.map(m => ({
            targetId: m.targetId,
            newPosition: m.newPosition,
            explanation: `Loaded from saved tactic: ${match.tactic.name}`
          })),
          explanation: `Loaded saved tactic: ${match.tactic.name}`
        };
      }
    }
    
    // No saved tactic found or validation failed, use AI
    const prompt = createPrompt(command, boardState, fieldConfig, mode);
    const config = getGeminiConfig();
    const modelName = modelOverride || config.model;

    const generateContent = httpsCallable<{ prompt: string; model: string }, { text: string }>(
      functions,
      'generateContent'
    );

    const result = await generateContent({ prompt, model: modelName });
    const text = result.data.text;

    // Extract JSON from response
    const jsonText = extractJSONFromResponse(text);

    // Parse JSON
    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini response:', jsonText);
      throw new Error(`AI returned invalid JSON. Response: ${text.substring(0, 200)}...`);
    }

    // Handle Set Piece, Drill, and Tactical Phase Actions directly
    if (aiResponse.action === 'set_piece' || aiResponse.action === 'drill' || aiResponse.action === 'tactical_phase') {
      return aiResponse as CommandResult;
    }

    let finalMoves: Array<{ targetId: string; newPosition: Position; explanation?: string }> = [];
    let explanation = '';

    // Handle Shape Action
    if (aiResponse.action === 'shape' && 'shape' in aiResponse) {
      const shapeMoves = calculateShapePositions(aiResponse.shape);
      finalMoves = shapeMoves.map(m => ({ ...m, explanation: `Part of ${aiResponse.shape.type} shape` }));
      explanation = aiResponse.explanation;
    }
    // Handle Composite Action
    else if (aiResponse.action === 'composite') {
      if (aiResponse.shapes && Array.isArray(aiResponse.shapes)) {
        aiResponse.shapes.forEach(shape => {
          const shapeMoves = calculateShapePositions(shape);
          finalMoves = [...finalMoves, ...shapeMoves.map(m => ({ ...m, explanation: `Part of composite ${shape.type} shape` }))];
        });
      }

      if (aiResponse.moves && Array.isArray(aiResponse.moves)) {
        finalMoves = [...finalMoves, ...aiResponse.moves.map(m => ({ ...m, explanation: 'Individual move in composite action' }))];
      }
      explanation = aiResponse.explanation;
    }
    // Handle Standard Action
    else {
      const commandResult = aiResponse as CommandResult;
      // Validate the result structure - check if it has moves property
      if ('moves' in commandResult && Array.isArray(commandResult.moves)) {
        finalMoves = commandResult.moves;
        explanation = commandResult.explanation;
      } else {
        throw new Error('Invalid command result structure: moves array missing');
      }
    }

    // Resolve Overlaps
    const allPlayers = [...boardState.redTeam, ...boardState.blueTeam, ...boardState.balls];
    const existingPlayers = allPlayers.map(p => ({ id: p.id, position: p.position }));

    // Filter out ball from overlap resolution for now, or treat it separately if needed
    // Usually we only care about player overlaps
    const playerMoves = finalMoves.filter(m => !m.targetId.startsWith('ball'));
    const ballMoves = finalMoves.filter(m => m.targetId.startsWith('ball'));

    const resolvedPlayerMoves = resolveOverlaps(playerMoves, existingPlayers);

    // Recombine
    finalMoves = [...resolvedPlayerMoves, ...ballMoves];

    // Final Validation
    const validationErrors: string[] = [];
    for (const move of finalMoves) {
      if (!validatePosition(move.newPosition)) {
        validationErrors.push(
          `Invalid position for ${move.targetId}: (${move.newPosition.x}, ${move.newPosition.y})`
        );
      }

      // Check if target exists (skip for ball as it always exists)
      if (!move.targetId.startsWith('ball')) {
        const targetExists = allPlayers.some((p) => p.id === move.targetId);
        if (!targetExists) {
          validationErrors.push(`Target not found: ${move.targetId}`);
        }
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(`Validation errors: ${validationErrors.join('; ')}`);
    }

    return {
      action: aiResponse.action === 'reset' ? 'reset' : 'multiple',
      moves: finalMoves,
      explanation
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle Gemini safety filter blocks
    if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
      throw new Error('Command was blocked by content safety filters. Please try rephrasing your command.');
    }

    // Re-throw with more context
    throw new Error(`Failed to interpret command: ${errorMessage}`);
  }
};
