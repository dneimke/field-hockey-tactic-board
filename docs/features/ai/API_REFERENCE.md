# API Reference

This document provides complete reference documentation for all schemas, types, and validation rules in the AI Command System.

## Core Data Types

### Position
```typescript
interface Position {
  x: number;  // 0-100, percentage coordinate
  y: number;  // 0-100, percentage coordinate
}
```

### Player
```typescript
interface Player {
  id: string;              // Unique identifier (e.g., "R7", "B10")
  team: "red" | "blue";
  number: number;          // Jersey number
  position: Position;
  isGoalkeeper?: boolean;  // true for goalkeepers
}
```

**Player ID Format:**
- Red team: `R1`, `R2`, ..., `R11` (game mode) or `RN` (training mode)
- Blue team: `B1`, `B2`, ..., `B11` (game mode) or `BN` (training mode)

**Goalkeeper Identification:**
- Marked with `isGoalkeeper: true` flag
- Visually displayed as "GK" with distinct color (yellow)
- Typically player #1 on each team

### Ball
```typescript
interface Ball {
  id: string;           // "ball", "ball_2", "ball_3", etc.
  position: Position;
}
```

### Equipment
```typescript
interface Equipment {
  id: string;
  type: "cone" | "mini_goal" | "coach";
  position: Position;
  color?: string;
  rotation?: number; // degrees, 0-360
}
```

### BoardState
```typescript
interface BoardState {
  redTeam: Player[];      // Array of red players
  blueTeam: Player[];     // Array of blue players
  balls: Ball[];          // Array of balls (1 in game mode, multiple in training)
  equipment?: Equipment[]; // Array of training equipment
  mode?: "game" | "training";
}
```

## Command Result Types

The AI returns one of several command result types. **ALL** result types must include a `reasoning` field first.

### Common Interfaces

**Movement Types:**
```typescript
type MovementType = 'sprint' | 'curve' | 'jockey' | 'jog';
```

**Base Action:**
```typescript
interface BaseAction {
  reasoning: string; // Chain of Thought: logic explanation
  explanation: string; // User-facing explanation
}
```

### 1. Training Session Action (Phase 1: Unified Field Model)
This is the primary action for complex training scenarios.

```typescript
interface TrainingSessionAction extends BaseAction {
  action: "training_session";
  request: TrainingSessionRequest;
}

interface TrainingSessionRequest {
  meta: {
    context_type: "training_session";
    pitch_view: "full_pitch" | "half_pitch" | "circle_detail";
  };
  activities: Activity[];
}

interface Activity {
  id: string;
  name: string; // e.g., "GK Saving Drill"
  template_type: "ron_do" | "possession" | "shuttle" | "match_play" | "technical" | "small_sided_game";
  location: {
    anchor: "center_spot" | "top_D_left" | "top_D_right" | "baseline_center" | "custom";
    offset?: { x: number; y: number }; // Relative to anchor
    dimensions?: { width: number; height: number }; // For bounding box
    coordinate_system?: "relative_zone" | "absolute_offset";
  };
  entities: EntityRequest[];
}

interface EntityRequest {
  type: "player" | "gk" | "cone" | "mini_goal" | "coach";
  count: number;
  team?: "red" | "blue" | "neutral";
  behavior?: "static" | "active";
}
```

### 2. Standard Moves (MoveAction)
```typescript
interface MoveAction extends BaseAction {
  action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple';
  moves: Array<{
    targetId: string;        // Player ID or "ball"
    newPosition: Position;
    movementType?: MovementType; // Optional: sprint, curve, jockey, jog
    explanation?: string;
  }>;
}
```

**Action Types:**
- `move`: Single player movement
- `formation`: Multiple players repositioned into formation
- `reset`: Reset to initial positions
- `ball`: Ball movement
- `multiple`: Complex multi-piece movement

### 3. Set Piece Action
```typescript
interface SetPieceAction extends BaseAction {
  action: 'set_piece';
  type: 'APC' | 'DPC' | 'shootout';
  parameters: {
    // APC Parameters (Attacking Penalty Corner)
    batteries?: 1 | 2;              // Number of batteries (castles)
    injectorSide?: 'left' | 'right'; // Side of the goal
    injectorId?: string;            // Optional: specific player to inject
    battery1Type?: 'top' | 'right'; // Location of primary battery
    
    // DPC Parameters (Defensive Penalty Corner)
    defenseStructure?: '1-3' | '2-2' | 'line_stop';
    runnerCount?: number;           // Standard is 4 runners + GK
    
    // Shootout Parameters
    attackerId?: string;            // The taker (e.g., "R10")
    gkId?: string;                  // The defending GK (e.g., "B1")
  };
}
```

