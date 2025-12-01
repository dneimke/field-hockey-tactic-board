import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { BoardState, CommandResult, Position, SavedTactic } from '../types';
import { getGeminiConfig } from '../config/aiConfig';
import { validatePosition, calculateShapePositions, ShapeConfig, resolveOverlaps } from './positionCalculator';
import { FieldConfig } from '../config/fieldConfig';
import { savedTacticToMoves, getAllTactics, flipTacticCoordinates } from './tacticManager';
import { createPrompt } from './promptBuilder';

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

// createPrompt has been moved to promptBuilder.ts - import it from there

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
 * Checks if command phase and tactic phase are opposites (Outlet ↔ Press)
 */

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
1. **FIRST: Determine if this is a drill or training exercise command**
   - Drill indicators: "split", "groups", "drill", "small sided", "5v5", "4v4", "3v3", "possession", "exercise"
   - Commands about creating multiple teams/groups for practice
   - Commands requesting training scenarios or exercises
   - **CRITICAL: If this is a drill command, return null immediately - drills should NEVER match saved tactics**
   - Drills and saved tactics are fundamentally different: drills are training exercises, tactics are game scenarios
2. Analyze the user's command to understand what they want (team, phase, structure, etc.)
3. **CRITICAL: Only return a match if the command is clearly requesting a tactical setup that matches the saved tactic**
4. **NEVER match drill commands - they are fundamentally different from saved tactics**
5. Find the best matching tactic from the list above (only if steps 1-3 pass)
6. **IMPORTANT: Determine if coordinates need to be flipped**
   - If the command requests a team (e.g., "Blue APC") and the saved tactic is for the opposite team (e.g., "Red APC") with the SAME phase (both APC or both DPC), set needsCoordinateFlip: true
   - Example: Command "show a blue apc" with saved "Red APC" → needsCoordinateFlip: true
   - Example: Command "blue apc" with saved "Blue APC" → needsCoordinateFlip: false
7. **OUTLET ↔ PRESS OPPOSITES**: Outlet and Press are tactical opposites
   - A command for "press" can match a saved "outlet" tactic (and vice versa) IF it's a full scenario
   - Example: Command "Blue press" → Match: saved "Red Outlet" full scenario (no coordinate flip needed, applies as-is)
   - Example: Command "Red outlet" → Match: saved "Blue Press" full scenario (no coordinate flip needed, applies as-is)
8. **APC ↔ DPC OPPOSITES**: APC and DPC are tactical opposites for penalty corners
   - A command for "DPC" (defending penalty corner) can match a saved "APC" tactic (and vice versa) IF it's a full scenario
   - This works because full scenario PC tactics contain both teams: the attacking team (APC) and defending team (DPC)
   - Example: Command "Blue team defending a penalty corner" or "Blue DPC" → Match: saved "Red APC" full scenario (no coordinate flip needed, applies as-is)
   - Example: Command "Red team attacking penalty corner" or "Red APC" → Match: saved "Blue DPC" full scenario (if it exists, no coordinate flip needed)
   - IMPORTANT: Only match opposite phases for full_scenario tactics, not single_team tactics
9. Return ONLY valid JSON, no markdown, no extra text

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
- Command: "Blue DPC" with saved "Red APC" full scenario → Match: "Red APC" with needsCoordinateFlip: false (opposite phase, full scenario applies as-is - contains both Red attacking and Blue defending)
- Command: "Blue team defending a penalty corner" with saved "Red APC" full scenario → Match: "Red APC" with needsCoordinateFlip: false (opposite phase, full scenario applies as-is)
- Command: "Blue press" with saved "Red Outlet" full scenario → Match: "Red Outlet" with needsCoordinateFlip: false (opposite phase, full scenario applies as-is)
- Command: "Red outlet" with saved "Blue Press" full scenario → Match: "Blue Press" with needsCoordinateFlip: false (opposite phase, full scenario applies as-is)
- Command: "Split into 3 groups" → Return null (this is a drill, not a saved tactic)
- Command: "Split into 3 groups of 4, each with a ball" → Return null (this is a drill command, drills NEVER match tactics)
- Command: "Setup 2 small sided games (5v5) red vs blue" → Return null (this is a drill command with multiple groups, NOT a tactic)
- Command: "Form a circle" → Return null (this is a shape command, not a saved tactic)
- Command: "4v2 game in the D" → Return null (this is a drill, not a saved tactic)
- Command: "Create 3 groups for possession drill" → Return null (this is a drill, drills NEVER match tactics)

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
    console.warn('AI matching failed:', error);
    return null;
  }
}


/**
 * Searches saved tactics for a match against the command
 * Uses AI-based semantic matching only
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
  
  // Use AI matching only - AI is best at understanding intent and detecting drills
  const aiMatch = await findTacticMatchViaAI(command, allTactics);
  if (aiMatch) {
    return {
      tactic: aiMatch.tactic,
      needsFlip: aiMatch.needsFlip
    };
  }
  
  // If AI doesn't find a match, return null and let the command go to full AI interpretation
  // This ensures we don't get false positives from keyword matching
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
