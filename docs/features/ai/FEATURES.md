# Features Documentation

This document provides detailed documentation for all major features of the AI Command System.

## Table of Contents

1. [Set Pieces](#set-pieces)
2. [Training Drills](#training-drills)
3. [Tactical Phases](#tactical-phases)
4. [Living Playbook](#living-playbook)
5. [Game vs Training Mode](#game-vs-training-mode)
6. [Field Views](#field-views)

---

## Set Pieces

### Attacking Penalty Corner (APC)

**Command Examples:**
```
"Setup a 2-castle PC attack"
"Red team attacking penalty corner"
"APC with left injector"
```

**AI Response Format:**
```json
{
  "action": "set_piece",
  "type": "APC",
  "parameters": {
    "batteries": 2,
    "injectorSide": "left"
  },
  "explanation": "Setting up 2-battery APC"
}
```

**Positioning Rules:**
- **Injector**: Placed on backline (x=99.5 or 0.5), 10m from post
- **Battery 1 (Top)**: Stopper at top of D (x≈84, y=50), Hitter 1.5m behind
- **Battery 2 (Optional)**: Stopper at side of D (x≈84, y=65), Hitter 1.5m behind
- **Troop**: Remaining attackers distributed around D arc
- **Goalkeeper**: Remains in goal (x=5 or 95)

**Parameters:**
- `batteries`: 1 or 2 (number of battery formations)
- `injectorSide`: 'left' or 'right' (which side of goal)
- `injectorId`: Optional player ID to use as injector
- `battery1Type`: 'top' or 'right' (primary battery position)

**Automatic Opponent Positioning:**
When an APC is set up, the system automatically positions the defending team in a DPC formation.

### Defensive Penalty Corner (DPC)

**Command Examples:**
```
"Blue team defending penalty corner"
"Setup PC defense"
"DPC with 1-3 structure"
```

**AI Response Format:**
```json
{
  "action": "set_piece",
  "type": "DPC",
  "parameters": {
    "defenseStructure": "1-3",
    "runnerCount": 4
  },
  "explanation": "Setting up DPC with 1-3 structure"
}
```

**Positioning Rules:**
- **Goalkeeper**: Center of goal (x=100 or 0, y=50)
- **Runners**: 4 defenders on/inside goal line (standard)
  - Runner 1: y=48 (first wave)
  - Runner 2: y=52 (second wave)
  - Runner 3: y=46
  - Runner 4: y=54
- **Rest of Team**: Positioned at halfway line (x=50)

**Parameters:**
- `defenseStructure`: '1-3', '2-2', or 'line_stop'
- `runnerCount`: Number of runners (default: 4)

**Critical Implementation Detail:**
Goalkeepers are explicitly filtered when determining "rest of team" to avoid positioning GK at halfway.

### Shootout

**Command Examples:**
```
"Shootout for R10"
"Setup shootout for red player 10 against blue goalkeeper"
```

**AI Response Format:**
```json
{
  "action": "set_piece",
  "type": "shootout",
  "parameters": {
    "attackerId": "R10",
    "gkId": "B1"
  },
  "explanation": "Setting up shootout for R10 vs B1"
}
```

**Positioning Rules:**
- **Attacker**: Center of 23m line (x=75 or 25, y=50)
- **Goalkeeper**: On goal line (x=100 or 0, y=50)
- **All Other Players**: Behind center line (x=50) for isolation
- **23m Area Rule**: No non-active players in 23m area (x<23 or x>77)

**Parameters:**
- `attackerId`: Player taking the shot (optional)
- `gkId`: Goalkeeper defending (optional, defaults to team GK)

---

## Training Drills

### Overview

Training drills enable small-sided games and possession drills with flexible player counts.

**Key Principle:** "5v5" means 5 **field players** per team, NOT including goalkeepers.

### Small-Sided Games

**Command Examples:**
```
"5v5 game in midfield"
"Setup a 4v4 in the attacking 25"
"3v3 possession in the D"
```

**AI Response Format:**
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

### Player Selection Logic

1. **Filter Goalkeepers First**
   ```typescript
   const fieldAttackers = attackers.filter(p => !p.isGoalkeeper);
   const fieldDefenders = defenders.filter(p => !p.isGoalkeeper);
   ```

2. **Select Required Field Players**
   ```typescript
   const activeAttackers = fieldAttackers.slice(0, config.attackers);
   const activeDefenders = fieldDefenders.slice(0, config.defenders);
   ```

3. **Handle Goalkeepers**
   - If `withGK: false` (default): Move all GKs off-field
   - If `withGK: true`: Include one GK per game

4. **Move Unused Players Off-Field**
   - Unused field players → sidelines (y: -5 or 105)
   - Unused goalkeepers → off-field (x: -5, y: 50)

### Field Zones

**Zone Definitions:**
```
attacking_25: x = 75-100
midfield: x = 33.33-66.66
defensive_circle: x = 0-25
full_field: x = 0-100
```

**Positioning Strategy:**
- **Attackers**: Wide arc formation facing goal
- **Defenders**: Compact formation between attackers and goal
- **Goalkeepers** (if requested): At goal center based on zone

### Multiple Simultaneous Games

**Command Examples:**
```
"Setup 2 small sided games (5v5)"
"Split into 3 groups, 4v4 each"
```

**AI Response Format:**
```json
{
  "action": "drill",
  "type": "small_sided_game",
  "parameters": {
    "attackers": 5,
    "defenders": 5,
    "withGK": false,
    "zone": "midfield",
    "gameCount": 2,
    "gameZones": ["midfield", "midfield"]
  },
  "explanation": "Setting up 2 separate 5v5 games"
}
```

**Implementation:**
1. Calculate total players needed: `attackers * gameCount`, `defenders * gameCount`
2. Select players from both teams
3. Distribute players across games
4. Position each game in separate zone/sub-zone
5. For midfield, automatically split into left/right halves

**Example: 2 Games in Midfield**
- Game 1: x = 33-50 (left midfield)
- Game 2: x = 50-66 (right midfield)

### Goalkeeper Handling

**Default Behavior (withGK: false):**
```
"5v5 game" → 5 field players per team, GKs moved off-field
```

**Explicit Request (withGK: true):**
```
"5v5 with goalkeepers" → 5 field players + 1 GK per team
```

**Critical Rule:**
Never include goalkeepers in the player count. "5v5" always means 5 field players.

---

## Tactical Phases

### Outletting Structures

Outletting refers to playing the ball out from defense to midfield.

**Command Examples:**
```
"Red team outlet using Back 4"
"Show me a Back 3 cup structure"
"Blue team three high outlet"
```

**AI Response Format:**
```json
{
  "action": "tactical_phase",
  "type": "outlet",
  "team": "red",
  "structure": "back_4",
  "explanation": "Setting up Back 4 outlet for red team"
}
```

#### Back 4 (Dish)

**Structure:**
- 2 Center Backs deep and split (x≈10, y≈35/65)
- 2 Fullbacks wide and higher (x≈25, y≈5/95)
- Remaining players distributed in midfield

**Use Case:** Standard outlet structure, provides width and depth

#### Back 3 (Cup)

**Structure:**
- 1 Central CB high (x≈20, y=50)
- 2 Side Backs deep and wide (x≈10, y≈20/80)
- Remaining players distributed in midfield

**Use Case:** High press protection, overload through center

#### Three High

**Structure:**
- 1 Deep CB (x≈10, y=50)
- 2 Very high side backs (x≈40, y≈25/75)
- Remaining players distributed

**Use Case:** Aggressive press-breaking, pushes fullbacks high

#### Asymmetric Right/Left

**Structure:**
- Players distributed with emphasis on one side
- Creates numerical advantage on strong side

**Use Case:** Exploit weak side of opponent press

### Pressing Structures

Pressing refers to defensive formations to win the ball back.

**Command Examples:**
```
"Blue team press full court"
"Half court zone defense"
"Setup a W-Press"
```

**AI Response Format:**
```json
{
  "action": "tactical_phase",
  "type": "press",
  "team": "blue",
  "structure": "full_court",
  "intensity": 80,
  "explanation": "Setting up full court press for blue team"
}
```

#### Full Court Press

**Structure:**
- All 10 outfield players high up field (x>75)
- Man-to-man matching
- Goalkeeper remains deep

**Use Case:** Aggressive high press, win ball in attacking third

#### Half Court Zone

**Structure:**
- All players behind halfway (x<50)
- 3 lines: Forward (x=45), Midfield (x=35), Defense (x=25)
- Zonal marking

**Use Case:** Mid-block defense, compact shape

#### W-Press

**Structure:**
- Center Forward (x=60, y=50)
- 2 Wingers (x=60, y=20/80)
- 2 Inner Mids (x=50, y=35/65)
- Remaining defenders behind

**Use Case:** Trap play in wide areas, force to center

#### Split Vision

**Structure:**
- Half the team press one side
- Other half drop and cover

**Use Case:** Force play to one side, overload that area

### Press Intensity

**Optional Parameter (0-100):**
```json
{
  "intensity": 80
}
```

**Effect:**
- Adjusts height of press block
- Higher intensity = more aggressive/higher press
- Affects X positions of outfield players
- Formula: `adjustedX = baseX + (intensity/100) * 20`

### Automatic Opponent Positioning

When a tactical phase is executed, the opponent is automatically positioned in a counter-structure:

**Opposites:**
```
Outlet → Press (default: Half Court)
Press → Outlet (default: Back 4)
```

**Example:**
```
Command: "Red team outlet using Back 4"
Result:
  - Red team → Back 4 outlet structure
  - Blue team → Half Court press (automatic)
```

---

## Living Playbook

### Overview

The Living Playbook allows you to save tactical positions and reuse them instantly without AI processing.

**Key Difference from Regular Saves:**
- Regular Saves: Animation sequences, frames, paths
- Living Playbook: Positional snapshots for command lookup

### How It Works

**Lookup-First Strategy:**
```
User Command → Living Playbook Search
  ├─ Match Found → Load Saved Positions (instant)
  └─ No Match → AI Interpretation → Position Calculation
```

### Semantic Matching

The system uses AI to find the best matching tactic based on:
- **Name matching** (exact, partial, contains)
- **Tag matching** (team, phase, structure)
- **Metadata** (automatically extracted)

**Scoring System:**
```
Base Score:
  Exact name match: 100 points
  Name contains command: 50 points
  Tag match only: 25 points

Team Matching:
  Perfect match: +30 points
  Mismatch: -40 points
  Full scenario: +5 points

Phase Matching:
  Perfect match: +30 points
  Mismatch: -40 points
  PC type match: +10 points
  Opposite PC: -50 points

Threshold: 20 points minimum
```

### Saving Tactics

**Workflow:**
1. Set up board (AI or manual)
2. Make corrections by dragging players
3. Open Settings → "Save Tactic"
4. Fill in:
   - Name (descriptive)
   - Tags (comma-separated)
   - Type (Single Team or Full Scenario)
5. Save

**Example:**
```
Name: "Blue PC Defense - 1-3 Box"
Tags: "blue, dpc, defense, 1-3"
Type: Single Team
```

### Viewing/Managing Tactics

**Playbook View:**
- Settings → "Living Playbook"
- See all saved tactics with metadata
- Search by name or tags
- Load, edit, or delete

**Displayed Information:**
- Name
- Tags (as badges)
- Type (Single Team / Full Scenario)
- Team indicator (Red/Blue/Both)
- Phase indicator (Attack/Defense)
- Position count
- Matching examples

### Loading Tactics

**Method 1: Automatic (Recommended)**
```
Command: "Setup Blue PC Defense"
System: Finds matching tactic → Loads instantly
```

**Method 2: Manual**
```
Open Living Playbook → Click "Load" on tactic
```

### Tagging Best Practices

**✅ Good Tags:**
```
"blue, dpc, defense, 1-3"       // Tag primary team and phase
"red, apc, attack, 2-castle"    // Specific structure
"outlet, back_4"                // Works for both teams
```

**❌ Bad Tags:**
```
"red, blue, apc, dpc"           // Tags both teams AND both phases (confusing!)
"defense, attack"               // Tags both phases
```

**Critical Rule:**
Tag only the PRIMARY team and phase this tactic is FOR, not both teams.

### Tactic Types

**Single Team:**
- Saves positions for one team only
- Use when focusing on one team's formation
- System saves team with more players

**Full Scenario:**
- Saves positions for both teams
- Use for complete tactical situations
- Still tag only the primary team

**Example:**
```
"Red APC vs Blue DPC" (Full Scenario)
Tag as: "red, apc, attack"  (NOT both teams!)
```

### Coordinate Flipping

The system can automatically flip coordinates for opposite-team, same-phase matches:

**Works:**
```
Command: "Blue APC"
Match: Saved "Red APC" 
Result: Coordinates flipped horizontally (x = 100 - x)
```

**Doesn't Work:**
```
Command: "Blue DPC"
Match: Saved "Red APC"
Result: Not matched (different phases)
```

### Opposite-Phase Matching (Full Scenarios)

Full scenarios can match opposite-phase commands:

**Example:**
```
Command: "Blue press"
Match: Saved "Red Outlet" (Full Scenario)
Result: Entire scenario loaded as-is (both teams positioned)
```

This works because full scenarios contain both teams' positions, so the opposite phase is already in the saved tactic.

### Data Storage

**Location:** Browser localStorage (`hockey_saved_tactics`)

**Persistence:**
- ✅ Persists across sessions
- ✅ Persists after page refresh
- ❌ Not synced across devices
- ❌ Not synced across browsers
- ❌ Cleared if browser data is cleared

**Backup:**
```javascript
// Manual backup via DevTools console
JSON.parse(localStorage.getItem('hockey_saved_tactics'))
```

---

## Game vs Training Mode

### Mode Definitions

**Game Mode:**
- Fixed 11 players per team
- Standard formations apply
- Single ball
- Goalkeepers always present

**Training Mode:**
- Variable player counts (any number per team)
- Flexible formations
- Multiple balls allowed
- Goalkeepers optional

### Automatic Mode Switching

The system automatically switches modes based on command type:

**Drill Commands → Training Mode:**
```
"5v5 game in midfield"
"Split into 3 groups"
"Setup 2 small sided games"
```

**Tactical Commands → Game Mode:**
```
"Setup Blue PC Defense"
"Red Outlet Back 4"
"Blue team press full court"
```

**Saved Tactic Loads → Keep Current Mode:**
- Mode doesn't change when loading saved tactics
- User maintains control

**Manual Override:**
- Toolbar toggle always available
- User can force mode at any time

### Mode-Specific AI Behavior

**Game Mode Prompt:**
```
- Fixed 11 players per team
- Standard formations apply
- Ensure only 1 ball on the pitch
```

**Training Mode Prompt:**
```
- Variable player counts allowed
- Only reference players that exist in current state
- Can place multiple balls (ball, ball_2, ball_3, etc.)
- Player counts shown in board state
```

---

## Field Views

### Standard Field View

**Description:**
- Full field view showing complete pitch
- All positions (0-100) visible and valid
- Best for general tactics and formations

**AI Guidance:**
```
- Full field view - all positions are visible
```

### Circle Detail View

**Description:**
- Emphasizes shooting circles (D areas)
- Focuses on penalty corner and circle tactics
- All coordinates remain valid

**AI Guidance:**
```
- This view emphasizes the shooting circles (D areas)
- Focus player positioning in circle areas: 
  Left D (x: 0-15) or Right D (x: 85-100)
- Positions outside these areas may be less visible but are still valid
```

**Use Case:**
- Penalty corner setups
- Circle play tactics
- Shooting practice drills

### Field Type Context

The AI receives field type in the prompt to provide context-aware positioning:

```typescript
interface FieldConfig {
  type: 'standard' | 'circle_detail';
  name: string;
  description: string;
}
```

This ensures positioning decisions match the current view.

---

## Common Workflows

### Workflow 1: Correcting AI Positioning

```
1. User: "Setup Blue PC Defense"
2. AI positions players (may be incorrect)
3. User manually drags players to correct positions
4. User: Settings → "Save Tactic"
5. Save as: "Blue PC Defense - Standard"
   Tags: "blue, dpc, defense"
6. Future command "Setup Blue PC Defense" uses saved version
```

### Workflow 2: Building a Tactical Library

```
1. Save standard setups:
   - "Red 4-3-3 Formation"
   - "Blue PC Defense - 1-3"
   - "Red Outlet - Back 4"

2. Save variations:
   - "Red Outlet - Back 3 Cup"
   - "Blue Press - Full Court"

3. Save custom tactics:
   - "My Special Drill"
   - "Counter Attack Pattern"

4. Use consistent tags:
   - outlet, press, attack, defense
   - back_4, back_3, half_court
   - red, blue
```

### Workflow 3: Training Session Setup

```
1. Switch to Training Mode (toolbar toggle)
2. Command: "5v5 game in midfield"
3. System positions 10 field players, moves GKs off-field
4. Command: "Give each group a ball"
5. System places 2 balls (ball, ball_2)
6. Manual adjustments as needed
7. Ready to run drill
```

### Workflow 4: Match Simulation

```
1. Ensure in Game Mode (automatic for tactical commands)
2. Command: "Red team outlet using Back 4"
3. System positions:
   - Red team in Back 4 structure
   - Blue team in Half Court Press (automatic)
4. Complete tactical scenario ready
5. Can save as full scenario for reuse
```






