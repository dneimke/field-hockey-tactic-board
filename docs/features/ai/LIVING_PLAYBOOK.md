# The Living Playbook

## What is the Living Playbook?

The Living Playbook is a system that allows you to save, organize, and reuse tactical configurations in the Field Hockey Tactic Board. Unlike regular tactic saves (which store animation frames for playback), the Living Playbook stores **positional snapshots** that can be automatically loaded when you enter commands.

### Key Differences

| Feature | Regular Tactic Save | Living Playbook |
|---------|-------------------|-----------------|
| **Purpose** | Animation sequences | Command lookup & reuse |
| **Storage** | `hockey_tactics` | `hockey_saved_tactics` |
| **Data Format** | Frames, paths, field type | Player positions, tags, type |
| **Usage** | Manual load from menu | Automatic lookup on command |
| **Best For** | Multi-step animations | Quick tactical setups |

### Benefits

- **Learn from Corrections**: When the AI positions players incorrectly, you can manually adjust them and save the corrected version
- **Faster Setup**: Saved tactics load instantly without AI processing
- **Consistency**: Your preferred tactical setups are always available
- **Organization**: Tag and categorize tactics for easy discovery

## How It Works

### Lookup-First Logic

When you enter a command, the system follows this flow:

1. **Search Playbook**: The system first searches your saved tactics for a match
   - Uses AI-based semantic matching to understand your intent
   - Considers name, tags, and metadata (team, phase, structure)
   - Handles variations and synonyms (e.g., "PC Defense" matches "DPC")
   - Automatically detects and filters out drill commands (AI never matches drills to saved tactics)
   - Automatically handles coordinate flipping for same-phase, opposite-team matches

2. **Load Saved Tactic** (if match found):
   - Converts saved positions to player moves
   - Applies coordinate transformations if needed (e.g., flipping for opposite team)
   - Applies positions directly to the board
   - Skips AI processing entirely

3. **Fallback to AI** (if no match):
   - Uses the standard AI command interpreter
   - Generates positions using tactical templates
   - You can then save the result if you want to correct it

**Note**: The system automatically extracts metadata (team, phase, structure) from tactic names and tags when you save. This metadata helps improve matching accuracy and is transparent to you - you don't need to manually specify it.

### Smart Opponent Positioning

The Living Playbook integrates with the smart opponent positioning system:

- **Outlet ↔ Press**: When you save an "Outlet" tactic, the system can automatically position the opponent in a "Press" formation
- **Attack ↔ Defense**: Attack tactics automatically position defenders
- **PC Scenarios**: Penalty corner setups include both attacking and defending teams

This ensures your saved tactics create realistic full-field scenarios, not just single-team positions.

### Automatic Mode Switching

The system automatically switches between **Game Mode** and **Training Mode** based on command type:

- **Drill Commands** → Automatically switches to **Training Mode**
  - Examples: "Split into 3 groups", "Setup 2 small sided games (5v5)", "4v2 game in the D"
  - Training mode allows flexible player counts and multiple balls
  
- **Tactical Commands** → Automatically switches to **Game Mode**
  - Examples: "Setup Blue PC Defense", "Red Outlet Back 4", "Blue team press full court"
  - Game mode uses standard 11 players per team
  
- **Saved Tactic Loads** → Keeps current mode
  - When you load a saved tactic, the mode doesn't change
  - Saved tactics are game tactics, but the system doesn't force mode switch on load
  
- **Manual Override**: You can always manually switch modes using the toolbar toggle
  - The automatic switching is a convenience feature - you maintain full control

**Why This Matters:**
- Drill commands require training mode (flexible player counts, multiple balls)
- Tactical commands work best in game mode (11v11 scenarios)
- The system makes intelligent assumptions, but you can override them

## Using the Living Playbook

### How to Save a Tactic

1. **Set up your board**: Use AI commands or manually position players
2. **Make corrections**: Drag players to their correct positions
3. **Open Save Modal**: Click the Settings menu → "Save Tactic"
4. **Fill in details**:
   - **Name**: Choose a descriptive name (e.g., "Blue PC Defense - 1-3 Box")
   - **Tags**: Add comma-separated tags (e.g., "defense, corner, blue, pc")
   - **Type**: Choose "Single Team" or "Full Scenario"
5. **Save**: Click "Save" to add to your playbook

**Example Workflow:**
```
1. Enter command: "Setup Blue PC Defense"
2. AI positions players (may be incorrect)
3. Manually drag players to correct positions
4. Save as "Standard PC Defense" with tags: "defense, corner, blue"
5. Future command "Setup Blue PC Defense" will use your saved version
```

