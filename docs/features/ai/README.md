# AI System Overview

The AI Command System allows users to control a field hockey tactic board using natural language commands. The system uses Google Gemini AI to interpret commands and convert them into precise board manipulations.

## Quick Start

**Basic Commands:**
```
"Move red player 7 to center"
"Set red team to 4-4-2 formation"
"Setup a 2-castle PC attack"
"5v5 game in midfield"
"Red team outlet using Back 4"
```

## System Architecture

```
User Command → AI Interpreter → Position Calculator → Board Update
                    ↓
              Living Playbook (optional)
```

The system follows a lookup-first strategy:
1. **Check Living Playbook** for saved tactics matching the command
2. **Use AI Interpretation** if no match found
3. **Calculate Positions** using tactical templates
4. **Update Board** with new positions

## Core Concepts

### Modes

- **Game Mode**: Standard 11v11 with fixed player counts
- **Training Mode**: Variable player counts, multiple balls allowed

The system automatically switches modes based on command type.

### Command Types

| Command Type | Example | Action |
|-------------|---------|--------|
| **Basic Moves** | "Move red player 7 to center" | `move`, `ball` |
| **Formations** | "Set red team to 4-4-2" | `formation` |
| **Set Pieces** | "Setup Blue PC Defense" | `set_piece` (APC/DPC/shootout) |
| **Drills** | "5v5 game in midfield" | `drill` |
| **Tactical Phases** | "Red Outlet Back 4" | `tactical_phase` (outlet/press) |
| **Geometric Shapes** | "Form a circle" | `shape` |

### Field Coordinate System

- **X-axis (0-100)**: 0 = left goal, 100 = right goal
- **Y-axis (0-100)**: 0 = top edge, 100 = bottom edge

**Field Zones:**
- Defensive third: x = 0-33.33
- Midfield: x = 33.33-66.66
- Attacking third: x = 66.66-100

## Documentation Structure

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture, data flow, components
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete schemas, types, and validation rules
- **[FEATURES.md](./FEATURES.md)** - Detailed feature documentation
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - How to extend and maintain the system

## Key Features

### 1. Natural Language Understanding
Uses Google Gemini AI to interpret field hockey terminology and tactical concepts.

### 2. Tactical Templates
Pre-built templates for common scenarios:
- Penalty corners (APC/DPC)
- Outletting structures (Back 4, Back 3, Three High)
- Pressing structures (Full Court, Half Court, W-Press)
- Training drills (small-sided games, possession)

### 3. Living Playbook
Save and reuse corrected tactical positions. The system learns from your adjustments.

### 4. Automatic Opponent Positioning
When executing tactical phases, the system automatically positions the opponent team in a logical counter-structure.

## API Configuration

**Environment Variables:**
- `VITE_GEMINI_API_KEY`: Required, Google Gemini API key
- `VITE_GEMINI_MODEL`: Optional, defaults to `gemini-2.0-flash-exp`

**Supported Models:**
- `gemini-2.0-flash-exp` (default)
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- `gemini-2.5-pro`

## Example Workflows

### Basic Movement
```
User: "Move red player 7 to center"
System: Interprets → Calculates (x:50, y:50) → Moves player
```

### Penalty Corner
```
User: "Setup a 2-castle PC attack"
System: Interprets → Applies APC template → Positions 11 players in PC formation
```

### Training Drill
```
User: "5v5 game in midfield"
System: Interprets → Filters goalkeepers → Positions 10 field players in midfield
```

### Saved Tactic
```
User: "Setup Blue PC Defense"
System: Checks Living Playbook → Finds match → Loads saved positions (instant)
```

## Related Technologies

- **AI/LLM**: Google Gemini API
- **Storage**: Browser localStorage (Living Playbook, saved tactics)
- **Coordinates**: Percentage-based system (0-100 for x and y)
- **UI Framework**: React with TypeScript

## Getting Help

- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [API_REFERENCE.md](./API_REFERENCE.md) for schemas and types
- Read [FEATURES.md](./FEATURES.md) for detailed feature documentation
- See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for extending the system
