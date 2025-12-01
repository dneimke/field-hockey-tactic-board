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

### BoardState
```typescript
interface BoardState {
  redTeam: Player[];      // Array of red players
  blueTeam: Player[];     // Array of blue players
  balls: Ball[];          // Array of balls (1 in game mode, multiple in training)
  mode?: "game" | "training";
}
```

## Command Result Types

The AI returns one of six command result types:

### 1. Standard Moves
```typescript
{
  action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple';
  moves: Array<{
    targetId: string;        // Player ID or "ball"
    newPosition: Position;
    explanation?: string;
  }>;
  explanation: string;
}
```

**Action Types:**
- `move`: Single player movement
- `formation`: Multiple players repositioned into formation
- `reset`: Reset to initial positions
- `ball`: Ball movement
- `multiple`: Complex multi-piece movement

### 2. Set Piece Action
```typescript
interface SetPieceAction {
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
  explanation: string;
}
```

**APC Parameters:**
- `batteries`: Number of battery formations (1 or 2)
- `injectorSide`: Which side of goal the injector is on
- `injectorId`: Specific player to use as injector (optional)
- `battery1Type`: Primary battery position

**DPC Parameters:**
- `defenseStructure`: Defensive structure type
- `runnerCount`: Number of runners (default 4)

**Shootout Parameters:**
- `attackerId`: Attacker taking the shot
- `gkId`: Goalkeeper defending

### 3. Drill Action
```typescript
interface DrillAction {
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
  explanation: string;
}
```

**Critical Rules:**
- `attackers` and `defenders` count **FIELD PLAYERS ONLY** (goalkeepers excluded)
- "5v5" means 5 field players per team, NOT including goalkeepers
- `withGK` defaults to `false` unless explicitly requested
- System automatically filters goalkeepers before selecting players

**Zone Values:**
- `attacking_25`: x = 75-100
- `midfield`: x = 33.33-66.66
- `defensive_circle`: x = 0-25
- `full_field`: x = 0-100

### 4. Tactical Phase Action
```typescript
interface TacticalPhaseAction {
  action: 'tactical_phase';
  type: 'outlet' | 'press';
  team: 'red' | 'blue';
  structure: string;            // Structure name
  intensity?: number;           // Optional: 0-100 (for press height)
  explanation: string;
}
```

**Outlet Structures:**
- `back_4`: Back 4 dish structure
- `back_3`: Back 3 cup structure
- `three_high`: Three high structure
- `asymmetric_right`: Asymmetric right
- `asymmetric_left`: Asymmetric left

**Press Structures:**
- `full_court`: Full court press
- `half_court`: Half court zone
- `w_press`: W-press structure
- `split_vision`: Split vision press

**Intensity Parameter:**
- Range: 0-100
- Affects height of press block
- Higher value = more aggressive/higher press

### 5. Shape Action
```typescript
{
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
  explanation: string;
}
```

### 6. Composite Action
```typescript
{
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
  explanation: string;
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
  }>;
}
```

**Metadata:**
- Automatically extracted from name and tags
- Used for semantic matching
- Not manually specified by user

**Position Format:**
- `team`: Which team this position is for
- `role`: Goalkeeper or field player
- `relativeIndex`: Index within role group (e.g., 2nd field player)
- `x`, `y`: Coordinate positions (0-100)

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
1. Field Layout (coordinate system)
2. Field Glossary (domain terminology)
3. Tactical Knowledge (APC, DPC, Outlet, Press)
4. Mode Context (game vs training)
5. Field View Context (standard vs circle detail)
6. Board State (all current positions)
7. Available Formations
8. Command (user input)
9. Instructions (6 command options)
10. Examples (sample commands)
11. Constraints (validation rules)

### Mode-Specific Guidance

**Game Mode:**
```
- Fixed 11 players per team
- Standard formations apply
- Single ball typically
```

**Training Mode:**
```
- Variable player counts allowed
- Only reference players that exist in current state
- Multiple balls allowed
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

### Example 1: Move Command
```json
{
  "action": "move",
  "moves": [{
    "targetId": "R7",
    "newPosition": { "x": 50, "y": 50 },
    "explanation": "Moving to center"
  }],
  "explanation": "Moved red player 7 to center"
}
```

### Example 2: APC Setup
```json
{
  "action": "set_piece",
  "type": "APC",
  "parameters": {
    "batteries": 2,
    "injectorSide": "left"
  },
  "explanation": "Setting up 2-battery APC with left injector"
}
```

### Example 3: Training Drill
```json
{
  "action": "drill",
  "type": "small_sided_game",
  "parameters": {
    "attackers": 5,
    "defenders": 5,
    "withGK": false,
    "zone": "midfield"
  },
  "explanation": "Setting up 5v5 game in midfield"
}
```

### Example 4: Tactical Phase
```json
{
  "action": "tactical_phase",
  "type": "outlet",
  "team": "red",
  "structure": "back_4",
  "explanation": "Setting up Back 4 outlet for red team"
}
```

### Example 5: Shape Command
```json
{
  "action": "shape",
  "shape": {
    "type": "circle",
    "center": { "x": 50, "y": 50 },
    "radius": 30,
    "players": ["R1", "R2", "R3", "B1", "B2", "B3"]
  },
  "explanation": "Forming circle with 6 players"
}
```

## Version History

**Current Version:** 3.0

**Changes:**
- 3.0: Added Living Playbook, tactical phases (outlet/press), shootout
- 2.0: Added set pieces (APC/DPC), drills, training mode
- 1.0: Initial release with basic moves and formations