### 4. Drill Action (Legacy/Simple)
```typescript
interface DrillAction extends BaseAction {
  action: 'drill';
  type: 'small_sided_game' | 'possession';
  parameters: {
    attackers: number;          // Count of FIELD PLAYERS (NOT including GK)
    defenders: number;          // Count of FIELD PLAYERS (NOT including GK)
    withGK: boolean;            // true/false - only true if explicitly requested
    zone: 'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field';
    shape?: 'wide' | 'narrow';  // Optional positioning hint
    gameCount?: number;         // Optional: number of separate games (default: 1)
    gameZones?: Array<'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field'>;
  };
}
```

### 5. Tactical Phase Action
```typescript
interface TacticalPhaseAction extends BaseAction {
  action: 'tactical_phase';
  type: 'outlet' | 'press';
  team: 'red' | 'blue';
  structure: string;            // Structure name
  intensity?: number;           // Optional: 0-100 (for press height)
}
```

### 6. Shape Action
```typescript
interface ShapeAction extends BaseAction {
  action: 'shape';
  shape: {
    type: 'circle' | 'line' | 'grid';
    center?: { x: number; y: number };  // Default: {50, 50}
    radius?: number;                     // For circle, default: 25
    start?: { x: number; y: number };    // For line
    end?: { x: number; y: number };      // For line
    rows?: number;                       // For grid
    cols?: number;                       // For grid
    players: string[];                   // Ordered list of player IDs
  };
}
```

### 7. Composite Action
```typescript
interface CompositeAction extends BaseAction {
  action: 'composite';
  shapes?: Array<{
    type: 'circle' | 'line' | 'grid';
    center?: { x: number; y: number };
    players: string[];
    // ... other shape properties
  }>;
  moves?: Array<{
    targetId: string;
    newPosition: Position;
  }>;
}
```

## Saved Tactics (Living Playbook)

### SavedTactic
```typescript
interface SavedTactic {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Tactic name
  tags: string[];                // Array of tag strings
  type: 'single_team' | 'full_scenario';
  metadata?: {
    primaryTeam?: 'red' | 'blue';
    phase?: 'attack' | 'defense';
    isAPC?: boolean;
    isDPC?: boolean;
    isOutlet?: boolean;
    isPress?: boolean;
    structure?: string;          // e.g., "back_4", "half_court"
  };
  positions: Array<{
    team: 'red' | 'blue';
    role: 'GK' | 'Player';
    relativeIndex: number;
    x: number;
    y: number;
  }[];
}
```

## Field Configuration

### FieldType
```typescript
type FieldType = "standard" | "circle_detail";
```

### FieldConfig
```typescript
interface FieldConfig {
  type: FieldType;
  name: string;
  description: string;
}
```

**Standard Field:**
- Full field view
- All positions visible
- Best for general tactics

**Circle Detail:**
- Emphasizes shooting circles (D areas)
- Focuses on penalty corner tactics
- AI prioritizes circle positioning

## Coordinate System

### Axes
- **X-axis (0-100)**: Left goal (0) to Right goal (100)
- **Y-axis (0-100)**: Top edge (0) to Bottom edge (100)

### Field Zones

**Horizontal (X-axis):**
```
Defensive Third: 0 to 33.33
Midfield: 33.33 to 66.66
Attacking Third: 66.66 to 100
```

**Vertical (Y-axis):**
```
Left Wing: 0 to 25
Left Center: 25 to 50
Center Line: 50
Right Center: 50 to 75
Right Wing: 75 to 100
```

### Special Zones

**23m Area:**
- Left: x = 0 to 23
- Right: x = 77 to 100

**Shooting Circle (D):**
- Left: x = 0 to ~15, ellipse around goal
- Right: x = ~85 to 100, ellipse around goal

**Goal Lines:**
- Left: x = 0
- Right: x = 100

## Validation Rules

### Position Validation

**Bounds Check:**
```typescript
const isValidPosition = (pos: Position): boolean => {
  return pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100;
};
```

**Overlap Detection:**
```typescript
const minDistance = 3; // units
const hasOverlap = (pos1: Position, pos2: Position): boolean => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy) < minDistance;
};
```

### Tactical Constraints

**Goalkeeper Position:**
- Should stay in defensive third (x < 33.33)
- Warning if violated, not enforced