### How to View/Manage Saved Tactics

1. **Open Playbook**: Click Settings menu → "Living Playbook"
2. **Browse tactics**: See all saved tactics with:
   - Name
   - Tags (displayed as badges)
   - Type (Single Team or Full Scenario)
   - Team indicator (Red/Blue/Both)
   - Phase indicator (Attack/Defense)
   - Position count
   - Matching examples (what commands would match this tactic)
3. **Search**: Type in the search box to filter by name or tags
4. **Load**: Click "Load" to apply a tactic to the current board
5. **Edit**: Click "Edit" to modify name, tags, or type (positions cannot be edited - load and re-save to change positions)
6. **Delete**: Click "Delete" to remove a tactic (with confirmation)

### How to Load a Tactic

**Method 1: Automatic (Recommended)**
- Enter a command that matches a saved tactic name
- The system automatically loads the saved positions

**Method 2: Manual**
- Open the Living Playbook view
- Click "Load" on any saved tactic
- Positions are applied immediately

### Tagging Strategies

**IMPORTANT**: Tag only the PRIMARY team and phase this tactic is FOR, not both teams.

Good tags help you find tactics quickly:

- **Tactical Phase**: `outlet`, `press`, `attack`, `defense`
- **Set Pieces**: `pc`, `corner`, `penalty`, `shootout`
- **Team**: `red`, `blue` (choose ONE, not both)
- **Structure**: `back_4`, `back_3`, `half_court`, `full_court`
- **Custom**: `favorite`, `standard`, `variation`

**✅ Good Tag Examples:**
- `"blue, dpc, defense"` - Blue team PC defense (tag the team this tactic is FOR)
- `"red, apc, attack"` - Red team PC attack
- `"outlet, red, back_4"` - Red team outlet with back 4 structure
- `"press, half_court"` - Half court press (no team tag if it works for both)

**❌ Bad Tag Examples:**
- `"red, blue, apc, dpc"` - Tags both teams AND both phases (confusing!)
- `"defense, attack"` - Tags both phases (choose one)
- `"red, blue"` - Tags both teams (tag only the team this tactic is FOR)

**For Full Scenarios**: Even if you save both teams' positions, tag the PRIMARY team the tactic is FOR. For example, if saving "Red APC vs Blue DPC", tag it as `"red, apc, attack"` (not both teams).

### Single Team vs. Full Scenario

When saving a tactic, choose the appropriate type:

- **Single Team**: Saves positions for one team only
  - Use when: You want to focus on one team's formation
  - Example: "Red Outlet - Back 4" (only red team positions)
  
- **Full Scenario**: Saves positions for both teams
  - Use when: You want to save a complete tactical situation
  - Example: "Outlet vs Press" (both red and blue positions)

## The Playbook View

### UI Overview

The Living Playbook modal displays:

- **Header**: Title and description
- **Search Bar**: Filter tactics by name or tags
- **Tactic List**: Scrollable list of all saved tactics
- **Empty State**: Helpful message when no tactics exist

### Tactic Card Information

Each tactic displays:

- **Name**: The tactic's identifier
- **Tags**: Color-coded badges showing all tags
- **Type Badge**: 
  - Green "Full Scenario" badge
  - Blue "Single Team" badge
- **Position Count**: Number of saved positions
- **Actions**: Load and Delete buttons

### Search and Filter

The search bar filters tactics in real-time:

- **Name Matching**: Finds tactics whose names contain the search term
- **Tag Matching**: Finds tactics with tags containing the search term
- **Case Insensitive**: Search is not case-sensitive
- **Partial Matching**: Matches partial words (e.g., "def" finds "defense")

### Actions Available

- **Load**: Applies the tactic's positions to the current board
  - Matches players by role (GK vs Player) and relative index
  - Only moves players that exist in the current board state
  - Closes the modal after loading

- **Delete**: Removes the tactic from the playbook
  - Shows confirmation dialog
  - Permanently removes from localStorage
  - Refreshes the list after deletion

## Data Persistence

### Storage Location

The Living Playbook is stored in your browser's **localStorage**:

- **Storage Key**: `hockey_saved_tactics`
- **Format**: JSON array of `SavedTactic` objects
- **Location**: Browser-specific (not synced across devices)

### Data Format

Each saved tactic follows this schema:

```typescript
interface SavedTactic {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Tactic name
  tags: string[];                // Array of tag strings
  type: 'single_team' | 'full_scenario';
  positions: {
    team: 'red' | 'blue';       // Team color
    role: 'GK' | 'Player';      // Player role
    relativeIndex: number;       // Index within role group
    x: number;                   // X coordinate (0-100)
    y: number;                   // Y coordinate (0-100)
  }[];
}
```

