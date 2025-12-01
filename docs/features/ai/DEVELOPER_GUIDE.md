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
  
  // ... logic to position field players ...
  
  return moves;
};
```

**Key Points:**
- Always separate goalkeepers from field players
- Use `mirrorX()` helper for team orientation
- Handle variable player counts gracefully

### Step 2: Add to Pattern Map

```typescript
// In tacticalTemplates.ts
const OUTLET_PATTERNS: Record<string, (team: 'red' | 'blue', players: Player[]) => Array<{ targetId: string; newPosition: Position }>> = {
  'back_4': calculateBack4,
  'diamond': calculateDiamond,  // NEW
};
```

### Step 3: Update AI Prompt

**Location:** `src/utils/promptBuilder.ts`

Add the new structure to the tactical knowledge section:

```typescript
const buildTacticalKnowledgeSection = (): string => {
  return `TACTICAL KNOWLEDGE:
- "Outlet": Moving the ball from defense to midfield. Common structures: 
  Back 4 (dish), Diamond (NEW).
  ...
`;
};
```

And update the TypeScript interface definition string (if necessary for strict typing):

```typescript
const GAME_INTERFACES = `
interface TacticalPhaseAction {
  // ...
  structure: string; // Outlet: "back_4", "diamond"
}
`;
```

---

## Adding New Command Types

Adding a completely new command type (beyond the existing types like `set_piece`, `drill`).

### Step 1: Define Interface in `types.ts`

```typescript
// Example: New "animation" command type
export interface AnimationAction extends BaseAction {
  action: 'animation';
  type: 'pass_sequence' | 'movement_pattern';
  parameters: {
    playerIds: string[];
    pathType: 'straight' | 'curved';
  };
}

// Add to CommandResult union
export type CommandResult = 
  | MoveAction
  | SetPieceAction
  | DrillAction
  | TacticalPhaseAction
  | AnimationAction;  // NEW
```

### Step 2: Add Interface String in `promptBuilder.ts`

**Crucial:** You must add the raw interface string so it can be injected into the LLM prompt.

```typescript
// In src/utils/promptBuilder.ts

const ANIMATION_INTERFACE = `
interface AnimationAction {
  reasoning: string;
  action: 'animation';
  type: 'pass_sequence' | 'movement_pattern';
  parameters: {
    playerIds: string[];
    pathType: 'straight' | 'curved';
  };
  explanation: string;
}
`;

// Append to appropriate interface group (GAME or TRAINING)
const GAME_INTERFACES = `
// ... existing interfaces ...
${ANIMATION_INTERFACE}
`;
```

### Step 3: Add Routing in `positionCalculator.ts`

```typescript
export const calculateTacticalPositions = (
  action: CommandResult,
  boardState: BoardState
): Array<{ targetId: string; newPosition: Position }> => {
  
  // ... existing routing ...
  
  if (action.action === 'animation') {
    return calculateAnimationPositions(action.parameters, boardState);
  }
};
```

### Step 4: Update Prompt Instructions

Update `buildInstructionsSection` in `promptBuilder.ts` to list the new option.

---

## Modifying AI Behavior

### Changing Prompt Structure

**Location:** `src/utils/promptBuilder.ts`

The prompt is now modular. To modify behavior:

1.  **Context:** Update `buildGeometrySection` or `buildSeparatedPlayerList` to change what the AI "sees".
2.  **Logic:** Update `buildInstructionsSection` to change the rules.
3.  **Schema:** Update the `*_INTERFACES` constants to change the output format.

### Testing Prompt Changes

1.  **Run Unit Tests:** `npm test src/utils/__tests__/promptBuilder.test.ts`
2.  **Manual Test:** Use the app to send commands and check the console logs (if debug mode enabled).

---

## Extending Living Playbook

### Adding New Metadata Fields

**Location:** `src/types.ts`

```typescript
export interface SavedTactic {
  // ...
  metadata?: {
    // ... existing
    difficulty?: 'beginner' | 'intermediate' | 'advanced'; // NEW
  };
}
```

### Updating Metadata Extraction

**Location:** `src/utils/tacticManager.ts`

```typescript
const extractMetadataFromTags = (name: string, tags: string[]): SavedTactic['metadata'] => {
  // ... existing logic
  return {
    // ...
    difficulty: tags.includes('advanced') ? 'advanced' : undefined,
  };
};
```

---

## Testing Strategies

### Unit Testing Templates

```typescript
describe('calculateDiamond', () => {
  it('should position players in diamond shape', () => {
    // Test logic...
  });
});
```

### Prompt Testing

We now have strict prompt tests. When changing the prompt, ensure `src/utils/__tests__/promptBuilder.test.ts` passes.

```typescript
it('should include animation interface in game mode', () => {
  const prompt = createPrompt('...', mockState, undefined, 'game');
  expect(prompt).toContain('interface AnimationAction');
});
```

---

## Troubleshooting

### Common Issues

#### Issue: AI Returns Invalid JSON
**Cause:** The LLM ignored the JSON constraint.
**Fix:** Ensure `CRITICAL RULES` in `promptBuilder.ts` emphasizes "JSON only".

#### Issue: "Reasoning" Field Missing
**Cause:** Old prompt version or schema mismatch.
**Fix:** Verify `COMMON_INTERFACES` in `promptBuilder.ts` includes `reasoning: string`.

#### Issue: Drill Commands Including Goalkeepers
**Cause:** The AI is selecting from the wrong player list.
**Fix:** Check `buildSeparatedPlayerList` output. It should explicitly separate GKs from Field Players.

### Debugging Tools

**Console Logging:**
Enable debug mode to see raw prompts and responses.

```typescript
// In commandInterpreter.ts
console.log('Raw AI response:', text);
```
