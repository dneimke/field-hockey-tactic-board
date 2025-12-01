# System Architecture

This document describes the technical architecture of the AI Command System, including data flow, component organization, and request/response handling.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│  CommandInput.tsx, PlayerManagement.tsx, SettingsMenu.tsx   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                        │
│           useCommandExecution.ts (React Hook)                │
│  - Orchestrates execution flow                               │
│  - Handles loading/error states                              │
│  - Updates board state                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMMAND INTERPRETER                       │
│              commandInterpreter.ts (Logic)                   │
│  - Checks Living Playbook first (lookup-first strategy)     │
│  - Falls back to AI if no match                              │
│  - Parses and validates AI responses                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐      ┌────────────────────────┐
│ LIVING PLAYBOOK  │      │    GOOGLE GEMINI       │
│ tacticManager.ts │      │    (External API)      │
│ - Semantic match │      │  - Interprets command  │
│ - Load tactics   │      │  - Returns JSON        │
└──────────────────┘      └───────────┬────────────┘
                                      │
                                      ▼
                         ┌───────────────────────────┐
                         │   PROMPT BUILDER          │
                         │   promptBuilder.ts        │
                         │ - Constructs AI prompt    │
                         │ - Injects context         │
                         └───────────┬───────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  POSITION CALCULATOR                         │
│         positionCalculator.ts + tacticalTemplates.ts        │
│  - Interprets CommandResult                                  │
│  - Routes to appropriate template function                   │
│  - Calculates precise coordinates                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      BOARD UPDATE                            │
│                App State (React Context)                     │
│  - Applies position moves                                    │
│  - Triggers re-render                                        │
└─────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. UI Layer

**Components:**
- `CommandInput.tsx`: Natural language input field
- `PlayerManagement.tsx`: Mode switching, player count controls
- `SettingsMenu.tsx`: Living Playbook access, save tactics

**Responsibilities:**
- Capture user input
- Display loading/error states
- Show command feedback
- Manage mode (game/training)

### 2. State Management Layer

**Hook: `useCommandExecution.ts`**

**Responsibilities:**
- Orchestrate async execution flow
- Handle errors and loading states
- Update board state via `onPieceMove` callback
- Optionally add animation frames
- Pass context (field config, mode) to interpreter

**Key Functions:**
```typescript
const executeCommand = async (command: string) => {
  setIsLoading(true);
  try {
    const result = await interpretCommand(command, boardState, fieldConfig, mode);
    // Apply moves to board
    applyMoves(result.moves);
    setLastExplanation(result.explanation);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Command Interpretation Layer

**File: `commandInterpreter.ts`**

**Flow:**
```
1. Check Living Playbook (tacticManager.findMatchingTactic)
   ├─ Match found → Load saved positions → Return moves
   └─ No match → Continue to step 2

2. Build AI Prompt (promptBuilder.createPrompt)
   ├─ Field layout
   ├─ Current board state
   ├─ Mode context (game/training)
   ├─ Field view context
   ├─ Tactical knowledge
   └─ Instructions & examples

3. Call Google Gemini API
   └─ Send prompt → Receive JSON response

4. Parse Response
   ├─ Extract JSON from markdown (if present)
   ├─ Validate structure
   └─ Return CommandResult

5. Route to Position Calculator (if needed)
```

**Key Functions:**
```typescript
export const interpretCommand = async (
  command: string,
  boardState: BoardState,
  fieldConfig?: FieldConfig,
  mode?: 'game' | 'training'
): Promise<CommandResult>
```

### 4. Living Playbook Layer

**File: `tacticManager.ts`**

**Responsibilities:**
- Store/retrieve saved tactics (localStorage)
- AI-powered semantic matching
- Coordinate transformations (flipping for opposite team)
- Metadata extraction

**Matching Logic:**
```typescript
// Scoring system for finding best match
Base Score:
  - Exact name match: 100 points
  - Name contains command: 50 points
  - Tag match: 25 points

Team Matching:
  - Perfect team match: +30 points
  - Team mismatch: -40 points
  - Full scenario: +5 points

