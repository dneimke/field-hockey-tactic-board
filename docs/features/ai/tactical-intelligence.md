# Requirements Document: Tactical Intelligence Upgrade

**Project:** Field Hockey Tactical Whiteboard AI  
**Version:** 2.0  
**Status:** Approved for Implementation

## 1. Executive Summary

The current system successfully handles basic geometric moves and standard formations. The goal of this upgrade is to bridge the "Semantic Gap" by introducing Domain Intelligence. The system must understand high-level field hockey concepts (Penalty Corners, Small Sided Games, Specific Zones) and execute them using pre-defined Tactical Templates rather than relying on the LLM to calculate raw coordinates.

## 2. Architectural Changes

### 2.1 The "Template Engine" Approach

- **Current State:** LLM calculates specific (x, y) coordinates for every player.
- **New State:** LLM identifies the intent (e.g., "Setup a 2-battery PC") and returns a structured configuration. The application code (Logic Layer) calculates the precise FIH-compliant coordinates.

### 2.2 Phase Awareness

The system must now track and respect the "Game Phase" to ensure rules are followed (e.g., defenders behind the goal line during a PC).

## 3. Feature Specifications

### Feature A: Advanced Set Pieces (Penalty Corners)

#### Requirement

Users must be able to request specific Attacking (APC) and Defensive (DPC) Penalty Corner setups using natural language.

#### Schema Update (CommandResult)

Add a new action type `set_piece` to the JSON response schema.

```typescript
interface SetPieceAction {
  action: 'set_piece';
  type: 'APC' | 'DPC';
  parameters: {
    // APC Params
    batteries?: 1 | 2;              // Number of batteries (castles)
    injectorSide?: 'left' | 'right'; // Side of the goal
    injectorId?: string;            // Optional: specific player to inject
    battery1Type?: 'top' | 'right'; // Location of primary battery
    
    // DPC Params
    defenseStructure?: '1-3' | '2-2' | 'line_stop';
    runnerCount?: number;           // Standard is 4 runners + GK
  };
}
```

#### Logic Layer (positionCalculator.ts)

Implement `calculateSetPiecePositions(config)`:

**APC Logic:**
- **Injector:** Place on backline ($x=100$) 10m from post.
- **Battery 1 (Top):** Place Stopper at Top of D ($x \approx 84, y=50$), Hitter 1m behind.
- **Battery 2 (Right):** Place Stopper at Right D ($x \approx 84, y=65$), Hitter 1m behind.
- **Troop:** Distribute remaining attackers around the D 5m apart.

**DPC Logic:**
- **GK:** Center of goal ($x=100, y=50$).
- **Runners:** Place 4 defenders inside the goal/backline based on defenseStructure (e.g., '1-3' = 1 trail runner, 3 line runners).
- **Rest:** Move remaining 6 defenders to the Halfway Line ($x=50$).

### Feature B: Dynamic Drill Engine (Small Sided Games)

#### Requirement

Users can request "X vs Y" drills in specific field zones. The system must adhere to zone boundaries and distribute players logically.

#### Schema Update (CommandResult)

Add a new action type `drill` to the JSON response schema.

```typescript
interface DrillAction {
  action: 'drill';
  type: 'small_sided_game' | 'possession';
  parameters: {
    attackers: number;          // Count (e.g., 4)
    defenders: number;          // Count (e.g., 3)
    withGK: boolean;            // true/false
    zone: 'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field';
    shape?: 'wide' | 'narrow';  // Optional hint
  };
}
```

#### Logic Layer (positionCalculator.ts)

Implement `calculateDrillPositions(config)`:

**Zone Definition:**
- `attacking_25`: $x \in [75, 100], y \in [0, 100]$
- `midfield`: $x \in [33, 66], y \in [0, 100]$

**Player Selection:**
- Auto-select players if specific IDs aren't provided (e.g., R1-R4 for Attackers, B1-B3 for Defenders).

**Distribution Algorithm:**
- **Attackers:** Distribute in a wide arc or diamond shape within the zone.
- **Defenders:** Distribute in a compact cluster between the attackers and the goal.
- **GK:** If withGK is true, place GK at goal center.
- **Unused Players:** Move to "Bench" area (e.g., off-pitch or far sidelines) to reduce clutter.

### Feature C: Prompt Engineering (The "Brain")

#### Requirement

Update `commandInterpreter.ts` to instruct the AI on these new capabilities.

#### Prompt Additions

- **Set Piece Rules:** Explain APC constraints (injector on baseline, stopper at top of D).
- **Drill Mode:** Explain that "4v2" means a drill action, not manual moves.
- **Role Tokenization:** Instruct AI to interpret "Injector", "Flicker", "Runner" by assigning appropriate roles or players.

#### Examples

- **Input:** "Setup a 2-castle PC attack."  
  **Output:** `{"action": "set_piece", "type": "APC", "parameters": {"batteries": 2}}`

- **Input:** "4v2 game in the D."  
  **Output:** `{"action": "drill", "type": "small_sided_game", "parameters": {"attackers": 4, "defenders": 2, "zone": "defensive_circle"}}`

## 4. Implementation Steps

### Step 1: Types & Interfaces

- Update `types.ts` with `SetPieceAction` and `DrillAction`.
- Update `CommandResult` union type.

### Step 2: Logic Layer Implementation

- Create `src/utils/tacticalTemplates.ts`.
- Implement `getAPCPositions()`, `getDPCPositions()`.
- Implement `getDrillPositions()`.
- Integrate these into `positionCalculator.ts`.

### Step 3: Prompt Update

- Update `src/utils/commandInterpreter.ts` with the new System Prompt sections (Glossary, Rules, Examples).

### Step 4: Component Handling

- Update `useCommandExecution.ts` to handle the new action types.
- Ensure the move dispatcher can accept bulk updates from the template engine.

## 5. Success Criteria

- **Precision:** A request for an APC results in an injector exactly on the backline, not "near" it.
- **Constraint Satisfaction:** Drills in the "Attacking 25" never place players in the defensive half.
- **Usability:** Users can say "Standard PC defense" without needing to specify 5 coordinate pairs manually.