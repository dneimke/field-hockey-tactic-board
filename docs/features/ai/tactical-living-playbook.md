# Requirements Document: The "Living Playbook" (Phase 4)

**Goal:** Enable continuous improvement of tactical accuracy via user-generated corrections and handle complex multi-team scenarios (Outlet vs Press).

## 1. The Problem

Hard-coded tactical templates (`getAPCPositions`) are brittle. Small logic errors result in tactical failures. Furthermore, single-team commands (e.g., "Red Outlet") often leave the opponent in unrealistic positions, failing to simulate the actual game pressure.

## 2. Proposed Solution: "Tactical Snapshots" & "Smart Matchups"

- **Snapshots:** Move from code-based definitions to database-based definitions. Allow the user to "Teach" the system by saving the board state.
- **Smart Matchups:** Implement logic that understands that every action has an opposing reaction (Outlet ↔ Press).

## 3. Feature Specifications

### Feature G: The "Save Tactic" Workflow

**User Story:**
1. User enters command: "Setup Blue PC Defense".
2. System executes standard (imperfect) logic.
3. User manually drags players to the correct positions on the UI.
4. User clicks a "Save Tactic" button.
5. User provides a name: "Standard PC Defense".
6. System saves this configuration.
7. Future command "Setup Blue PC Defense" retrieves this saved state instead of recalculating it.

### Feature H: The "Playbook" Data Layer

**Requirement:** Persistent storage for tactical definitions.

**Data Schema:**

```typescript
interface SavedTactic {
  id: string;           // e.g., "blue_pc_defense_v1"
  name: string;         // e.g., "PC Defense - 1-3 Box"
  tags: string[];       // ["defense", "corner", "blue"]
  type: 'single_team' | 'full_scenario'; // Distinguish between one team or full board
  metadata?: {           // NEW: Explicit metadata (auto-extracted from name/tags)
    primaryTeam?: 'red' | 'blue';
    phase?: 'attack' | 'defense';
    isAPC?: boolean;
    isDPC?: boolean;
    structure?: string;  // e.g., "back_4", "half_court", "1-3"
  };
  
  // Map by Role or Position Index
  positions: {
    team: 'red' | 'blue'; // Track team for full scenarios
    role: 'GK' | 'Player';
    relativeIndex: number; 
    x: number;
    y: number;
  }[];
}
```

### Feature I: AI "Lookup First" Logic

**Requirement:** Update `commandInterpreter.ts` to check the User's Playbook before asking the LLM.

**Logic Flow:**
1. **Input:** "Setup PC Defense".
2. **AI Semantic Matching:** Use AI to find the best matching tactic based on semantic understanding
   - Analyzes command intent (team, phase, structure)
   - Considers tactic metadata, name, and tags
   - Handles variations and synonyms
   - Automatically detects drill commands and returns null (drills never match tactics)
   - Determines if coordinate flipping is needed (same phase, opposite team)
3. **Hit:** Load coordinates directly (with transformations if needed).
4. **Miss:** Fallback to existing AI logic for generating new positions (if AI matching returns null).

**Benefits:**
- Semantic understanding handles natural language variations
- Metadata reduces inference complexity
- Coordinate transformations handled automatically
- AI-only matching prevents false positives from keyword matching

### Feature J: Smart Opponent Positioning (Auto-Antagonists)

**Requirement:** When a user sets a tactical phase for one team, the system must logically position the opponent.

**Logic Rules:**

- **Outlet ↔ Press:**
  - If User commands "Red Outlet", System MUST position Blue in a defensive press.
  - Default Matchup: If specific press isn't requested, default to Half Court Zone.

- **Attack ↔ Defense:**
  - If User commands "Red Circle Attack", System MUST position Blue in "Deep Defense".

- **PC Attack ↔ PC Defense:**
  - Already handled, but explicit link ensures both teams reset.

**Example Command Processing:**

- **User:** "Red Back 4 Outlet"
- **System Action:**
  1. Triggers TacticalPhaseAction for Red (Back 4).
  2. Auto-Triggers TacticalPhaseAction for Blue (Half Court Press).
  3. Result: A realistic training scenario, not just one team moving.

## 4. UI Changes Needed

- **"Save State" Button:** Opens modal for "Tactic Name" and "Tags".
- **"Scenario Mode" Toggle:** A switch in the UI (or implied context) that tells the AI "Move both teams" vs "Move only Red".

## 5. Addressing Specific Bugs (The "GK Issue")

**Hotfix Requirement:**

In `tacticalTemplates.ts` -> `getDPCPositions`:

**CRITICAL RULE:** Filter out the Goalkeeper when calculating the "Rest of Team" group.

**Correct Logic:**
```typescript
team.filter(p => !runners.includes(p) && p.position !== 'GK')
```

## 6. Implementation Strategy

1. **Step 1 (Hotfix):** Fix GK filtering in current templates.
2. **Step 2 (Smart Matchups):** Update commandInterpreter to infer the opponent's phase if not specified.
   - Map: OUTLET → PRESS, ATTACK → DEFENSE.
3. **Step 3 (Playbook):** Implement SavedTactic schema and TacticManager.
4. **Step 4 (UI):** Add Save button.

## 7. Handling Complex Scenarios (The Outlet vs Press Dilemma)

**How the system handles "Nuance":**

### Q: Are they outletting with Back 3 or Back 4?

- **A:** AI infers from command (e.g., "Back 3") OR defaults to "Back 4" (most common).
- **User Power:** User drags players to change it to a "Back 3", hits SAVE, and names it "My Back 3". Next time, the system knows your Back 3.

### Q: What is the midfield shape?

- **A:** Defined by the "Scenario Template" (e.g., "Outlet - High Midfield" vs "Outlet - Low Midfield").
- **User Power:** Again, the user defines their preferred shape ONCE via the Save button.

### Q: When red is outletting, how is blue positioned?

- **A (Smart Matchups):** The system places Blue in a Standard Zonal Press (Half Court) by default.
- **Variation:** User can say "Red Outlet against Blue Man-to-Man".
