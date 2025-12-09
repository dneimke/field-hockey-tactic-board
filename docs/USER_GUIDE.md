# User Guide: Field Hockey Tactical Whiteboard AI

Welcome to the Field Hockey Tactical Whiteboard! This AI-powered tool helps coaches and players visualize tactics, set pieces, and drills using simple natural language commands.

## Getting Started

1.  **Type Command**: Enter your instruction in the text box at the bottom.
2.  **Execute**: Press Enter or click the arrow. The board will update automatically.

## Basic Commands

You can move players individually or in groups.

-   "Move Red 7 to the top of the D"
-   "Move Blue 10 to the penalty spot"
-   "Reset to match start"

## Advanced Tactics

We have upgraded the system to understand specific field hockey terminology.

### Penalty Corners

You can request standard Attacking (APC) or Defensive (DPC) setups instantly.

**Attacking PC (APC):**
-   "Setup a standard PC attack" (Defaults to 1 battery)
-   "Setup a 2-castle PC"
-   "APC with injector on the left"

**Defensive PC (DPC):**
-   "Setup PC defense"
-   "DPC with 1-3 structure"
-   "Defensive corner with 3 runners"

### Training Drills & Small Sided Games

You can quickly organize players into zones for training exercises. The system will automatically switch to training mode for these commands.

-   "Setup a 4v2 in the D"
-   "3v3 possession game in midfield"
-   "Attacking 25 drill with 5 attackers and 3 defenders"

## Cheat Sheet

| Intent | Example Command |
| :--- | :--- |
| **Move Player** | "R7 to center spot" |
| **Formation** | "Red team play 4-3-3" |
| **Shape** | "Form a circle in midfield" |
| **APC** | "Setup attacking PC" |
| **DPC** | "Setup defensive PC 2-2 structure" |
| **Drill** | "4v2 in attacking 25" |

## Sharing Animations

When you're signed in, you can share your animations with teammates and access them from any device.

### How to Share

1. **Open Load Animation**: Click "Load" in the toolbar to open your saved animations
2. **Click Share**: Find the animation you want to share and click the "Share" button
3. **Copy the Link**: A shareable link will be generated. Click "Copy Link" to copy it to your clipboard
4. **Send to Teammates**: Share the link via email, team chat, or any messaging platform

### Receiving Shared Animations

1. **Open the Link**: When someone shares an animation link with you, click it
2. **Sign In**: If you're not already signed in, you'll be prompted to sign in
3. **Access the Animation**: The shared animation will automatically load and appear in your "Shared With Me" section

### Managing Shares

- **View Shared Animations**: In the "Load Animation" menu, use the filter dropdown to view "Shared With Me"
- **Remove Access**: Animation owners can remove share access from the Share modal
- **Regenerate Links**: Owners can regenerate share links to revoke old links and create new ones

### Storage & Sync

- **Cloud Storage**: When signed in, animations are stored in the cloud and sync across all your devices
- **Local Storage**: When not signed in, animations are stored locally on your device only
- **Export for Backup**: Use the "Export" button to save animations as JSON files for backup

## The Living Playbook

The Living Playbook allows you to save, organize, and reuse tactical configurations. When you save a tactic, the system will automatically use your saved version instead of AI-generated positions when you enter matching commands.

### Quick Start

1. **Save a Tactic**: After positioning players (manually or via AI), click Settings → "Save Tactic"
   - Give it a descriptive name
   - Add tags for easy searching (e.g., "defense, corner, blue")
   - Choose "Single Team" or "Full Scenario"

2. **View Your Playbook**: Click Settings → "Living Playbook" to see all saved tactics

3. **Automatic Loading**: When you enter a command that matches a saved tactic name, it loads automatically

### Example Workflow

```
1. Enter: "Setup Blue PC Defense"
2. AI positions players (may need correction)
3. Drag players to correct positions
4. Save as "Standard PC Defense" with tags: "defense, corner, blue"
5. Next time you enter "Setup Blue PC Defense", your saved version loads instantly!
```

**For detailed information**, see the [Living Playbook Documentation](features/ai/LIVING_PLAYBOOK.md).

## Tips

-   **Be Specific**: "Move R7" is better than "Move him".
-   **Use Terminology**: The AI understands "D", "23m line", "p-spot", "castle", "injector".
-   **Verify**: Always double-check the positions. You can drag players manually to fine-tune after the AI moves them.
-   **Save Corrections**: If AI positioning is wrong, correct it and save to your playbook for future use.