**Shootout Isolation:**
- No non-active players in 23m area during shootout
- All non-active players behind center line (x = 50)

**Press Heights:**
- Full Court Press: Forwards in attacking third (x > 66.66)
- Half Court Press: All players behind halfway (x < 50)

### Command Result Validation

**Required Fields:**
```typescript
// All command results must have:
- reasoning: string (Chain of Thought)
- action: string (one of the defined types)
- explanation: string

// Standard moves must have:
- moves: Array<Move>

// Each move must have:
- targetId: string
- newPosition: Position
```

**Player Existence:**
```typescript
// targetId must exist in current board state
const playerExists = (id: string, boardState: BoardState): boolean => {
  const allPlayers = [...boardState.redTeam, ...boardState.blueTeam];
  return allPlayers.some(p => p.id === id) || id.startsWith('ball');
};
```

## AI Prompt Structure

### Sections
1. **Field Geometry Anchors** (Reference Points: Center, D, P-Spot)
2. **Field View Context** (standard vs circle detail)
3. **Tactical Knowledge** (APC, DPC, Outlet, Press)
4. **Separated Board State** (Red GK, Red Field, Blue GK, Blue Field)
5. **Mode** (GAME vs TRAINING)
6. **Goal & Interfaces** (Strict TypeScript definitions)
7. **Instructions** (Mode-specific: Game vs Training)
8. **Critical Rules** (Reasoning, GK handling, JSON only)

### Mode-Specific Guidance

**Game Mode:**
```
- Focus: Match Scenarios
- Actions: Standard Moves, Set Pieces, Tactical Phases
- Single ball
```

**Training Mode:**
```
- Focus: Drills & Exercises
- Actions: TrainingSessionAction, DrillAction, Standard Moves
- Multiple balls allowed
- GKs excluded by default
- Anchor points for activity placement
```

## Error Codes & Messages

### API Errors
```
INVALID_API_KEY: "Gemini API key is not configured"
SAFETY_FILTER: "Command was blocked by content safety filters"
NETWORK_ERROR: "Network error occurred"
```

### Validation Errors
```
INVALID_JSON: "AI returned invalid JSON"
INVALID_POSITION: "Invalid position for {id}: ({x}, {y})"
PLAYER_NOT_FOUND: "Target not found: {id}"
MISSING_FIELD: "Required field missing: {field}"
```

### Living Playbook Errors
```
NO_MATCH: "No matching tactic found"
LOAD_ERROR: "Failed to load tactic"
SAVE_ERROR: "Failed to save tactic"
```

## Examples

### Example 1: Training Session (New)
```json
{
  "reasoning": "User wants a GK drill in the circle and a 3v3 game in midfield. Breaking into two activities.",
  "action": "training_session",
  "request": {
    "meta": { "context_type": "training_session", "pitch_view": "full_pitch" },
    "activities": [
      {
        "id": "gk_drill",
        "name": "GK Saves",
        "template_type": "technical",
        "location": { "anchor": "top_D_left" },
        "entities": [
          { "type": "gk", "count": 1 },
          { "type": "coach", "count": 1 },
          { "type": "cone", "count": 4 }
        ]
      },
      {
        "id": "midfield_game",
        "name": "3v3 Possession",
        "template_type": "small_sided_game",
        "location": { "anchor": "center_spot" },
        "entities": [
          { "type": "player", "count": 6 },
          { "type": "mini_goal", "count": 2 }
        ]
      }
    ]
  },
  "explanation": "Setting up GK drill in the D and 3v3 game in midfield"
}
```

### Example 2: Move Command (Game Mode)
```json
{
  "reasoning": "User wants to move red player 7 to center. Calculating center as 50,50.",
  "action": "move",
  "moves": [{
    "targetId": "R7",
    "newPosition": { "x": 50, "y": 50 },
    "explanation": "Moving to center"
  }],
  "explanation": "Moved red player 7 to center"
}
```

## Version History

**Current Version:** 4.0 (Unified Field Model)

**Changes:**
- 4.0: Added `TrainingSessionAction`, `Equipment` type, and `Activity` based architecture. Added named anchors for positioning.
- 3.1: Added "Chain of Thought" (reasoning field), strict interface injection, prompt routing, separated player lists.
- 3.0: Added Living Playbook, tactical phases (outlet/press), shootout
- 2.0: Added set pieces (APC/DPC), drills, training mode
- 1.0: Initial release with basic moves and formations
