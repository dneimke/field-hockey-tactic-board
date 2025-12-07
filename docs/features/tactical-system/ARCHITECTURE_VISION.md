# Tactical System: Architecture & Vision

## 1. Executive Summary

This document outlines the architectural vision for the Field Hockey Tactic Board, evolving from a pure "Tactical Diagrammer" to a generalized "Hockey Modeling Engine". It serves as a strategic guide for future feature development, shifting our focus from a purely player-centric view to a flexible, entity-based system capable of modeling both formal Match Play and complex Training Sessions.

**Current Status:** Our system is **strongly aligned** with modern architectural patterns for "Input" and "Tactics Logic" in match scenarios. We successfully leverage LLMs as deterministic parsers.

**Primary Opportunity:** The next phase of evolution lies in **Generalization & Context**. Moving from a single "Match Context" to a system that understands specific environments (Training vs. Match), allowing for multi-activity modeling, equipment management (cones, goals), and flexible spatial logic.

---

## 2. Architectural Comparison

The following matrix compares our current solution against the "Exemplar Architecture" described in industry research (e.g., TacticAI, Smartboard).

| Layer | Industry Best Practice | Current Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Input & Intent** | **Context-Aware Parsing:** Translates free text into a strict schema based on the active mode (e.g., "Setup a drill" vs "Analyze this press"). | **Context Routing:** We are evolving to support distinct `context_type`s (Training vs. Match) to drive specific parsing logic. | 🔄 **In Progress** |
| **Tactics Logic** | **Generalized Spatial Engine:** A domain-specific engine that handles not just "Formations" but "Activities" with relative sizing and anchor points. | **Template Engine:** `tacticalTemplates.ts` is robust for match play but needs extension to handle "Drill Zones" and arbitrary "Entity Placement". | 🔄 **In Progress** |
| **Visualization** | **Deterministic Rendering:** A separate frontend layer renders the structured design; the LLM does not touch the pixels. | **Exact Match:** React components (`DrawingCanvas`) render the `BoardState` deterministically based on the coordinates provided by the engine. | ✅ **Aligned** |
| **Data & Models** | **Entity Abstraction:** "Entities" are not just players; they are Coaches, Cones, Goals, and Targets. Attributes define behavior. | **Player Centric:** Currently focused heavily on "Field Players". We are moving to a generic `Entity` system to support mixed resources in training. | 🔄 **In Progress** |
| **Simulation** | **Outcome Prediction:** Estimates probabilities (e.g., scoring chance) and suggests optimizations. | **Visual Setup Only:** The system excels at *setup* but currently lacks a feedback loop to predict *success* or simulate dynamic play outcomes. | ❌ **Gap** |

---

## 3. Key System Strengths

Our codebase possesses three unique architectural strengths that provide a solid foundation for future growth:

### A. The Prompt Router Pattern (`promptBuilder.ts`)
We dynamically switch interfaces based on "Game" vs. "Training" modes. This prevents hallucinations (e.g., creating a 5v5 drill with goalkeepers when none are wanted) and aligns perfectly with the "Tight Schema" best practice.

### B. Algorithmic Geometry Engine (`tacticalTemplates.ts`)
Instead of asking the LLM to "guess" where the circle edge is, we calculate it mathematically (e.g., `getCircleX`). This ensures the visualization is always crisp, accurate, and symmetrical, keeping the visualization layer deterministic.

### C. Living Playbook: The "Long-Term Memory" (`tacticManager.ts`)
The Living Playbook is not just a save slot; it is the system's "Long-Term Memory." It solves the variability problem inherent in Generative AI (RAG Workflow, One-Shot Fixing).

---

## 4. The Generalized Context Model

To support the "Training Session" prototype, we are introducing a new conceptual layer above the board state.