### Browser-Specific Storage

**Important**: Tactics are stored locally in your browser:

- ✅ **Persists** across browser sessions
- ✅ **Persists** after page refresh
- ❌ **Not synced** across devices
- ❌ **Not synced** across browsers
- ❌ **Cleared** if you clear browser data

### Export/Import (Future Enhancement)

Currently, there's no built-in export/import for the Living Playbook. However, you can manually access the data:

**View in Browser Console:**
```javascript
JSON.parse(localStorage.getItem('hockey_saved_tactics'))
```

**Manual Backup:**
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Copy the `hockey_saved_tactics` value
4. Save to a text file for backup

## Best Practices

### When to Save Tactics vs. Use AI

**Save Tactics When:**
- AI positioning is incorrect and you've corrected it
- You have a preferred setup for a common scenario
- You want consistency across sessions
- You're teaching the system your tactical preferences

**Use AI When:**
- Trying a new tactical concept
- Exploring variations
- One-off setups you won't reuse
- The default positioning works fine

### Naming Conventions

Use clear, descriptive names:

✅ **Good Names:**
- "Blue PC Defense - 1-3 Box"
- "Red Outlet - Back 4 Standard"
- "Half Court Press - Zone Defense"

❌ **Poor Names:**
- "Setup 1"
- "Test"
- "My Tactic"

### Tagging Best Practices

1. **Tag the PRIMARY Team Only**: 
   - Even for full scenarios, tag the team this tactic is FOR
   - Example: "Red APC vs Blue DPC" → tag as `"red, apc, attack"` (not both teams)
   - The system uses team matching in scoring, so tagging both teams can cause mismatches

2. **Tag ONE Phase Only**:
   - Don't tag both "APC" and "DPC" - choose the phase this tactic represents
   - Example: If saving a PC defense, use `"dpc, defense"` (not `"apc, dpc"`)

3. **Be Consistent**: Use the same tags for similar tactics
   - Always use `"blue, dpc"` for blue PC defenses
   - Always use `"red, apc"` for red PC attacks

4. **Be Specific**: Include structure details (e.g., "back_4", "1-3")
   - `"blue, dpc, defense, 1-3"` is better than just `"blue, dpc"`

5. **Use Multiple Tags**: Combine tactical phase, team, and structure
   - Good: `"blue, dpc, defense, corner, 1-3"`
   - Bad: `"blue, red, apc, dpc"` (conflicting tags)

6. **Keep It Simple**: Avoid overly long or complex tag names

### Single Team vs. Full Scenario Decisions

**Choose Single Team when:**
- You want to focus on one team's formation
- The opponent positioning is less important
- You'll combine with other tactics
- **Note**: The system saves the team with more players (or defaults to red if equal)

**Choose Full Scenario when:**
- You want a complete tactical picture
- Both teams' positions are important
- You're saving a specific game situation (e.g., "Red APC vs Blue DPC")
- **Important**: Even for full scenarios, tag only the PRIMARY team (the one this tactic is FOR)

**Example:**
- Saving "Red Outlet vs Blue Press" as Full Scenario
- Tag it as: `"red, outlet"` (not `"red, blue, outlet, press"`)
- The system knows it's a full scenario from the type, but uses tags for matching

## Troubleshooting

### Tactics Not Appearing

**Issue**: Saved tactics don't show in the Playbook view

**Solutions:**
1. Refresh the page and reopen the Playbook
2. Check browser console for errors
3. Verify localStorage is enabled in your browser
4. Check if tactics exist: `localStorage.getItem('hockey_saved_tactics')`

### Commands Not Matching Saved Tactics

**Issue**: Entering a command doesn't use your saved tactic

**Understanding the Scoring System:**

The system uses a scoring algorithm to find the best match. Here's how it works:

**Base Score (from name/tag matching):**
- Exact name match: 100 points
- Name contains command (or vice versa): 50 points
- Tag match only: 25 points

**Team Matching:**
- Perfect team match (command says "blue" and tactic is for blue): +30 points
- Team mismatch (command says "blue" but tactic is for red): -40 points
- Full scenario (works for either team): +5 points

**Phase Matching:**
- Perfect phase match (command says "defense" and tactic is defense): +30 points
- Phase mismatch (command says "defense" but tactic is attack): -40 points
- Specific PC type match (DPC/APC): +10 points
- Opposite PC type (DPC command → APC tactic): -50 points

**Minimum Threshold**: Only tactics scoring 20+ points are used. If no tactic meets this threshold, the system falls back to AI.

