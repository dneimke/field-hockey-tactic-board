import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { BoardState, CommandResult, Position } from '../types';
import { getGeminiConfig } from '../config/aiConfig';
import { validatePosition, calculateShapePositions, ShapeConfig, resolveOverlaps } from './positionCalculator';

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

const createPrompt = (command: string, boardState: BoardState): string => {
  const formations = ['4-3-3', '4-4-2', '3-5-2', '3-4-3', '5-3-2'].join(', ');

  return `You are a field hockey tactic assistant. Your job is to interpret natural language commands and convert them into specific player movements on a field hockey pitch.

FIELD LAYOUT:
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

CURRENT BOARD STATE:
Red Team Players:
${boardState.redTeam.map((p) => `  - Player ${p.number} (ID: ${p.id}): Position (x: ${p.position.x}, y: ${p.position.y})`).join('\n')}

Blue Team Players:
${boardState.blueTeam.map((p) => `  - Player ${p.number} (ID: ${p.id}): Position (x: ${p.position.x}, y: ${p.position.y})`).join('\n')}

Ball Position: ${boardState.balls.map(b => `(ID: ${b.id}, x: ${b.position.x}, y: ${b.position.y})`).join(', ')}

AVAILABLE FORMATIONS: ${formations}

COMMAND TO INTERPRET: "${command}"

INSTRUCTIONS:
1. Understand what the user wants to do
2. Determine which players/ball need to move
3. Calculate new positions based on tactical understanding
4. Return a JSON object. You have three options for the structure:

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

EXAMPLES:
- "Move red player 7 to center" → { "action": "move", "moves": [{ "targetId": "R7", "newPosition": { "x": 50, "y": 50 }, "explanation": "Moving to center" }], "explanation": "Moved red player 7 to center" }
- "Form a circle with all players" → { "action": "shape", "shape": { "type": "circle", "center": { "x": 50, "y": 50 }, "radius": 30, "players": ["R1", "B1", "R2", "B2", ...] }, "explanation": "Forming a circle" }
- "Setup 5v5 training drill" → { 
  "action": "composite", 
  "shapes": [
    { "type": "grid", "center": { "x": 25, "y": 50 }, "players": ["R1", "B1", "R2", "B2", "R3", "B3", "R4", "B4", "R5", "B5"] },
    { "type": "grid", "center": { "x": 75, "y": 50 }, "players": ["R6", "B6", "R7", "B7", "R8", "B8", "R9", "B9", "R10", "B10"] }
  ],
  "moves": [
    { "targetId": "ball_1", "newPosition": { "x": 25, "y": 50 } },
    { "targetId": "ball_2", "newPosition": { "x": 75, "y": 50 } },
    { "targetId": "GK_R", "newPosition": { "x": 5, "y": 50 } },
    { "targetId": "GK_B", "newPosition": { "x": 95, "y": 50 } }
  ],
  "explanation": "Created two 5v5 groups with a ball for each group." 
}
- "Reset to match start" → { "action": "reset", "moves": [{ "targetId": "ball", "newPosition": { "x": 50, "y": 50 } }], "explanation": "Resetting to standard game mode" }

IMPORTANT:
- Return ONLY valid JSON, no markdown, no extra text
- All positions must be between 0-100 for both x and y
- Use actual player IDs from the current state
- For "alternating" patterns, simply order the "players" array in the desired sequence (e.g., Red1, Blue1, Red2, Blue2...)
- When creating groups (e.g. 5v5), ensure you mix players from both teams if requested.
- Pay attention to spatial requests (e.g. "different part of field"). Goalkeepers are usually at x=5 (left) and x=95 (right), but can be moved together if requested.
- Avoid placing players on top of each other.
- Use "ball_1", "ball_2" etc. ONLY if multiple balls are needed. Otherwise use "ball".

Now interpret this command: "${command}"`;
};

// Internal type for AI response parsing
type AIResponse =
  | CommandResult
  | { action: 'shape'; shape: ShapeConfig; explanation: string }
  | { action: 'composite'; shapes?: ShapeConfig[]; moves?: Array<{ targetId: string; newPosition: Position }>; explanation: string };

export const interpretCommand = async (
  command: string,
  boardState: BoardState,
  modelOverride?: string
): Promise<CommandResult> => {
  try {
    const prompt = createPrompt(command, boardState);
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
      // Validate the result structure
      if (!commandResult.moves || !Array.isArray(commandResult.moves)) {
        throw new Error('Invalid command result structure: moves array missing');
      }
      finalMoves = commandResult.moves;
      explanation = commandResult.explanation;
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