### A. Context Definition
The system will now accept a "Request" that defines the `context_type`:
*   **`tactical_match_simulation`**: Enforces rules of the game (11v11, offside logic, legal formations).
*   **`training_session`**: Flexible environment. Supports multiple simultaneous "Activities", arbitrary entity counts, and equipment.

### B. Request Structure (Example)
The following pseudocode illustrates how the AI breaks down a complex training request into distinct, spatially-aware activities.

```json
// SYSTEM OBJECT: Training Session Request
{
  // 1. GLOBAL CONTEXT
  "meta": {
    "context_type": "training_session",
    "pitch_view": "full_pitch"
  },
  // 2. ACTIVITIES ARRAY
  "activities": [
    // --- DRILL A: Goalkeepers ---
    {
      "id": "drill_01",
      "template_type": "specialist_training",
      "location_logic": {
        "anchor_point": "goal_circle_bottom", // "Down at one end"
        "coordinate_system": "relative_zone"
      },
      "entities": [
        { "type": "coach", "count": 1 },
        { "type": "player_gk", "count": 2 }
      ]
    },
    // --- DRILL B: Small Sided Game ---
    {
      "id": "drill_03",
      "template_type": "small_sided_game",
      "location_logic": {
        "anchor_point": "sideline_middle_left",
        "coordinate_system": "absolute_offset",
        "center_x": 5.0,
        "center_y": 45.7
      },
      "attributes": {
        "custom_dimensions": { "length": 30, "width": 20, "unit": "meters" },
        "goals": { "count": 2, "type": "mini_goals" }
      },
      "entities": [
        { "type": "player_outfield", "team": "bibs_yellow", "count": 3 },
        { "type": "player_outfield", "team": "bibs_green", "count": 3 }
      ]
    }
  ]
}
```

### C. Entity Abstraction
We are moving from `Player` objects to a generic `Entity` structure:
*   **Types**: `player_outfield`, `player_gk`, `coach`, `equipment_cone`, `equipment_goal`.
*   **Attributes**: Teams/Bibs, Roles, Counts.

---

## 5. Strategic Roadmap: Closing the Gap

To move from a "Smart Diagramming Tool" to a "Tactical Intelligence System," we will focus on three key areas:

### Phase 1: The Unified Field Model (The "Generalization" Gap)
*   **Goal:** Enable "Training Session" modeling alongside "Match Simulation".
*   **Implementation:**
    *   **Context Awareness:** Implement `TrainingSessionRequest` schema to handle the `activities` array. ✅ **Complete**
    *   **Spatial Resolver:** Build logic to translate "Drill Anchors" (e.g., "Top of Circle") into absolute pitch coordinates. ✅ **Complete**
    *   **Entity Factory:** Update the rendering engine to draw generalized entities (Coaches, Cones) based on the new `entities` array. ✅ **Complete**

### Phase 2: Conversational Copilot (The "Interaction" Gap)
*   **Goal:** Move from single-shot commands to iterative, stateful refinement (Chat).
*   **Implementation:**
    *   **State Management:** Store conversation history to enable context retention. ✅ **Complete**
    *   **Iterative Refinement:** Allow users to tweak results (e.g., "Make the grid bigger", "Swap teams"). ✅ **Complete**
    *   **Chat UI:** Implement a persistent Sidebar/Panel for the interaction history. ✅ **Complete**

### Phase 3: Rich Player Models (The "Data" Gap)
*   **Goal:** Make tactics aware of *who* is playing.
*   **Implementation:**
    *   Update `Entity` interface to include attributes: `preferredPosition`, `speed`, `skills`.
    *   **Living Playbook Integration:** Update `tacticManager.ts` to save/load *Roles*.
    *   Refactor `tacticalTemplates.ts` to use a "Best Fit" algorithm.

### Phase 4: Sequential & Ghost States (The "Time" Gap)
*   **Goal:** Visualize movement, not just static positions.
*   **Implementation:**
    *   Extend `Move` interface to support sequences or "Frames".
    *   Implement "Ghost" rendering.
