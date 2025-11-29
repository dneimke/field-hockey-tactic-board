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
  number: number;       // Jersey number (1-11)
  position: Position;
}

interface Ball {
  id: "ball";           // Always "ball"
  position: Position;
}

interface BoardState {
  redTeam: Player[];    // Array of 11 players
  blueTeam: Player[];   // Array of 11 players
  ball: Ball;
}
```

### Command Result Schema

The AI must return commands in this exact JSON structure:

```typescript
interface CommandResult {
  action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple';
  moves: Array<{
    targetId: string;        // Player ID (e.g., "R7", "B10") or "ball"
    newPosition: Position;   // { x: number, y: number }
    explanation?: string;    // Optional explanation of the move
  }>;
  explanation: string;       // Overall explanation of the command execution
}
```

**Action Types:**
- `move`: Single player movement
- `formation`: Multiple players repositioned into a formation
- `reset`: Reset players to initial positions
- `ball`: Ball movement
- `multiple`: Complex multi-piece movement

## Field Hockey Context

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

Both teams have 11 players:
- 1 Goalkeeper (usually player #1)
- 3-5 Defenders
- 3-5 Midfielders
- 1-3 Forwards

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

Each formation defines 11 positions in order:
1. Goalkeeper (GK) - always at x ≈ 5, y ≈ 50
2-5. Defenders - x ≈ 18, varying y positions
6-10. Midfielders/Forwards - x ≈ 35-52, varying y positions

**Home Team (Red):** Uses formation positions as-is
**Away Team (Blue):** Positions are mirrored horizontally (x = 100 - formationX)

### Tactical Concepts

**Common Terms:**
- **Press**: Move players forward aggressively
- **Counter-attack**: Rapid forward movement from defense
- **Zonal marking**: Players cover specific field zones
- **Man-to-man**: Players track specific opponents
- **Wing play**: Emphasis on wide attacking positions
- **Center**: Middle of the field (x ≈ 50, y ≈ 50)

**Positional Roles:**
- **Goalkeeper**: Stays in defensive third, typically x < 10
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
- Red team: `R1`, `R2`, ..., `R11`
- Blue team: `B1`, `B2`, ..., `B11`
- Ball: `"ball"`

**Player Reference Parsing:**
- "red player 7" → `R7`
- "blue player 10" → `B10`
- "player 5" → searches both teams, uses first match
- Number extraction uses regex: `/\d+/`

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

**Command:** "Set red team to 4-4-2 formation"
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
│   └── formationDefinitions.ts   # Formation templates
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
- Non-existent player IDs
- Missing required fields in response
- Invalid action types
- Player overlap scenarios

## Future Enhancements

Potential improvements:
- Rule-based fallback parser for common commands
- Command history and favorites
- Voice command support
- Tactical templates/pre-sets
- Multi-language command support
- More granular formation customization


