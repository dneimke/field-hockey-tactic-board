# Technical Specification: AI Prompt Engineering & Architecture Refactor

**Version:** 1.0  
**Author:** Solution Architect Consultant  
**Target System:** Field Hockey Tactical Whiteboard (Client-Side React/Gemini)

---

## 1. Executive Summary

This refactor aims to increase the determinism, accuracy, and domain relevance of the Gemini AI integration. We are moving from a static, text-heavy prompt to a dynamic, schema-driven prompt that utilizes conditional logic ("Prompt Routing") and Type-Chat patterns.

---

## 2. Core Implementation Tasks

### Task 1: Interface Injection (Type-Chat Pattern)

**Objective:** Replace verbose English descriptions of JSON schemas with actual TypeScript interface definitions. This reduces token usage and leverages the LLM's code-training bias for higher structural accuracy.

**Action:**

1. Create a utility string or function that returns the raw text of the interfaces from `types.ts` (or hardcoded strings if runtime extraction is too complex).
2. Inject these interfaces into the prompt's INSTRUCTIONS section.

**Code Reference (`promptBuilder.ts`):**

```typescript
const COMMON_INTERFACES = `
interface Position { x: number; y: number; }
interface Move { 
  targetId: string; 
  newPosition: Position; 
  movementType?: 'sprint' | 'curve' | 'jockey' | 'jog'; // NEW: Domain specific movement
}
`;

const GAME_INTERFACES = `
interface SetPieceAction {
  reasoning: string; // NEW: Chain of Thought
  action: 'set_piece';
  type: 'APC' | 'DPC' | 'shootout';
  parameters: APCParams | DPCParams | ShootoutParams;
}
interface TacticalPhaseAction {
  reasoning: string;
  action: 'tactical_phase';
  type: 'outlet' | 'press';
  structure: string;
}
`;

const TRAINING_INTERFACES = `
interface DrillAction {
  reasoning: string; // NEW: Chain of Thought
  action: 'drill';
  type: 'small_sided_game' | 'possession';
  parameters: {
    attackers: number; // FIELD PLAYERS ONLY
    defenders: number; // FIELD PLAYERS ONLY
    withGK: boolean;
    zone: 'attacking_25' | 'midfield' | 'defensive_circle';
  };
}
`;
```

---

### Task 2: Implement "Prompt Router" Logic

**Objective:** Reduce cognitive load on the model by sending only the instructions relevant to the current mode (game vs training).

**Action:** Refactor `buildInstructionsSection` in `promptBuilder.ts` to accept the mode parameter and return different prompt blocks.

**Specification:**

- **IF `mode === 'game'`:** Include Standard Moves, Set Pieces (Option D), Tactical Phases (Option F), Formations. Exclude Drills.
- **IF `mode === 'training'`:** Include Standard Moves, Drills (Option E), Shapes. Exclude Set Pieces and Tactical Phases.
- **ALWAYS:** Include Standard Moves (Option A) and Reset.

---

### Task 3: Enhance Spatial Context (Anchor Points)

**Objective:** Provide the LLM with "mental hooks" to calculate relative positions, improving geometry generation.

**Action:** Update `buildFieldViewSection` or `buildTacticalKnowledgeSection` to include a new "Field Geometry Anchors" block.

**Content to Add:**

```plaintext
FIELD GEOMETRY ANCHORS (Reference Points):
- Center Spot: {x: 50, y: 50}
- Top of Shooting Circle (D): {x: 14.6, y: 50} and {x: 85.4, y: 50}
- Penalty Spot (P-Spot): {x: 11, y: 50} and {x: 89, y: 50}
- Long Corner Marks (23m line): {x: 23, y: 0/100} and {x: 77, y: 0/100}
```

---

### Task 4: Resolve "Goalkeeper Paradox" & Player Lists

**Objective:** Explicitly separate goalkeepers from field players in the prompt context to prevent drills like "5v5" from accidentally including the GK.

**Action:** Refactor `buildBoardStateSection` in `promptBuilder.ts`.

**Current Output Format (To Be Deprecated):**

```plaintext
Red Team Players:
- Player 1 [GK]...
- Player 2...
```

**New Output Format (Required):**

