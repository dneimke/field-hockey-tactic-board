# Developer Guide

This guide provides instructions for extending and maintaining the AI Command System.

## Table of Contents

1. [Adding New Tactical Templates](#adding-new-tactical-templates)
2. [Adding New Command Types](#adding-new-command-types)
3. [Modifying AI Behavior](#modifying-ai-behavior)
4. [Extending Living Playbook](#extending-living-playbook)
5. [Testing Strategies](#testing-strategies)
6. [Troubleshooting](#troubleshooting)

---

## Adding New Tactical Templates

Tactical templates are pre-defined positional patterns (e.g., outlet structures, press structures, set pieces).

### Step 1: Create Template Function

**Location:** `src/utils/tacticalTemplates.ts`

```typescript
// Example: New outlet structure "Diamond"
const calculateDiamond = (
  team: 'red' | 'blue',
  players: Player[]
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  // Separate GK and field players
  const gk = players.find(p => p.isGoalkeeper);
  const fieldPlayers = players.filter(p => !p.isGoalkeeper);
  const availablePlayers = [...fieldPlayers];
  
  // GK stays in goal
  if (gk) {
    moves.push({
      targetId: gk.id,
      newPosition: { x: mirrorX(5, team), y: 50 }
    });
  }
  
  // Position players in diamond shape
  // Point 1 (Deep): x≈10, y=50
  if (availablePlayers.length > 0) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(10, team), y: 50 }
    });
    availablePlayers.splice(0, 1);
  }
  
  // Point 2 (Left): x≈20, y=20
  if (availablePlayers.length > 0) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(20, team), y: 20 }
    });
    availablePlayers.splice(0, 1);
  }
  
  // Point 3 (Right): x≈20, y=80
  if (availablePlayers.length > 0) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(20, team), y: 80 }
    });
    availablePlayers.splice(0, 1);
  }
  
  // Point 4 (High): x≈30, y=50
  if (availablePlayers.length > 0) {
    moves.push({
      targetId: availablePlayers[0].id,
      newPosition: { x: mirrorX(30, team), y: 50 }
    });
    availablePlayers.splice(0, 1);
  }
  
  // Distribute remaining players
  availablePlayers.forEach((p, i) => {
    const x = mirrorX(35 + (i * 3), team);
    const y = 20 + (i * 15);
    moves.push({ targetId: p.id, newPosition: { x, y } });
  });
  
  return moves;
};
```

**Key Points:**
- Always separate goalkeepers from field players
- Use `mirrorX()` helper for team orientation
- Handle variable player counts gracefully
- Provide fallback distribution for remaining players

### Step 2: Add to Pattern Map

```typescript
// In tacticalTemplates.ts
const OUTLET_PATTERNS: Record<string, (team: 'red' | 'blue', players: Player[]) => Array<{ targetId: string; newPosition: Position }>> = {
  'back_4': calculateBack4,
  'back_3': calculateBack3,
  'three_high': calculateThreeHigh,
  'asymmetric_right': calculateAsymmetricRight,
  'asymmetric_left': calculateAsymmetricLeft,
  'diamond': calculateDiamond,  // NEW
};
```

**Note:** Pattern names are normalized: `toLowerCase().replace(/[-\s]/g, '_')`

So "Diamond", "diamond", "Dia-mond" all map to `'diamond'`.

### Step 3: Update AI Prompt

**Location:** `src/utils/promptBuilder.ts`

Add the new structure to the tactical knowledge section:

```typescript
const buildTacticalKnowledgeSection = (): string => {
  return `TACTICAL KNOWLEDGE:
- "Outlet": Moving the ball from defense to midfield. Common structures: 
  Back 4 (dish), Back 3 (cup), Three High, Diamond (NEW).
  ...
`;
};
```

And add it to the instructions:

```typescript
// In buildInstructionsSection()
OPTION F: Tactical Phases (Outletting & Pressing)
{
  "action": "tactical_phase",
  "type": "outlet" | "press",
  "team": "red" | "blue",
  "structure": "string",          
    // Outlet: "back_4", "back_3", "three_high", "diamond", "asymmetric_right", "asymmetric_left"
    // Press: "full_court", "half_court", "w_press", "split_vision"
  ...
}
```

Add an example:

```typescript
// In examples section
- "Red team outlet using Diamond" → { "action": "tactical_phase", "type": "outlet", "team": "red", "structure": "diamond", "explanation": "Setting up Diamond outlet structure for red team" }
```

### Step 4: Test

```typescript
// Test commands:
"Red team outlet using Diamond"
"Show me a Diamond structure"
"Blue Diamond"
```

Verify:
- Correct structure name is extracted
- Template function is called
- Positions are calculated correctly
- Both teams work (red and blue)

---

## Adding New Command Types

Adding a completely new command type (beyond the existing 6 types).

### Step 1: Define Type in `types.ts`

```typescript
// Example: New "animation" command type
export interface AnimationAction {
  action: 'animation';
  type: 'pass_sequence' | 'movement_pattern';
  parameters: {
    playerIds: string[];
    pathType: 'straight' | 'curved';
    duration?: number;
  };
  explanation: string;
}

// Add to CommandResult union
export type CommandResult = 
  | { action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple'; ... }
  | SetPieceAction
  | DrillAction
  | TacticalPhaseAction
  | AnimationAction;  // NEW
```

### Step 2: Add Routing in `positionCalculator.ts`

```typescript
export const calculateTacticalPositions = (
  action: CommandResult,
  boardState: BoardState
): Array<{ targetId: string; newPosition: Position }> => {
  
  // ... existing routing ...
  
  if (action.action === 'animation') {
    return calculateAnimationPositions(action.parameters, boardState);
  }
  
  // ... rest of routing ...
};
```

### Step 3: Implement Calculation Function

```typescript
// In positionCalculator.ts or tacticalTemplates.ts
const calculateAnimationPositions = (
  config: AnimationAction['parameters'],
  boardState: BoardState
): Array<{ targetId: string; newPosition: Position }> => {
  const moves: Array<{ targetId: string; newPosition: Position }> = [];
  
  // Implementation logic here
  // Calculate positions based on parameters
  
  return moves;
};
```

### Step 4: Update AI Prompt

**Location:** `src/utils/promptBuilder.ts`

Add new command option:

```typescript
OPTION G: Animation Sequences (NEW)
{
  "action": "animation",
  "type": "pass_sequence" | "movement_pattern",
  "parameters": {
    "playerIds": ["R7", "R10", "R11"],
    "pathType": "straight" | "curved",
    "duration": number  // Optional: seconds
  },
  "explanation": "overall explanation"
}
```

Add examples:

```typescript
- "Show a pass from R7 to R10 to R11" → { "action": "animation", "type": "pass_sequence", "parameters": { "playerIds": ["R7", "R10", "R11"], "pathType": "straight" }, "explanation": "Creating pass sequence" }
```

### Step 5: Update Documentation

- Add new command type to `API_REFERENCE.md`
- Add feature documentation to `FEATURES.md`
- Update `README.md` with examples

---

## Modifying AI Behavior

### Changing Prompt Structure

**Location:** `src/utils/promptBuilder.ts`

The prompt is built in sections. To modify AI behavior:

#### 1. Add New Context Section

```typescript
const buildCustomContextSection = (): string => {
  return `CUSTOM CONTEXT:
- Your custom instructions here
- Additional rules or guidelines
- Domain-specific knowledge
`;
};

// Add to main prompt
export const createPrompt = (
  command: string,
  boardState: BoardState,
  fieldConfig?: FieldConfig,
  mode?: 'game' | 'training',
): string => {
  // ... existing sections ...
  const customSection = buildCustomContextSection();
  
  return `...
${customSection}
...`;
};
```

#### 2. Modify Existing Sections

```typescript
// Example: Add more tactical knowledge
const buildTacticalKnowledgeSection = (): string => {
  return `TACTICAL KNOWLEDGE:
- "Attacking Penalty Corner (APC)": Set piece attack...
- "Counter Attack": Quick transition from defense to attack (NEW)
- "Set Play": Rehearsed tactical movement (NEW)
...
`;
};
```

#### 3. Add More Examples

```typescript
// In buildInstructionsSection()
EXAMPLES:
- "Move red player 7 to center" → ...
- "Setup counter attack pattern" → ... (NEW)
- "Execute set play alpha" → ... (NEW)
```

#### 4. Adjust Constraints

```typescript
IMPORTANT:
- Return ONLY valid JSON, no markdown, no extra text
- All positions must be between 0-100 for both x and y
- Custom constraint: Ensure counter attacks move at least 3 players (NEW)
- Custom constraint: Set plays must include ball movement (NEW)
```

### Testing Prompt Changes

1. **Iterate Quickly**: Modify prompt text directly
2. **Test Commands**: Try various command phrasings
3. **Check JSON Output**: Verify structure matches expectations
4. **Edge Cases**: Test ambiguous or unusual commands
5. **Refine**: Adjust wording based on AI responses

**Tips:**
- Be explicit and specific in instructions
- Provide concrete examples
- Use numbered lists for clarity
- Emphasize critical rules with bold or caps
- Test with multiple command variations

---

## Extending Living Playbook

### Adding New Metadata Fields

**Location:** `src/types.ts`

```typescript
export interface SavedTactic {
  id: string;
  name: string;
  tags: string[];
  type: 'single_team' | 'full_scenario';
  metadata?: {
    primaryTeam?: 'red' | 'blue';
    phase?: 'attack' | 'defense';
    isAPC?: boolean;
    isDPC?: boolean;
    isOutlet?: boolean;
    isPress?: boolean;
    structure?: string;
    
    // NEW fields
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    category?: 'set_piece' | 'outlet' | 'press' | 'custom';
    dateCreated?: string;
  };
  positions: Array<{...}>;
}
```

### Updating Metadata Extraction

**Location:** `src/utils/tacticManager.ts`

```typescript
const extractMetadata = (name: string, tags: string[]): SavedTactic['metadata'] => {
  const lowerName = name.toLowerCase();
  const lowerTags = tags.map(t => t.toLowerCase());
  
  return {
    // Existing extractions...
    primaryTeam: lowerTags.includes('red') ? 'red' : lowerTags.includes('blue') ? 'blue' : undefined,
    
    // NEW extractions
    difficulty: lowerTags.includes('advanced') ? 'advanced' : 
                lowerTags.includes('beginner') ? 'beginner' : 
                'intermediate',
    
    category: lowerName.includes('pc') ? 'set_piece' :
              lowerName.includes('outlet') ? 'outlet' :
              lowerName.includes('press') ? 'press' :
              'custom',
    
    dateCreated: new Date().toISOString(),
  };
};
```

### Enhancing Matching Algorithm

**Location:** `src/utils/tacticManager.ts`

Modify the `scoreTactic` function:

```typescript
const scoreTactic = (
  tactic: SavedTactic,
  command: string,
  commandMetadata: any
): number => {
  let score = 0;
  
  // Existing scoring logic...
  
  // NEW: Difficulty bonus
  if (tactic.metadata?.difficulty === 'beginner') {
    score += 5; // Prioritize simpler tactics
  }
  
  // NEW: Category matching
  if (commandMetadata.category && tactic.metadata?.category === commandMetadata.category) {
    score += 20;
  }
  
  return score;
};
```

### Adding New Tactic Types

Beyond 'single_team' and 'full_scenario':

```typescript
// In types.ts
export interface SavedTactic {
  id: string;
  name: string;
  tags: string[];
  type: 'single_team' | 'full_scenario' | 'animation' | 'drill_template';  // NEW
  ...
}
```

Update loading logic in `tacticManager.ts`:

```typescript
export const loadTactic = (tactic: SavedTactic, boardState: BoardState): CommandResult => {
  
  if (tactic.type === 'animation') {
    // Handle animation-specific loading
    return {
      action: 'animation',
      type: 'movement_pattern',
      parameters: { /* extracted from tactic */ },
      explanation: `Loading animation: ${tactic.name}`
    };
  }
  
  // Existing loading logic for other types...
};
```

---

## Testing Strategies

### Unit Testing Templates

```typescript
// Example test for a tactical template
describe('calculateDiamond', () => {
  it('should position players in diamond shape', () => {
    const players: Player[] = [
      { id: 'R1', team: 'red', number: 1, position: { x: 5, y: 50 }, isGoalkeeper: true },
      { id: 'R2', team: 'red', number: 2, position: { x: 10, y: 50 }, isGoalkeeper: false },
      { id: 'R3', team: 'red', number: 3, position: { x: 10, y: 30 }, isGoalkeeper: false },
      { id: 'R4', team: 'red', number: 4, position: { x: 10, y: 70 }, isGoalkeeper: false },
      { id: 'R5', team: 'red', number: 5, position: { x: 15, y: 50 }, isGoalkeeper: false },
    ];
    
    const moves = calculateDiamond('red', players);
    
    // GK should stay in goal
    const gkMove = moves.find(m => m.targetId === 'R1');
    expect(gkMove?.newPosition.x).toBe(5);
    expect(gkMove?.newPosition.y).toBe(50);
    
    // Point 1 (Deep) should be at x≈10, y=50
    const point1 = moves.find(m => m.targetId === 'R2');
    expect(point1?.newPosition.x).toBeCloseTo(10);
    expect(point1?.newPosition.y).toBe(50);
    
    // ... more assertions for other points
  });
  
  it('should mirror positions for blue team', () => {
    const players: Player[] = [/* blue team players */];
    
    const moves = calculateDiamond('blue', players);
    
    // X positions should be mirrored (100 - x)
    const point1 = moves.find(m => m.targetId === 'B2');
    expect(point1?.newPosition.x).toBeCloseTo(90); // 100 - 10
  });
});
```

### Integration Testing Commands

```typescript
describe('interpretCommand', () => {
  it('should interpret diamond outlet command', async () => {
    const boardState: BoardState = {
      redTeam: [/* 11 red players */],
      blueTeam: [/* 11 blue players */],
      balls: [{ id: 'ball', position: { x: 50, y: 50 } }],
      mode: 'game'
    };
    
    const result = await interpretCommand(
      "Red team outlet using Diamond",
      boardState
    );
    
    expect(result.action).toBe('tactical_phase');
    if (result.action === 'tactical_phase') {
      expect(result.type).toBe('outlet');
      expect(result.team).toBe('red');
      expect(result.structure).toBe('diamond');
    }
  });
});
```

### Manual Testing Checklist

**For New Templates:**
- [ ] Command variations work ("Diamond", "diamond", "Dia-mond")
- [ ] Both teams work (red and blue)
- [ ] Positions are within bounds (0-100)
- [ ] Goalkeeper stays in appropriate position
- [ ] Handles variable player counts
- [ ] Remaining players distributed properly
- [ ] No player overlaps
- [ ] Opponent auto-positioned (if applicable)

**For Prompt Changes:**
- [ ] AI understands new terminology
- [ ] JSON structure is correct
- [ ] Edge cases handled (ambiguous commands)
- [ ] Examples match actual output
- [ ] Constraints are respected

**For Living Playbook Changes:**
- [ ] Tactics save correctly
- [ ] Tactics load correctly
- [ ] Matching finds correct tactics
- [ ] Coordinate flipping works
- [ ] Metadata extracted properly

---

## Troubleshooting

### Common Issues

#### Issue: AI Returns Invalid JSON

**Symptoms:**
- Error: "AI returned invalid JSON"
- Parse errors in console

**Solutions:**
1. Check prompt for ambiguous instructions
2. Add more explicit JSON format examples
3. Emphasize "ONLY valid JSON, no markdown"
4. Review recent prompt changes

**Debug:**
```typescript
// In commandInterpreter.ts
console.log('Raw AI response:', response);
console.log('Extracted JSON:', extractedJSON);
```

#### Issue: Template Positions Incorrect

**Symptoms:**
- Players positioned off-field
- Players overlapping
- Wrong team orientation

**Solutions:**
1. Check `mirrorX()` usage for team orientation
2. Verify coordinate calculations (0-100 range)
3. Test with both red and blue teams
4. Add console logs for debugging:

```typescript
const calculateDiamond = (team: 'red' | 'blue', players: Player[]) => {
  console.log('calculateDiamond called:', { team, playerCount: players.length });
  
  const moves = [];
  // ... calculations ...
  
  console.log('Diamond moves:', moves);
  return moves;
};
```

#### Issue: Living Playbook Not Matching

**Symptoms:**
- Command triggers AI instead of loading saved tactic
- Wrong tactic loaded

**Solutions:**
1. Check tactic name/tags match command
2. Review scoring algorithm (minimum threshold: 20)
3. Verify metadata extraction
4. Add debug logging:

```typescript
// In tacticManager.ts
console.log('Scoring tactic:', tactic.name, 'Score:', score);
console.log('Command metadata:', commandMetadata);
```

5. Test scoring manually:
```typescript
const tactic = { name: 'Blue PC Defense', tags: ['blue', 'dpc'] };
const command = 'Setup Blue PC Defense';
const score = scoreTactic(tactic, command, extractCommandMetadata(command));
console.log('Score:', score); // Should be > 20 to match
```

#### Issue: Mode Not Switching Automatically

**Symptoms:**
- Drill command doesn't switch to training mode
- Tactical command doesn't switch to game mode

**Solutions:**
1. Check `useCommandExecution.ts` mode switching logic
2. Verify command action type detection
3. Ensure mode is passed to board state update

```typescript
// In useCommandExecution.ts
if (result.action === 'drill') {
  setMode('training');
} else if (result.action === 'set_piece' || result.action === 'tactical_phase') {
  setMode('game');
}
```

### Debugging Tools

**Console Logging:**
```typescript
// Enable verbose logging
localStorage.setItem('debug_ai', 'true');

// In code:
if (localStorage.getItem('debug_ai') === 'true') {
  console.log('AI Prompt:', prompt);
  console.log('AI Response:', response);
  console.log('Parsed Result:', result);
}
```

**React DevTools:**
- Inspect board state
- Check component props
- Monitor state updates

**Network Tab:**
- Monitor Gemini API calls
- Check request/response payloads
- Verify API key

### Performance Profiling

```typescript
// Measure execution time
const startTime = performance.now();

const result = await interpretCommand(command, boardState);

const endTime = performance.now();
console.log(`Command execution took ${endTime - startTime}ms`);
```

**Typical Times:**
- Living Playbook match: < 100ms
- AI interpretation: 500-2000ms
- Position calculation: < 50ms

If times exceed these, investigate:
- Large board states (> 22 players)
- Complex prompts (> 5000 chars)
- Network latency (Gemini API)

---

## Code Style Guidelines

### TypeScript

- Use explicit types, avoid `any`
- Prefer interfaces over type aliases for objects
- Use `readonly` for immutable arrays/objects
- Document complex functions with JSDoc

```typescript
/**
 * Calculates positions for a tactical phase
 * @param action The tactical phase action to execute
 * @param boardState Current board state
 * @returns Array of position moves
 */
export const calculateTacticalPositions = (
  action: TacticalPhaseAction,
  boardState: BoardState
): Array<{ targetId: string; newPosition: Position }> => {
  // Implementation
};
```

### Naming Conventions

- Functions: `camelCase`, verb-noun (e.g., `calculatePositions`, `extractMetadata`)
- Interfaces: `PascalCase`, noun (e.g., `BoardState`, `CommandResult`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `OUTLET_PATTERNS`, `MIN_DISTANCE`)
- Private helpers: prefix with underscore (e.g., `_mirrorX`, `_validatePosition`)

### File Organization

```
src/
├── types.ts              // All TypeScript interfaces and types
├── utils/
│   ├── commandInterpreter.ts    // AI integration, prompt construction
│   ├── promptBuilder.ts         // Prompt generation
│   ├── positionCalculator.ts    // Routing and shape calculations
│   ├── tacticalTemplates.ts     // Template implementations
│   └── tacticManager.ts         // Living Playbook logic
├── hooks/
│   └── useCommandExecution.ts   // State management hook
└── components/
    ├── CommandInput.tsx
    └── ... other components
```

---

## Best Practices

### 1. Test Early and Often

- Write unit tests for new template functions
- Test with both red and blue teams
- Test edge cases (0 players, 1 player, 22 players)
- Test mode switching

### 2. Keep Templates Simple

- Focus on positioning logic only
- Don't hardcode player IDs
- Handle variable player counts gracefully
- Use helper functions for common calculations

### 3. Document Changes

- Update API_REFERENCE.md with new types
- Update FEATURES.md with new functionality
- Add examples to README.md
- Document breaking changes

### 4. Maintain Backwards Compatibility

- Don't remove existing command types
- Don't change existing template behavior without migration
- Add new fields as optional
- Version saved tactics if schema changes

### 5. Performance Considerations

- Cache expensive calculations
- Minimize AI calls (use Living Playbook)
- Avoid blocking main thread
- Profile before optimizing

---

## Release Checklist

Before releasing new features:

- [ ] All new code has type definitions
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Documentation updated (README, API_REFERENCE, FEATURES, DEVELOPER_GUIDE)
- [ ] No console errors or warnings
- [ ] Linter passes
- [ ] Code reviewed
- [ ] Migration path for existing data (if needed)
- [ ] Changelog updated

---

## Getting Help

- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [API_REFERENCE.md](./API_REFERENCE.md) for schemas
- See [FEATURES.md](./FEATURES.md) for feature documentation
- Search existing code for similar patterns
- Add debug logging to understand flow
- Ask specific questions with code examples

