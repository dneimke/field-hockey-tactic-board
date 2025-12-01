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
│ - Fuzzy match    │      │  - Interprets command  │
│ - Load tactics   │      │  - Returns JSON        │
└──────────────────┘      └───────────┬────────────┘
                                      │
                                      ▼
                         ┌───────────────────────────┐
                         │   PROMPT BUILDER          │
                         │   promptBuilder.ts        │
                         │ - Constructs AI prompt    │
                         │ - Injects Interfaces      │
                         │ - Routes Game/Train Logic │
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

### 3. Command Interpretation Layer

**File: `commandInterpreter.ts`**

**Flow:**
```
1. Check Living Playbook (tacticManager.searchTactics)
   ├─ Match found → Load saved positions → Return moves
   └─ No match → Continue to step 2

2. Build AI Prompt (promptBuilder.createPrompt)
   ├─ Field geometry anchors
   ├─ Field view context
   ├─ Tactical knowledge
   ├─ Separated Player Lists (GK vs Field)
   ├─ Mode context (GAME vs TRAINING)
   ├─ Interface Definitions (Type-Chat)
   └─ Instructions & Critical Rules

3. Call Google Gemini API
   └─ Send prompt → Receive JSON response

4. Parse Response
   ├─ Extract JSON from markdown (if present)
   ├─ Validate structure (reasoning field first)
   └─ Return CommandResult

5. Route to Position Calculator (if needed)
```

### 4. Living Playbook Layer

**File: `tacticManager.ts`**

**Responsibilities:**
- Store/retrieve saved tactics (localStorage/Firestore)
- Fuzzy string matching (resilient to typos)
- Coordinate transformations (flipping for opposite team)
- Metadata extraction

### 5. Prompt Building Layer

**File: `promptBuilder.ts`**

**Architecture:**
Uses a "Prompt Router" pattern to dynamically assemble the prompt based on the current mode.

**Components:**
1. **Geometry Anchors:** Hardcoded field coordinates (Center, D, P-Spot).
2. **Separated Player Lists:** distinct lists for `[RED TEAM]` (GK vs Field) and `[BLUE TEAM]` (GK vs Field) to prevent drill hallucinations.
3. **Interface Injection:** Raw TypeScript interface strings (`COMMON_INTERFACES`, `GAME_INTERFACES`, `TRAINING_INTERFACES`) injected directly into the prompt.
4. **Mode Router:**
   - **Game Mode:** Injects `GAME_INTERFACES` and Game instructions (Set Pieces, Tactics).
   - **Training Mode:** Injects `TRAINING_INTERFACES` and Training instructions (Drills, Shapes).

**Key Function:**
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
    // Routes to APC, DPC, or Shootout templates
  case 'drill':
    // Routes to Drill templates (filters out GKs automatically)
  case 'tactical_phase':
    // Routes to Outlet or Press templates
  case 'shape':
    // Geometric calculations
  case 'move':
    // Returns moves as-is
}
```

## Data Flow Examples

### Example 1: Penalty Corner (Template-Based)

```
User: "Setup a 2-castle PC attack"
  ↓
AI Interprets: { 
  reasoning: "...", 
  action: 'set_piece', 
  type: 'APC', 
  parameters: { batteries: 2 } 
}
  ↓
Position Calculator: Routes to calculateAPCPositions()
  ├─ Identifies red team as attackers
  ├─ Places injector on backline
  ├─ Positions 2 batteries (stoppers + hitters)
  └─ Returns 11 moves with calculated positions
  ↓
Board Update: Positions players
```

### Example 2: Training Drill (Multi-Step)

```
User: "5v5 game in midfield"
  ↓
AI Interprets: { 
  reasoning: "Excluding GKs...", 
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

The system explicitly routes logic based on mode:

```
GAME MODE
- Prompt: Includes SetPieceAction, TacticalPhaseAction
- Instructions: "Focus on MATCH SCENARIOS"
- Interfaces: Strict typed game interfaces

TRAINING MODE
- Prompt: Includes DrillAction
- Instructions: "Focus on DRILLS", "5v5 means 5 FIELD PLAYERS"
- Interfaces: Strict typed drill interfaces
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

## Storage

### localStorage Keys
- `hockey_saved_tactics`: Living Playbook tactics (positional snapshots)
- `hockey_tactics_seeded`: Flag for initial content seeding

## Extensibility

### Adding New Templates
1. Create template function in `tacticalTemplates.ts`
2. Add to pattern map
3. Update prompt in `promptBuilder.ts` (Tactical Knowledge section)

### Adding New Command Types
1. Define new interface string in `promptBuilder.ts` (e.g., `ANIMATION_INTERFACES`)
2. Update `types.ts`
3. Add routing in `positionCalculator.ts`
4. Update Prompt Router logic

## Dependencies

**External:**
- `@google/generative-ai`: Google Gemini API client
- `fuse.js` (or similar): Fuzzy search for tactics
- React: UI framework
- TypeScript: Type safety

**Internal:**
- No inter-module circular dependencies
- Clean separation of concerns (UI → State → Logic → Calculation)