Phase Matching:
  - Perfect phase match: +30 points
  - Phase mismatch: -40 points
  - PC type match: +10 points
  - Opposite PC type: -50 points

Minimum threshold: 20 points
```

### 5. Prompt Building Layer

**File: `promptBuilder.ts`**

**Sections:**
1. **Field View Context** - Current field type (standard/circle detail)
2. **Field Layout** - Coordinate system, zones
3. **Field Glossary** - Domain terminology
4. **Tactical Knowledge** - APC, DPC, Outlet, Press, etc.
5. **Mode Context** - Game vs Training mode awareness
6. **Board State** - Current player positions with counts
7. **Available Formations** - List of supported formations
8. **Command** - The user's natural language input
9. **Instructions** - Six command options (A-F)
10. **Examples** - Sample commands and expected outputs
11. **Constraints** - Validation rules

**Dynamic Sections:**
```typescript
const createPrompt = (
  command: string,
  boardState: BoardState,
  fieldConfig?: FieldConfig,
  mode?: 'game' | 'training'
): string
```

### 6. Position Calculation Layer

**Files:**
- `positionCalculator.ts`: Main routing logic
- `tacticalTemplates.ts`: Template implementations

**Routing:**
```typescript
switch (action.action) {
  case 'set_piece':
    if (action.type === 'APC') return calculateAPCPositions(...);
    if (action.type === 'DPC') return calculateDPCPositions(...);
    if (action.type === 'shootout') return getShootoutPositions(...);
    
  case 'drill':
    return calculateDrillPositions(...);
    
  case 'tactical_phase':
    if (action.type === 'outlet') return getOutletPositions(...);
    if (action.type === 'press') return getPressPositions(...);
    
  case 'shape':
    return calculateShapePositions(...);
    
  case 'move':
  case 'formation':
  case 'ball':
  case 'multiple':
    return action.moves; // Already has positions
}
```

**Template Functions:**
- `calculateAPCPositions()`: Attacking penalty corner
- `calculateDPCPositions()`: Defensive penalty corner
- `getShootoutPositions()`: Shootout setup
- `calculateDrillPositions()`: Small-sided games
- `getOutletPositions()`: Outlet structures (Back 4, Back 3, etc.)
- `getPressPositions()`: Press structures (Full Court, Half Court, etc.)

## Data Flow Examples

### Example 1: Basic Move (No Templates)

```
User: "Move red player 7 to center"
  ↓
AI Interprets: { action: 'move', moves: [{ targetId: 'R7', newPosition: { x: 50, y: 50 } }] }
  ↓
Position Calculator: Returns moves as-is (already has coordinates)
  ↓
Board Update: Moves R7 to (50, 50)
```

### Example 2: Penalty Corner (Template-Based)

```
User: "Setup a 2-castle PC attack"
  ↓
AI Interprets: { action: 'set_piece', type: 'APC', parameters: { batteries: 2 } }
  ↓
Position Calculator: Routes to calculateAPCPositions()
  ├─ Identifies red team as attackers
  ├─ Places injector on backline
  ├─ Positions 2 batteries (stoppers + hitters)
  ├─ Distributes troop around D
  └─ Returns 11 moves with calculated positions
  ↓
Opponent Positioning: Automatically calls calculateDPCPositions() for blue team
  ↓
Board Update: Positions all 22 players
```

### Example 3: Saved Tactic (Living Playbook)

```
User: "Setup Blue PC Defense"
  ↓
Living Playbook: Semantic search finds "Blue PC Defense - Standard" (score: 130)
  ├─ Match found (score > 20 threshold)
  ├─ Load saved positions
  └─ Return as CommandResult with moves
  ↓
Position Calculator: Skipped (positions already calculated)
  ↓
Board Update: Applies saved positions (instant)
```

### Example 4: Training Drill (Multi-Step)

```
User: "5v5 game in midfield"
  ↓
