# AI Command Feature Documentation

## Overview

The AI Command feature allows users to control player and ball positions on a field hockey tactic board using natural language commands. The system uses Google Gemini AI to interpret commands and converts them into precise position coordinates that update the board state.

**Key Components:**
- Natural language command interpretation via Google Gemini API
- Automatic position calculation for players and ball
- Formation management and tactical positioning
- Real-time board state awareness

## Data Schemas

### Core Types

```typescript
interface Position {
  x: number;  // 0-100, percentage coordinate
  y: number;  // 0-100, percentage coordinate
}

interface Player {
  id: string;           // Unique identifier (e.g., "R7" for red player 7, "B10" for blue player 10)
  team: "red" | "blue";
  number: number;       // Jersey number (varies in training mode)
  position: Position;
  isGoalkeeper?: boolean; // true for goalkeepers (displayed as "GK" with distinct color)
}

interface Ball {
  id: "ball";           // Always "ball"
  position: Position;
}

interface BoardState {
  redTeam: Player[];    // Array of players (11 in game mode, variable in training mode)
  blueTeam: Player[];  // Array of players (11 in game mode, variable in training mode)
  balls: Ball[];       // Array of balls (typically 1 in game mode, can be multiple in training)
  mode?: "game" | "training"; // Current mode context
}
```

### Command Result Schema

The AI must return commands in this exact JSON structure:

```typescript
type CommandResult = 
  | {
      action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple';
      moves: Array<{
        targetId: string;        // Player ID (e.g., "R7", "B10") or "ball"
        newPosition: Position;   // { x: number, y: number }
        explanation?: string;    // Optional explanation of the move
      }>;
      explanation: string;       // Overall explanation of the command execution
    }
  | SetPieceAction
  | DrillAction
  | TacticalPhaseAction;

interface SetPieceAction {
  action: 'set_piece';
  type: 'APC' | 'DPC' | 'shootout';
  parameters: {
    // APC Params
    batteries?: 1 | 2;
    injectorSide?: 'left' | 'right';
    injectorId?: string;
    battery1Type?: 'top' | 'right';
    
    // DPC Params
    defenseStructure?: '1-3' | '2-2' | 'line_stop';
    runnerCount?: number;
    
    // Shootout Params
    attackerId?: string;        // The taker (e.g., "R10")
    gkId?: string;               // The defending GK (e.g., "B1")
  };
  explanation: string;
}

interface DrillAction {
  action: 'drill';
  type: 'small_sided_game' | 'possession';
  parameters: {
    attackers: number;
    defenders: number;
    withGK: boolean;
    zone: 'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field';
    shape?: 'wide' | 'narrow';
  };
  explanation: string;
}

interface TacticalPhaseAction {
  action: 'tactical_phase';
  type: 'outlet' | 'press';
  team: 'red' | 'blue';
  structure: string;            // Structure name (e.g., 'back_4', 'full_court', 'w_press')
  intensity?: number;           // Optional: 0-100 (for press height/intensity)
  explanation: string;
}
```

**Action Types:**
- `move`: Single player movement
- `formation`: Multiple players repositioned into a formation
- `reset`: Reset players to initial positions
- `ball`: Ball movement
- `multiple`: Complex multi-piece movement
- `set_piece`: Penalty corners (APC/DPC) or shootouts
- `drill`: Training drills and small-sided games
- `tactical_phase`: Outletting and pressing structures

## Field Hockey Context

### Game Mode vs Training Mode

The system operates in two distinct modes:

**Game Mode:**
- Fixed 11 players per team
- Standard formations apply
- Single ball typically
- Goalkeepers always present (player #1 with `isGoalkeeper: true`)

**Training Mode:**
- Variable player counts (can be any number)
- Flexible formations based on available players
- Multiple balls allowed for drills
- Goalkeepers optional
- AI must only reference players that exist in current state

The AI prompt includes mode context to ensure appropriate command interpretation.

### Field Types

The system supports multiple field diagram views:

**Standard Field View:**
- Full field view for general tactics
- All positions (0-100) visible and valid
- Best for formations and overall strategy

**Circle Detail View:**
- Emphasizes shooting circles (D areas)
- Focuses on penalty corners and circle tactics
- AI prioritizes circle area positioning
- Same coordinate system (0-100) but with positioning guidance

The current field type is included in the AI prompt for context-aware positioning.

### Field Layout & Coordinate System

The field uses a **percentage-based coordinate system** (0-100 for both axes):

**X-Axis (Width):**
- `0` = Left goal line
- `33.33` = End of defensive third
- `66.66` = End of midfield
- `100` = Right goal line

**Y-Axis (Height):**
- `0` = Top edge of field
- `50` = Center line
- `100` = Bottom edge of field

**Field Zones:**
- **Defensive Third**: x = 0 to 33.33
- **Midfield**: x = 33.33 to 66.66
- **Attacking Third**: x = 66.66 to 100

**Vertical Zones:**
- **Left Wing**: y = 0 to 25
- **Left Center**: y = 25 to 50
- **Center**: y = 50 (center line)
- **Right Center**: y = 50 to 75
- **Right Wing**: y = 75 to 100

### Teams

- **Red Team**: Typically the "home" team, positioned on the left side
- **Blue Team**: Typically the "away" team, positioned on the right side

**Game Mode**: Both teams have 11 players:
- 1 Goalkeeper (player #1, marked with `isGoalkeeper: true`)
- 3-5 Defenders
- 3-5 Midfielders
- 1-3 Forwards

**Training Mode**: Variable player counts per team (can be any number, including 0)
- Goalkeeper is optional and identified by `isGoalkeeper: true` flag
- Player counts are dynamic and shown in board state

### Supported Formations

The system supports common field hockey formations:

**4-3-3 Formation:**
- 4 Defenders (x ≈ 18)
- 3 Midfielders (x ≈ 35)
- 3 Forwards (x ≈ 52)
- 1 Goalkeeper (x ≈ 5)

**4-4-2 Formation:**
- 4 Defenders (x ≈ 18)
- 4 Midfielders (x ≈ 35)
- 2 Forwards (x ≈ 52)
- 1 Goalkeeper (x ≈ 5)

**3-5-2 Formation:**
- 3 Defenders (x ≈ 18)
- 5 Midfielders (x ≈ 35)
- 2 Forwards (x ≈ 52)
- 1 Goalkeeper (x ≈ 5)

**3-4-3 Formation:**
- 3 Defenders (x ≈ 18)
- 4 Midfielders (x ≈ 35)
- 3 Forwards (x ≈ 52)
- 1 Goalkeeper (x ≈ 5)

**5-3-2 Formation:**
- 5 Defenders (x ≈ 18)
- 3 Midfielders (x ≈ 35)
- 2 Forwards (x ≈ 52)
- 1 Goalkeeper (x ≈ 5)

### Formation Position Mapping

Each formation defines 11 positions in order (Game Mode only):
1. Goalkeeper (GK) - always at x ≈ 5, y ≈ 50, marked with `isGoalkeeper: true`
2-5. Defenders - x ≈ 18, varying y positions
6-10. Midfielders/Forwards - x ≈ 35-52, varying y positions

**Home Team (Red):** Uses formation positions as-is
**Away Team (Blue):** Positions are mirrored horizontally (x = 100 - formationX)

**Training Mode**: Formations are flexible and adapt to current player count

### Tactical Concepts

**Common Terms:**
- **Press**: Move players forward aggressively
- **Counter-attack**: Rapid forward movement from defense
- **Zonal marking**: Players cover specific field zones
- **Man-to-man**: Players track specific opponents
- **Wing play**: Emphasis on wide attacking positions
- **Center**: Middle of the field (x ≈ 50, y ≈ 50)

**Positional Roles:**
- **Goalkeeper**: Stays in defensive third, typically x < 10. Visually distinct with "GK" label and different color (yellow). Identified by `isGoalkeeper: true` flag.
- **Defenders**: Primarily in defensive third and midfield, x < 40
- **Midfielders**: Cover midfield, x ≈ 30-60
- **Forwards**: Primarily in attacking third, x > 50

## AI Prompt Structure

### Prompt Template

The system constructs a detailed prompt for the AI that includes:

1. **Role Definition**: "You are a field hockey tactic assistant"
2. **Field Layout Description**: Coordinate system and zones
3. **Current Board State**: All player positions and ball position
4. **Available Formations**: List of supported formations
5. **User Command**: The natural language command to interpret
6. **Instructions**: How to structure the response
7. **Examples**: Sample command interpretations
8. **Constraints**: Validation rules and tactical considerations

### Full Prompt Example

```
You are a field hockey tactic assistant. Your job is to interpret natural language commands and convert them into specific player movements on a field hockey pitch.

FIELD LAYOUT:
- The field uses percentage coordinates (0-100 for both x and y)
- X-axis: 0 = left goal, 100 = right goal
- Y-axis: 0 = top edge, 100 = bottom edge
- Defensive third: x = 0-33.33
- Midfield: x = 33.33-66.66
- Attacking third: x = 66.66-100

CURRENT BOARD STATE:
Red Team Players:
  - Player 1 (ID: R1): Position (x: 5, y: 46.5)
  - Player 2 (ID: R2): Position (x: 18, y: 15)
  ... (all 11 players)

Blue Team Players:
  - Player 1 (ID: B1): Position (x: 95, y: 46.5)
  ... (all 11 players)

Ball Position: (x: 48.5, y: 48)

AVAILABLE FORMATIONS: 4-3-3, 4-4-2, 3-5-2, 3-4-3, 5-3-2

COMMAND TO INTERPRET: "Move red player 7 to center"

INSTRUCTIONS:
1. Understand what the user wants to do
2. Determine which players/ball need to move
3. Calculate new positions based on tactical understanding
4. Return a JSON object with the following structure:

{
  "action": "move" | "formation" | "reset" | "ball" | "multiple",
  "moves": [
    {
      "targetId": "player ID (e.g., R7, B10) or 'ball'",
      "newPosition": { "x": number, "y": number },
      "explanation": "brief explanation"
    }
  ],
  "explanation": "overall explanation of what was done"
}

EXAMPLES:
- "Move red player 7 to center" → { "action": "move", "moves": [{ "targetId": "R7", "newPosition": { "x": 50, "y": 50 }, "explanation": "Moving to center" }], "explanation": "Moved red player 7 to center" }
- "Set red team to 4-4-2 formation" → Multiple moves for all red players
- "Move ball to red player 10" → { "action": "ball", "moves": [{ "targetId": "ball", "newPosition": { "x": [player10.x], "y": [player10.y] } }] }

IMPORTANT:
- Return ONLY valid JSON, no markdown, no extra text
- All positions must be between 0-100 for both x and y
- Use actual player IDs from the current state
- Be tactically sensible (e.g., goalkeepers stay in defensive zone)

Now interpret this command: "Move red player 7 to center"
```

## Positioning System

### Coordinate Transformation

The board supports both **portrait** and **landscape** orientations:

**Landscape (Default):**
- Direct coordinate mapping
- No transformation needed

**Portrait:**
- Display coordinates are rotated 90° clockwise
- Internal state always uses standard coordinates
- Transformation: `displayX = 100 - stateY`, `displayY = stateX`

**Important:** AI always receives and returns standard coordinates (0-100), regardless of display orientation.

### Position Calculation

**Field Zone Resolution:**
- Zones like "center", "left wing", "defensive third" are mapped to approximate coordinates
- Zone names are normalized and matched against predefined zones

**Relative Positioning:**
- "Near", "next to", "beside": 5% offset from target
- "Behind": 10% backward (decrease x)
- "In front of"/"Ahead": 10% forward (increase x)
- "To the left": 10% left (decrease y)
- "To the right": 10% right (increase y)

**Formation Calculation:**
- Formation names are matched (case-insensitive)
- Positions extracted from formation template
- Home team uses positions as-is
- Away team mirrors horizontally

### Player Identification

**Player ID Format:**
- Red team: `R1`, `R2`, ..., `RN` (variable in training mode)
- Blue team: `B1`, `B2`, ..., `BN` (variable in training mode)
- Goalkeepers: Typically `R1` or `B1`, identified by `isGoalkeeper: true` flag
- Ball: `"ball"` (or `"ball_2"`, `"ball_3"` etc. in training mode)

**Player Reference Parsing:**
- "red player 7" → `R7`
- "blue player 10" → `B10`
- "player 5" → searches both teams, uses first match
- "goalkeeper" or "GK" → `R1` or `B1` (if exists and marked as goalkeeper)
- Number extraction uses regex: `/\d+/`

**Goalkeeper Special Handling:**
- Goalkeepers are visually distinct: display "GK" instead of number, yellow color
- Identified in board state with `[GK]` label
- AI is aware of goalkeeper status and typically keeps them in defensive positions

## Command Examples

### Single Player Movement

**Command:** "Move red player 7 to center"
```json
{
  "action": "move",
  "moves": [{
    "targetId": "R7",
    "newPosition": { "x": 50, "y": 50 },
    "explanation": "Moving to center of field"
  }],
  "explanation": "Moved red player 7 to the center of the field"
}
```

**Command:** "Move goalkeeper to left circle" (Training Mode)
```json
{
  "action": "move",
  "moves": [{
    "targetId": "R1",
    "newPosition": { "x": 10, "y": 50 },
    "explanation": "Moving goalkeeper to left shooting circle"
  }],
  "explanation": "Moved red goalkeeper to left shooting circle"
}
```

**Command:** "Move blue player 10 to the attacking third"
```json
{
  "action": "move",
  "moves": [{
    "targetId": "B10",
    "newPosition": { "x": 83, "y": 50 },
    "explanation": "Moving to center of attacking third"
  }],
  "explanation": "Moved blue player 10 into the attacking third"
}
```

### Formation Commands

**Command:** "Set red team to 4-4-2 formation" (Game Mode)
```json
{
  "action": "formation",
  "moves": [
    { "targetId": "R1", "newPosition": { "x": 5, "y": 50 }, "explanation": "Goalkeeper" },
    { "targetId": "R2", "newPosition": { "x": 18, "y": 15 }, "explanation": "Defender" },
    { "targetId": "R3", "newPosition": { "x": 18, "y": 35 }, "explanation": "Defender" },
    { "targetId": "R4", "newPosition": { "x": 18, "y": 65 }, "explanation": "Defender" },
    { "targetId": "R5", "newPosition": { "x": 18, "y": 85 }, "explanation": "Defender" },
    { "targetId": "R6", "newPosition": { "x": 35, "y": 20 }, "explanation": "Midfielder" },
    { "targetId": "R7", "newPosition": { "x": 35, "y": 40 }, "explanation": "Midfielder" },
    { "targetId": "R8", "newPosition": { "x": 35, "y": 60 }, "explanation": "Midfielder" },
    { "targetId": "R9", "newPosition": { "x": 35, "y": 80 }, "explanation": "Midfielder" },
    { "targetId": "R10", "newPosition": { "x": 52, "y": 30 }, "explanation": "Forward" },
    { "targetId": "R11", "newPosition": { "x": 52, "y": 70 }, "explanation": "Forward" }
  ],
  "explanation": "Set red team to 4-4-2 formation"
}
```

### Ball Movement

**Command:** "Move ball to red player 10"
```json
{
  "action": "ball",
  "moves": [{
    "targetId": "ball",
    "newPosition": { "x": 45, "y": 46.5 },
    "explanation": "Moving ball near red player 10"
  }],
  "explanation": "Moved ball to red player 10's position"
}
```

### Team Tactics

**Command:** "Blue team press high"
```json
{
  "action": "multiple",
  "moves": [
    { "targetId": "B2", "newPosition": { "x": 45, "y": 15 }, "explanation": "Pressing forward" },
    { "targetId": "B3", "newPosition": { "x": 45, "y": 40 }, "explanation": "Pressing forward" },
    { "targetId": "B4", "newPosition": { "x": 45, "y": 60 }, "explanation": "Pressing forward" },
    { "targetId": "B5", "newPosition": { "x": 45, "y": 85 }, "explanation": "Pressing forward" },
    { "targetId": "B6", "newPosition": { "x": 55, "y": 25 }, "explanation": "Pressing forward" },
    { "targetId": "B7", "newPosition": { "x": 55, "y": 46.5 }, "explanation": "Pressing forward" },
    { "targetId": "B8", "newPosition": { "x": 55, "y": 75 }, "explanation": "Pressing forward" },
    { "targetId": "B9", "newPosition": { "x": 65, "y": 15 }, "explanation": "Pressing forward" },
    { "targetId": "B10", "newPosition": { "x": 65, "y": 46.5 }, "explanation": "Pressing forward" },
    { "targetId": "B11", "newPosition": { "x": 65, "y": 80 }, "explanation": "Pressing forward" }
  ],
  "explanation": "Blue team pressing high - all outfield players moved forward"
}
```

### Complex Commands

**Command:** "Player 7 passes to 10, then 10 moves forward"
```json
{
  "action": "multiple",
  "moves": [
    {
      "targetId": "ball",
      "newPosition": { "x": 45, "y": 46.5 },
      "explanation": "Ball moves from player 7 to player 10"
    },
    {
      "targetId": "R10",
      "newPosition": { "x": 55, "y": 46.5 },
      "explanation": "Player 10 moves forward after receiving pass"
    }
  ],
  "explanation": "Player 7 passes to player 10, then player 10 moves forward"
}
```

### Outletting Structures

**Command:** "Red team outlet using a Back 3"
```json
{
  "action": "tactical_phase",
  "type": "outlet",
  "team": "red",
  "structure": "back_3",
  "explanation": "Setting up Back 3 outlet structure for red team"
}
```

**Command:** "Show me a standard Back 4 outlet"
```json
{
  "action": "tactical_phase",
  "type": "outlet",
  "team": "red",
  "structure": "back_4",
  "explanation": "Setting up Back 4 dish outlet structure"
}
```

**Available Outlet Structures:**
- `back_4`: Back 4 dish structure (CBs deep at x≈10, Fullbacks wide at x≈25)
- `back_3`: Back 3 cup structure (Central CB high at x≈20, Side backs deep at x≈10)
- `three_high`: Three high structure (Single deep CB at x≈10, Two high side backs at x≈40)
- `asymmetric_right`: Asymmetric right structure (stronger right side)
- `asymmetric_left`: Asymmetric left structure (stronger left side)

### Pressing Structures

**Command:** "Blue team setup a Half Court press"
```json
{
  "action": "tactical_phase",
  "type": "press",
  "team": "blue",
  "structure": "half_court",
  "explanation": "Setting up Half Court press for blue team"
}
```

**Command:** "Red team press full court"
```json
{
  "action": "tactical_phase",
  "type": "press",
  "team": "red",
  "structure": "full_court",
  "intensity": 80,
  "explanation": "Setting up Full Court press for red team"
}
```

**Available Press Structures:**
- `full_court`: Full court press (Man-to-man matching high, x > 75)
- `half_court`: Half court zone (3 lines: Forward x=45, Midfield x=35, Defense x=25)
- `w_press`: W-press structure (CF at x=60, Wingers at x=60, Inner Mids at x=50)
- `split_vision`: Split vision press (split field, press on one side)

**Press Intensity:**
- Optional parameter (0-100) that adjusts the height of the press block
- Higher intensity pushes players further up the field

### Shootout

**Command:** "Shootout for R10"
```json
{
  "action": "set_piece",
  "type": "shootout",
  "parameters": {
    "attackerId": "R10"
  },
  "explanation": "Setting up shootout for red player 10"
}
```

**Command:** "Setup a shootout for Red player 10 against Blue goalkeeper"
```json
{
  "action": "set_piece",
  "type": "shootout",
  "parameters": {
    "attackerId": "R10",
    "gkId": "B1"
  },
  "explanation": "Setting up shootout: R10 vs B1"
}
```

**Shootout Rules:**
- Attacker placed at center of 23m line (x=75 for red, x=25 for blue, y=50)
- Goalkeeper placed on goal line (x=100 for red attacking, x=0 for blue attacking, y=50)
- All other players moved behind center line (x=50) for isolation
- No non-active players allowed in 23m area (x < 23 or x > 77)

## Validation Rules

### Position Validation

1. **Bounds Check:**
   - x must be between 0 and 100 (inclusive)
   - y must be between 0 and 100 (inclusive)

2. **Overlap Detection:**
   - Minimum distance between players: 3 units
   - Overlaps generate warnings but don't prevent execution

3. **Tactical Constraints:**
   - Goalkeepers should stay in defensive third (x < 33.33)
   - Violations are warned but not enforced

4. **Shootout Isolation:**
   - During a shootout action, ensure no non-active players are within the 23m area (x < 23 or x > 77)
   - All non-active players must be behind the center line (x=50)

5. **Pressing Heights:**
   - **Full Court Press:** Forwards must be in Attacking Third (x > 66.66)
   - **Half Court Press:** Forwards must not cross Halfway Line (x < 50)

6. **Coordinate Mirroring:**
   - Ensure outlet and press structures work correctly for both Red (left-to-right) and Blue (right-to-left) orientations
   - Blue team positions are automatically mirrored horizontally

### Command Result Validation

1. **Required Fields:**
   - `action` must be one of the defined action types
   - `moves` must be an array
   - `explanation` must be a string

2. **Move Validation:**
   - Each move must have `targetId` and `newPosition`
   - `targetId` must match an existing player ID or be "ball"
   - `newPosition` must have valid x and y values

3. **Player Existence:**
   - `targetId` must exist in current board state
   - Ball always exists

## API Integration

### Google Gemini Configuration

**Environment Variables:**
- `VITE_GEMINI_API_KEY`: Required, Google Gemini API key
- `VITE_GEMINI_MODEL`: Optional, defaults to `gemini-2.0-flash-exp`

**Supported Models:**
- `gemini-2.0-flash-exp` (default)
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- `gemini-2.5-pro`

### API Call Flow

1. **Initialization:**
   - Create `GoogleGenerativeAI` instance with API key
   - Get generative model with specified model name
   - Reuse model instance for subsequent calls

2. **Command Interpretation:**
   - Construct prompt with board state and command
   - Call `model.generateContent(prompt)`
   - Extract response text
   - Parse JSON from response (may be wrapped in markdown)

3. **Response Parsing:**
   - Extract JSON from markdown code blocks if present
   - Fallback to direct JSON parsing
   - Validate structure matches `CommandResult` schema

4. **Error Handling:**
   - API key errors → User-friendly message
   - Safety filter blocks → Suggest rephrasing
   - Invalid JSON → Return error with response snippet
   - Network errors → Standard error message

### JSON Extraction

The AI may return JSON wrapped in markdown:

```markdown
```json
{
  "action": "move",
  ...
}
```
```

The system extracts JSON using regex:
1. Try to match markdown code blocks: `/```(?:json)?\s*(\{[\s\S]*\})\s*```/`
2. Fallback to finding JSON object: `/\{[\s\S]*\}/`

## Implementation Details

### File Structure

```
src/
├── components/
│   └── CommandInput.tsx          # UI component for command input
├── hooks/
│   └── useCommandExecution.ts    # Hook for command execution logic
├── utils/
│   ├── commandInterpreter.ts     # Gemini API integration
│   ├── positionCalculator.ts     # Position calculation utilities
│   ├── formationDefinitions.ts   # Formation templates
│   └── tacticalTemplates.ts      # Tactical phase templates (outlet, press, shootout)
├── config/
│   └── aiConfig.ts               # API configuration
└── types.ts                      # TypeScript type definitions
```

### Key Functions

**`interpretCommand(command: string, boardState: BoardState): Promise<CommandResult>`**
- Main entry point for command interpretation
- Handles API communication and response parsing
- Returns validated `CommandResult`

**`validatePosition(position: Position): boolean`**
- Checks if position is within bounds (0-100)

**`checkPlayerOverlap(newPosition: Position, allPlayers: Array, minDistance: number): boolean`**
- Detects if new position would overlap with existing players
- Default minimum distance: 3 units

**`getFormationPositions(formationName: string, isHomeTeam: boolean): Position[]`**
- Returns array of 11 positions for a formation
- Handles team mirroring for away team

**`getOutletPositions(structure: string, team: 'red' | 'blue', players: Player[]): Array<{targetId: string; newPosition: Position}>`**
- Calculates positions for outlet structures (Back 4, Back 3, Three High, etc.)
- Handles team orientation and player distribution

**`getPressPositions(structure: string, team: 'red' | 'blue', players: Player[], intensity?: number): Array<{targetId: string; newPosition: Position}>`**
- Calculates positions for pressing structures (Full Court, Half Court, W-Press, etc.)
- Adjusts positions based on intensity parameter (0-100)

**`getShootoutPositions(attackerId: string | undefined, gkId: string | undefined, boardState: BoardState): Array<{targetId: string; newPosition: Position}>`**
- Sets up shootout positions with isolation rules
- Moves all non-active players behind center line

## Usage Guidelines

### Best Practices for AI Prompting

1. **Be Specific:** Include team color and player number when possible
   - Good: "Move red player 7 to center"
   - Less clear: "Move player 7 to center"

2. **Use Field Hockey Terminology:** The AI understands tactical terms
   - "Press high", "counter-attack", "wing play"
   - Formation names: "4-3-3", "4-4-2", etc.

3. **Specify Zones Clearly:**
   - "Defensive third", "midfield", "attacking third"
   - "Left wing", "right wing", "center"

4. **Multi-step Commands:** Can combine multiple actions
   - "Player 7 passes to 10, then 10 moves forward"

### Common Command Patterns

**Single Moves:**
- "Move [team] player [number] to [location]"
- "Move ball to [team] player [number]"

**Formations:**
- "Set [team] team to [formation] formation"
- "[Team] team [formation]"

**Team Tactics:**
- "[Team] team press high"
- "[Team] team drop deep"
- "[Team] team counter-attack"

**Outletting:**
- "[Team] team outlet using [structure]" (e.g., "Back 4", "Back 3", "Three High")
- "Show me a standard [structure] outlet"

**Pressing:**
- "[Team] team press [structure]" (e.g., "full court", "half court", "W-Press")
- "[Team] team setup a [structure] press"

**Shootouts:**
- "Shootout for [player]" (e.g., "R10", "Blue player 10")
- "Setup a shootout for [team] player [number]"

**Resets:**
- "Reset [team] team"
- "Reset positions"

## Error Handling

### Common Errors

1. **Invalid API Key:**
   - Message: "Gemini API key is not configured"
   - Solution: Set `VITE_GEMINI_API_KEY` environment variable

2. **Invalid JSON Response:**
   - Message: "AI returned invalid JSON"
   - Solution: Check prompt or try rephrasing command

3. **Safety Filter Block:**
   - Message: "Command was blocked by content safety filters"
   - Solution: Rephrase command to be less ambiguous

4. **Player Not Found:**
   - Message: "Target not found: [ID]"
   - Solution: Verify player ID exists in board state

5. **Invalid Position:**
   - Message: "Invalid position for [ID]: (x, y)"
   - Solution: Position must be within 0-100 range

## Testing Considerations

### Test Scenarios

1. **Simple Movement:** Single player to specific location
2. **Formation Changes:** Entire team repositioning
3. **Ball Movement:** Ball positioning near players
4. **Complex Commands:** Multi-step tactical changes
5. **Edge Cases:** Invalid positions, missing players, malformed JSON

### Validation Test Cases

- Positions outside 0-100 range
- Non-existent player IDs (especially important in training mode)
- Missing required fields in response
- Invalid action types
- Player overlap scenarios
- Training mode: referencing players that don't exist
- Game mode: player count validation (must be 11)
- Outlet structures: testing with both teams and various player counts
- Press structures: testing different intensities and team orientations
- Shootout: verifying isolation rules and player positioning

## Future Enhancements

Potential improvements:
- Rule-based fallback parser for common commands
- Command history and favorites
- Voice command support
- Tactical templates/pre-sets
- Multi-language command support
- More granular formation customization
- Additional field types (e.g., half-field view)
- Coordinate transformation for zoomed field views
- Quick preset configurations for common training scenarios (5v5, 7v7, etc.)