**Solutions:**
1. **Check Name Match**: The command text must partially match the tactic name
   - "Setup Blue PC Defense" will match "Blue PC Defense - Standard"
   - "Red Outlet" will match "Red Outlet - Back 4"
   
2. **Check Tags**: Commands can also match tags
   - Searching for "defense" will find tactics tagged with "defense"

3. **Team/Phase Alignment**: Make sure your tactic's tags match the command's intent
   - Command "Blue team defending PC" needs tags like `"blue, dpc, defense"`
   - If your tactic is tagged `"red, apc"`, it won't match (team/phase mismatch = negative score)

4. **Fuzzy Matching**: The system uses partial matching, not exact matching
   - "PC" will match "PC Defense"
   - "Outlet" will match "Red Outlet"

5. **Best Match Wins**: If multiple tactics match, the highest scoring one is used
   - Scoring order: Exact name match > Name contains > Tag match
   - With team/phase bonuses/penalties applied

### Data Loss Concerns

**Issue**: Worried about losing saved tactics

**Prevention:**
1. **Regular Backups**: Periodically export your tactics (see manual backup above)
2. **Browser Settings**: Don't clear "Site data" or "Local storage"
3. **Multiple Browsers**: Consider saving tactics in multiple browsers as backup

**Recovery:**
- If data is lost, you'll need to re-save tactics
- There's no cloud sync currently, so backups are manual

### Positions Not Loading Correctly

**Issue**: Loading a tactic doesn't position players correctly

**Possible Causes:**
1. **Player Count Mismatch**: Saved tactic expects different number of players
2. **Role Mismatch**: Saved tactic expects GK but current team has no GK
3. **Team Mismatch**: Saved tactic is for different team than current board

**Solutions:**
1. Ensure current board has similar player setup to when tactic was saved
2. Check if tactic type (single_team vs full_scenario) matches your needs
3. Manually adjust positions after loading if needed

## Advanced Usage

### Building a Tactical Library

Create a comprehensive playbook by saving:

1. **Standard Setups**: Your go-to formations
2. **Variations**: Different structures for the same phase
3. **Corrections**: Fixed versions of AI-generated positions
4. **Custom Tactics**: Unique formations you've developed

### Organizing with Tags

Use a consistent tagging system:

```
Phase: outlet, press, attack, defense
Set Piece: pc, corner, shootout
Team: red, blue
Structure: back_4, back_3, half_court, full_court, w_press
Category: standard, variation, custom, favorite
```

### Combining Tactics

You can load multiple tactics in sequence:

1. Load a "Single Team" tactic for one team
2. Load another "Single Team" tactic for the opponent
3. Or load a "Full Scenario" tactic for both teams at once

## System Opposites Reference

The tactical intelligence engine understands several types of opposites that enable realistic two-team scenarios and intelligent tactic reuse. This table summarizes all the opposites the system currently recognizes:

| **Opposite Type** | **Examples** | **Implementation Location** | **Auto-Applied?** |
|------------------|--------------|----------------------------|-------------------|
| **APC ↔ DPC** | Blue APC ↔ Red DPC<br>Red APC ↔ Blue DPC | `positionCalculator.ts:372-389`<br>When executing PC commands | ✅ Yes<br>When a PC command is executed, the system automatically positions both teams |
| **Outlet ↔ Press** | Red Outlet ↔ Blue Press<br>Blue Press ↔ Red Outlet | `inferOpponentPhase()` function<br>`positionCalculator.ts:330-356`<br>`commandInterpreter.ts` (matching) | ✅ Yes<br>When a tactical phase command is executed, the opponent is automatically positioned<br>Also works for matching saved tactics (full scenarios)
| **Team Flipping** | Blue APC using saved Red APC<br>Red DPC using saved Blue DPC | `flipTacticCoordinates()` function<br>`tacticManager.ts:393-428` | ✅ Yes<br>When matching same-phase, opposite-team tactics |
| **Attack ↔ Defense** | General phase tracking | Metadata extraction<br>`tacticManager.ts:40-59` | ⚠️ Partial<br>Used for matching and metadata, but general "attack" commands don't auto-position defenders (only specific set pieces like PC do) |

### How Opposites Work

**Penalty Corner Opposites:**
- When you execute "Blue APC", the system automatically positions:
  - Blue team in attacking penalty corner formation
  - Red team in defensive penalty corner formation (DPC)
- This ensures a complete, realistic PC scenario

**Tactical Phase Opposites:**
- When you execute "Red Outlet", the system automatically positions:
  - Red team in outlet structure (e.g., Back 4)
  - Blue team in press structure (defaults to Half Court Press)
