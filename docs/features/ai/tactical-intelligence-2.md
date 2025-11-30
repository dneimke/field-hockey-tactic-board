# Requirements Document: Tactical Intelligence Upgrade (Phase 3)

**Project:** Field Hockey Tactical Whiteboard AI  
**Version:** 3.0 (Extension of v2.0)  
**Status:** Ready for Development  
**Scope:** Structural Phases (Outletting, Pressing, Shootouts)

## 1. Executive Summary

Phase 3 expands the "Template Engine" introduced in Phase 2. While Phase 2 focused on static Set Pieces (PCs) and Drills, Phase 3 introduces Dynamic Game Phases. The system will now understand and visualize standard structural patterns for Outletting (playing out from the back) and Pressing (defensive structures), as well as the unique rules of a Shootout.

## 2. Feature Specifications

### Feature D: The Outletting Engine

**Goal:** Allow users to request standard defensive structures used to break a press.

#### User Stories

- "Show me a standard Back 4 outlet."
- "Set up a Back 3 cup structure."
- "Red team is playing out with 3 high."

#### Schema Update (CommandResult)

Extend CommandResult to include TacticalPhaseAction.

```typescript
interface TacticalPhaseAction {
  action: 'tactical_phase';
  type: 'outlet';
  team: 'red' | 'blue';
  structure: 'back_4' | 'back_3' | 'three_high' | 'asymmetric_right' | 'asymmetric_left';
}
```

#### Logic Layer (tacticalTemplates.ts)

Implement `getOutletPositions(structure, team)`:

- **Back 4 (Dish):** CBs deep and split ($x \approx 10, y \approx 35/65$), Fullbacks wide and higher ($x \approx 25, y \approx 5/95$).
- **Back 3 (Cup):** Central CB high ($x \approx 20, y=50$), Side Backs deep and wide ($x \approx 10, y \approx 20/80$).
- **Three High:** Single deep CB ($x \approx 10, y=50$), two very high side backs ($x \approx 40$).

### Feature E: The Pressing Engine

**Goal:** Allow users to set entire team defensive structures with a single command.

#### User Stories

- "Blue team press full court."
- "Drop into a Half Court zone."
- "Set up a W-Press."

#### Schema Update (CommandResult)

Extend TacticalPhaseAction to include press type.

```typescript
interface PressAction { // Merged into TacticalPhaseAction in implementation
  action: 'tactical_phase';
  type: 'press';
  team: 'red' | 'blue';
  structure: 'full_court' | 'half_court' | 'w_press' | 'split_vision';
  intensity?: number; // Optional: 0-100 (height of the block)
}
```

#### Logic Layer (tacticalTemplates.ts)

Implement `getPressPositions(structure, team)`:

- **Full Court:** Man-to-man matching high ($x > 75$).
- **Half Court:** All 10 outfield players behind $x=50$. Structure is usually 3 lines (Forward line at $x=45$, Midfield at $x=35$, Defense at $x=25$).
- **W-Press:** A specific shape for forwards: Center Forward ($x=60, y=50$), Wingers ($x=60, y=20/80$), Inner Mids ($x=50, y=35/65$).

### Feature F: Shootout Mode

**Goal:** Visualize the FIH 8-second shootout setup.

#### User Stories

- "Setup a shootout for Red player 10."
- "Clear the board for a penalty shootout."

#### Schema Update (CommandResult)

Add ShootoutAction.

```typescript
interface ShootoutAction {
  action: 'set_piece';
  type: 'shootout';
  parameters: {
    attackerId?: string; // The taker
    gkId?: string;       // The defending GK
  };
}
```

#### Logic Layer (tacticalTemplates.ts)

Implement `getShootoutPositions(attackerId, gkId)`:

- **Attacker:** Place at center of 23m line ($x=75, y=50$ or $x=25, y=50$).
- **Goalkeeper:** Place on goal line ($x=100, y=50$ or $x=0, y=50$).
- **Spectators:** All other players moved behind the center line ($x=50$) to simulate the isolation rules.

## 3. Implementation Technical Guide

### 3.1 Types & Interfaces (types.ts)

```typescript
// Additions to CommandResult union
export type CommandResult = 
  | MoveAction 
  | FormationAction 
  | SetPieceAction // Updated with 'shootout'
  | DrillAction 
  | TacticalPhaseAction; // New

export interface TacticalPhaseAction {
  action: 'tactical_phase';
  type: 'outlet' | 'press';
  team: 'red' | 'blue';
  structure: string; 
}
```

### 3.2 Logic Map (tacticalTemplates.ts)

You will create a map of structure names to coordinate functions.

```typescript
const OUTLET_PATTERNS = {
  'back_4': calculateBack4,
  'back_3': calculateBack3,
  // ...
};

const PRESS_PATTERNS = {
  'full_court': calculateFullCourtPress,
  'half_court': calculateHalfCourtZone,
  // ...
};
```

### 3.3 Prompt Engineering Updates (commandInterpreter.ts)

#### Glossary Additions

- **"Outlet":** Moving the ball from defense to midfield.
- **"Press":** Defensive formation to win the ball back.
- **"Shootout":** 1v1 vs GK starting from 23m line.

#### New Examples

**Input:** "Red team outlet using a Back 3."  
**Output:**
```json
{"action": "tactical_phase", "type": "outlet", "team": "red", "structure": "back_3"}
```

**Input:** "Blue team setup a Half Court press."  
**Output:**
```json
{"action": "tactical_phase", "type": "press", "team": "blue", "structure": "half_court"}
```

**Input:** "Shootout for R10."  
**Output:**
```json
{"action": "set_piece", "type": "shootout", "parameters": {"attackerId": "R10"}}
```

## 4. Validation & Rules

- **Shootout Isolation:** During a shootout action, ensure no non-active players are within the 23m area.
- **Pressing Heights:**
  - **Full Court:** Forwards must be in Attacking Third.
  - **Half Court:** Forwards must not cross Halfway Line.
- **Coordinate Mirroring:** Ensure "Back 4" logic works correctly for both Left-to-Right (Red) and Right-to-Left (Blue) orientations.