AI Interprets: { 
  action: 'drill', 
  type: 'small_sided_game',
  parameters: { attackers: 5, defenders: 5, withGK: false, zone: 'midfield' }
}
  ↓
Position Calculator: Routes to calculateDrillPositions()
  ├─ Filters out goalkeepers (not included in 5v5)
  ├─ Selects 5 red field players (attackers)
  ├─ Selects 5 blue field players (defenders)
  ├─ Positions players in midfield zone (x: 33-66)
  ├─ Moves unused players off-field
  └─ Moves goalkeepers off-field (withGK: false)
  ↓
Board Update: Positions 10 field players, moves rest off-field
```

## Mode Awareness

The system automatically switches modes based on command type:

```
Drill commands → Training Mode
  - "5v5 game in midfield"
  - "Split into 3 groups"
  - "Setup 2 small sided games"

Tactical commands → Game Mode
  - "Setup Blue PC Defense"
  - "Red Outlet Back 4"
  - "Blue team press full court"

Saved tactic loads → Keep current mode
  - Mode doesn't force change on load
```

## Opponent Auto-Positioning

When executing tactical phases, the system infers the opponent's phase:

```
Outlet ↔ Press
  - "Red Outlet Back 4" → Blue positioned in "Half Court Press"
  - "Blue Press Full Court" → Red positioned in "Back 4 Outlet"

APC ↔ DPC
  - "Red APC" → Blue positioned in "DPC"
  - "Blue DPC" → Red positioned in "APC"
```

**Implementation:**
```typescript
const inferOpponentPhase = (phase: 'outlet' | 'press'): 'outlet' | 'press' => {
  return phase === 'outlet' ? 'press' : 'outlet';
};

const inferOpponentStructure = (phase: 'outlet' | 'press'): string => {
  return phase === 'outlet' ? 'half_court' : 'back_4';
};
```

## Error Handling

### AI Response Errors
```
Invalid API Key → User-friendly message
Safety Filter Block → Suggest rephrasing
Invalid JSON → Error with response snippet
Network Error → Standard error message
```

### Validation Errors
```
Position out of bounds → Clamp to 0-100
Player not found → Skip move with warning
Missing required field → Return error
```

### Living Playbook Errors
```
No match found → Fall back to AI
Load error → Return error message
Invalid saved data → Skip entry
```

## Performance Considerations

### Caching
- Living Playbook tactics cached in memory after first load
- AI responses not cached (each command is fresh)

### Request Optimization
- Lookup-first strategy reduces AI calls
- Semantic matching uses AI but on small dataset (saved tactics)
- Position calculation is synchronous (no external calls)

### Response Times
```
Living Playbook match: < 100ms (AI semantic matching + load)
AI interpretation: 500-2000ms (depends on Gemini API)
Position calculation: < 50ms (synchronous math)
Board update: < 100ms (React render)
```

## Storage

### localStorage Keys
- `hockey_tactics`: Regular saved tactics (animation sequences)
- `hockey_saved_tactics`: Living Playbook tactics (positional snapshots)

### Data Persistence
- Browser-specific (not synced across devices)
- Persists across sessions
- Cleared if user clears browser data

## Extensibility

### Adding New Templates
1. Create template function in `tacticalTemplates.ts`
2. Add to pattern map (e.g., `OUTLET_PATTERNS`, `PRESS_PATTERNS`)
3. Update prompt in `promptBuilder.ts` with new structure name
4. Add routing in `positionCalculator.ts`

### Adding New Command Types
1. Define new action type in `types.ts`
2. Update `CommandResult` union type
3. Add routing in `positionCalculator.ts`
4. Update prompt instructions in `promptBuilder.ts`
5. Add examples to prompt

### Modifying AI Behavior
1. Update prompt sections in `promptBuilder.ts`
2. Add/modify examples
3. Adjust constraints and rules
4. Test with various commands

## Dependencies

**External:**
- `@google/generative-ai`: Google Gemini API client
- React: UI framework
- TypeScript: Type safety

**Internal:**
- No inter-module circular dependencies
- Clean separation of concerns (UI → State → Logic → Calculation)