- When you execute "Blue Press", the system automatically positions:
  - Blue team in press structure (e.g., Full Court)
  - Red team in outlet structure (defaults to Back 4)

**Coordinate Flipping:**
- When you request "Blue APC" and you have a saved "Red APC" tactic:
  - The system recognizes this is the same phase (both APC)
  - It automatically flips coordinates horizontally (x: 100 - x)
  - Blue team gets the mirrored positions of the saved Red APC

**Opposite-Phase Matching (Full Scenarios):**
- When you request "Blue press" and have a saved "Red Outlet" full scenario:
  - The system recognizes "press" ↔ "outlet" as opposites
  - It matches the full scenario tactic
  - The entire scenario is loaded as-is (both teams positioned from the saved tactic)
  - Example: "Blue press" can find and load "Red Outlet with B4" full scenario
- This works because full scenarios contain both teams' positions, so the opposite phase is already positioned in the saved tactic

**Default Opponent Structures:**
- Outlet → Press: Opponent defaults to **Half Court Press**
- Press → Outlet: Opponent defaults to **Back 4 Outlet**

## Limitations & Known Constraints

Understanding these limitations will help you work effectively with the system:

### 1. Attack ↔ Defense Auto-Positioning Limitation

**Issue:** General "attack" commands don't automatically position defenders.

**Details:**
- ✅ **Works:** Specific set pieces (PC, shootout) automatically position both teams
- ⚠️ **Limited:** General "attack" or "circle attack" commands only move the attacking team
- The system understands attack/defense as opposites in metadata and matching, but doesn't auto-position defenders for non-set-piece attacks

**Workaround:**
- Save full scenarios when you want both teams positioned for general attacks
- Use specific set piece commands (PC, shootout) which do auto-position both teams

### 2. Default Structures Cannot Be Customized

**Issue:** When auto-positioning opponents, the system uses fixed default structures that cannot be customized.

**Details:**

| **Your Command** | **Auto-Positioned Opponent** | **Default Structure** | **Cannot Specify** |
|-----------------|------------------------------|----------------------|-------------------|
| "Red Outlet" | Blue team → Press | Half Court Press | Full Court, W-Press, Split Vision |
| "Blue Press" | Red team → Outlet | Back 4 Outlet | Back 3, Three High, Asymmetric |

**Impact:**
- If you want "Red Outlet vs Blue Full Court Press", you must:
  1. Execute "Red Outlet" (auto-positions Blue in Half Court Press)
  2. Manually adjust Blue team to Full Court Press, or
  3. Save a full scenario tactic with both teams positioned correctly

**Workaround:**
- Save full scenarios with your preferred opponent structures
- Load full scenario tactics instead of single-team commands when opponent structure matters

### 3. Coordinate Flipping Scope Limitation

**Issue:** Coordinate flipping only works for same-phase, opposite-team scenarios.

**Details:**

| **Scenario** | **Works?** | **Reason** |
|-------------|-----------|------------|
| Blue APC using saved Red APC | ✅ Yes | Same phase (both APC), opposite team |
| Red DPC using saved Blue DPC | ✅ Yes | Same phase (both DPC), opposite team |
| Blue DPC using saved Red APC | ❌ No | Different phases (DPC vs APC) |
| Red APC using saved Blue Outlet | ❌ No | Different types (set piece vs tactical phase) |
| Blue press → Red Outlet (full scenario) | ✅ Yes | Opposite phases, but full scenario loads as-is |

**Note:** While coordinate flipping doesn't work across different phases, opposite-phase matching for full scenarios is supported. For example, "Blue press" can match a saved "Red Outlet" full scenario and load it entirely as-is.

**Why This Limitation Exists:**
- Different phases have fundamentally different positioning logic
- DPC (defense) and APC (attack) positions are not simple mirror images
- The system correctly rejects these mismatches to avoid tactical errors

**Workaround:**
- Save separate tactics for each team/phase combination
- Use coordinate flipping only when phases match (APC→APC, DPC→DPC, Outlet→Outlet, Press→Press)

### 4. Team Matching in Scoring

**Note:** While the system allows same-phase, opposite-team matches (with coordinate flipping), the scoring system penalizes team mismatches in certain scenarios. See the [Scoring System section](#commands-not-matching-saved-tactics) for details.

## Summary

The Living Playbook is a powerful tool for:
- ✅ Saving corrected tactical positions
- ✅ Building a reusable tactical library
- ✅ Speeding up common setups
- ✅ Teaching the system your preferences

Remember: The more you use and save tactics, the smarter and faster your tactical board becomes!