```plaintext
CURRENT BOARD STATE:
[RED TEAM]
- Goalkeeper: R1 (x:5, y:50)
- Field Players: R2, R3, R4, R5... (Available for drills)

[BLUE TEAM]
- Goalkeeper: B1 (x:95, y:50)
- Field Players: B2, B3, B4... (Available for drills)
```

---

### Task 5: Schema Enhancements

**Objective:** Add Chain-of-Thought (reasoning) and Domain Specifics (movementType).

**Action:**

1. **Update `types.ts`:** Add `movementType` to the Move interface (optional field).
2. **Update Prompt Instructions:** Explicitly request the `reasoning` field at the top of the JSON object.

**Prompt Instruction Text:**

> "CRITICAL: You must provide a 'reasoning' field FIRST. Explain your calculation logic, especially how you counted players or calculated coordinates, before outputting the 'action'."

---

## 3. Revised `promptBuilder.ts` Skeleton

Here is a blueprint for the developer to structure the new `promptBuilder.ts`.

```typescript
// src/utils/promptBuilder.ts

export const createPrompt = (
  command: string,
  boardState: BoardState,
  fieldConfig?: FieldConfig,
  mode: 'game' | 'training' = 'game', // Default to game
): string => {
  
  // 1. Build Context Strings
  const geometryAnchors = buildGeometrySection(); // NEW
  const splitPlayerList = buildSeparatedPlayerList(boardState); // NEW: Task 4
  const interfaces = mode === 'game' ? GAME_INTERFACES : TRAINING_INTERFACES; // NEW: Task 1

  // 2. Conditional Instructions (Task 2)
  const instructions = mode === 'game' 
    ? buildGameInstructions() 
    : buildTrainingInstructions();

  return `
    You are a field hockey tactic assistant.
    
    ${geometryAnchors}
    
    ${splitPlayerList}
    
    MODE: ${mode.toUpperCase()}
    
    YOUR GOAL: Parse the command "${command}" into a JSON object matching these TypeScript interfaces:
    ${COMMON_INTERFACES}
    ${interfaces}
    
    ${instructions}
    
    CRITICAL RULES:
    1. "Reasoning" field must come first.
    2. For Drills (Training Mode): NEVER use Goalkeepers unless explicitly asked. Use the "Field Players" list.
    3. For 23m line requests: Align with the "Long Corner Marks" anchors.
  `;
};
```

---

## 4. Frontend & Tactic Manager Updates

### A. Add `movementType` Support

**File:** `src/types.ts`

**Change:** Add `movementType?: 'sprint' | 'curve' | 'jockey' | 'jog'` to the Move interface/type.

**Visualizer:** (Optional for this sprint) Pass this prop to the player component to render a dashed line for 'sprint' or curved arrow for 'curve'.

### B. Fuzzy Matching (Living Playbook)

**File:** `src/utils/tacticManager.ts`

**Recommendation:** Replace the current `includes()` check with a fuzzy search library.

**Implementation:**

```typescript
// Pseudo-code for tacticManager.ts
import Fuse from 'fuse.js';

const fuse = new Fuse(savedTactics, {
  keys: ['name', 'tags'],
  threshold: 0.4 // Allows for "Red Outlt" to match "Red Outlet"
});

const results = fuse.search(userCommand);
// Use results[0] if score is high enough
```

---

## 5. Acceptance Criteria (QA)

### 1. Drill Accuracy
**Input:** "5v5 game"

**Pass Criteria:** 
- AI selects 5 field players per team
- GKs remain in goal or move off-pitch (depending on config)
- `reasoning` field explains "Excluding GKs R1 and B1"

### 2. Mode Isolation
**Input:** Switch to "Training Mode". Input "Setup APC".

**Pass Criteria:** 
- AI either refuses (out of context) or defaults to a standard generic move, rather than hallucinating a complex set piece it hasn't been instructed on

### 3. Geometry
**Input:** "Player to top of D"

**Pass Criteria:** 
- Player moves to `x:14.6` or `x:85.4` (approx), not `x:25`

### 4. Chain of Thought
**Test:** Inspect JSON response

**Pass Criteria:** 
- JSON object starts with `"reasoning": "..."`

---

## Note to Developer

I am available to clarify any of these specifications. If the "Type-Chat" injection (Task 1) causes issues with Gemini's token limit on the free tier, let me know, and we can strip the interfaces down to Type definitions rather than full Interfaces.