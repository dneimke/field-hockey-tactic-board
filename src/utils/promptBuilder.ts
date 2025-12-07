import { BoardState, Player, Message } from '../types';
import { FieldConfig } from '../config/fieldConfig';

// Interface Definitions
const COMMON_INTERFACES = `
interface Position { x: number; y: number; }
interface Move { 
  targetId: string; 
  newPosition: Position; 
  movementType?: 'sprint' | 'curve' | 'jockey' | 'jog'; 
  explanation?: string;
}
interface StandardAction {
  reasoning: string; // Chain of thought explaining the logic
  action: 'move' | 'formation' | 'reset' | 'ball' | 'multiple';
  moves: Move[];
  explanation: string;
}
interface ShapeAction {
  reasoning: string;
  action: 'shape';
  shape: {
    type: 'circle' | 'line' | 'grid';
    center?: Position;
    radius?: number;
    start?: Position;
    end?: Position;
    rows?: number;
    cols?: number;
    players: string[];
  };
  explanation: string;
}
interface CompositeAction {
  reasoning: string;
  action: 'composite';
  shapes?: any[]; // simplified for brevity
  moves?: Move[];
  explanation: string;
}
`;

const GAME_INTERFACES = `
interface SetPieceParameters {
  batteries?: 1 | 2;
  injectorSide?: 'left' | 'right';
  injectorId?: string;
  battery1Type?: 'top' | 'right';
  defenseStructure?: '1-3' | '2-2' | 'line_stop';
  runnerCount?: number;
  attackerId?: string;
  gkId?: string;
}

interface SetPieceAction {
  reasoning: string;
  action: 'set_piece';
  type: 'APC' | 'DPC' | 'shootout';
  parameters: SetPieceParameters;
  explanation: string;
}

interface TacticalPhaseAction {
  reasoning: string;
  action: 'tactical_phase';
  type: 'outlet' | 'press';
  team: 'red' | 'blue';
  structure: string;
  intensity?: number;
  explanation: string;
}
`;

const TRAINING_INTERFACES = `
// New Training Session Schema (Unified Field Model)
interface EntityRequest {
  type: "player" | "gk" | "cone" | "mini_goal" | "coach" | "ball";
  count: number;
  team?: "red" | "blue" | "neutral";
  behavior?: "static" | "active";
}

interface Activity {
  id: string;
  name: string;
  template_type: "ron_do" | "possession" | "shuttle" | "match_play" | "technical" | "small_sided_game";
  location: {
    anchor: "center_spot" | "top_D_left" | "top_D_right" | "top_D_center" | "baseline_center" | "goal_circle_bottom" | "sideline_middle_left" | "sideline_middle_right" | "goal_left" | "goal_right" | "corner_top_left" | "corner_bottom_left" | "corner_top_right" | "corner_bottom_right" | "23m_left_top" | "23m_left_bottom" | "23m_right_top" | "23m_right_bottom" | "penalty_corner_injector_left_top" | "penalty_corner_injector_left_bottom" | "penalty_corner_injector_right_top" | "penalty_corner_injector_right_bottom";
    offset?: { x: number; y: number };
    dimensions?: { width: number; height: number };
  };
  entities: EntityRequest[];
  attributes?: any;
}

interface TrainingSessionRequest {
  meta: {
    context_type: "training_session";
    pitch_view: "full_pitch" | "half_pitch" | "circle_detail";
  };
  activities: Activity[];
}

interface TrainingSessionAction {
  reasoning: string;
  action: "training_session";
  request: TrainingSessionRequest;
  explanation: string;
}

// Fallback for simple drills
interface DrillAction {
  reasoning: string;
  action: 'drill';
  type: 'small_sided_game' | 'possession';
  parameters: {
    attackers: number;
    defenders: number;
    withGK: boolean;
    zone: 'attacking_25' | 'midfield' | 'defensive_circle' | 'full_field';
    shape?: 'wide' | 'narrow';
    gameCount?: number;
    gameZones?: string[];
  };
  explanation: string;
}
`;

/**
 * Creates the AI prompt for command interpretation
 */
export const createPrompt = (
  command: string,
  boardState: BoardState,
  fieldConfig?: FieldConfig,
  mode?: 'game' | 'training',
  history: Message[] = []
): string => {
  const currentMode = mode || boardState.mode || 'game';
  const isTrainingMode = currentMode === 'training';
  
  // 1. Build Context Strings
  const geometryAnchors = buildGeometrySection();
  const splitPlayerList = buildSeparatedPlayerList(boardState);
  const interfaces = isTrainingMode ? TRAINING_INTERFACES : GAME_INTERFACES;
  
  // 2. Conditional Instructions
  const instructions = buildInstructionsSection(isTrainingMode);

  // 3. Field View
  const fieldViewSection = buildFieldViewSection(fieldConfig);

  // 4. Tactical Knowledge
  const tacticalKnowledgeSection = buildTacticalKnowledgeSection();

  // 5. History
  const historySection = buildHistorySection(history);

  return `
    You are a field hockey tactic assistant. Your job is to interpret natural language commands and convert them into specific player movements on a field hockey pitch.
    
    ${geometryAnchors}
    
    ${fieldViewSection}
    
    ${tacticalKnowledgeSection}
    
    ${splitPlayerList}
    
    ${historySection}
    
    MODE: ${currentMode.toUpperCase()}
    
    YOUR GOAL: Parse the command "${command}" into a JSON object matching these TypeScript interfaces:
    ${COMMON_INTERFACES}
    ${interfaces}
    
    ${instructions}
    
    CRITICAL RULES:
    1. "reasoning" field must come first. Explain your calculation logic, especially how you counted players or calculated coordinates, before outputting the 'action'.
    2. For Drills (Training Mode): NEVER use Goalkeepers unless explicitly asked. Use the "Field Players" list.
    3. For 23m line requests: Align with the "Long Corner Marks" anchors.
    4. Return ONLY valid JSON, no markdown, no extra text.
  `;
};

const buildGeometrySection = (): string => {
  return `FIELD GEOMETRY ANCHORS (Reference Points):
- Center Spot: {x: 50, y: 50}
- Top of Shooting Circle (D):
  - Left: {x: 14.6, y: 35} (top_D_left)
  - Right: {x: 85.4, y: 35} (top_D_right)
  - Center: {x: 14.6, y: 50} or {x: 85.4, y: 50} (top_D_center)
- Penalty Spot (P-Spot): {x: 11, y: 50} and {x: 89, y: 50}
- Long Corner Marks (23m line): {x: 23, y: 0/100} and {x: 77, y: 0/100}
- Goal Posts: {x: 0, y: 45/55} and {x: 100, y: 45/55}
- Sidelines:
  - Middle Left: {x: 50, y: 0} (sideline_middle_left)
  - Middle Right: {x: 50, y: 100} (sideline_middle_right)
- Goal Circle Bottom: {x: 14.6, y: 65} (goal_circle_bottom)
`;
};

const buildSeparatedPlayerList = (boardState: BoardState): string => {
  const formatPlayer = (p: Player) => `${p.number} (ID:${p.id}, x:${p.position.x}, y:${p.position.y})`;
  
  const redGK = boardState.redTeam.filter(p => p.isGoalkeeper).map(formatPlayer).join(', ');
  const redField = boardState.redTeam.filter(p => !p.isGoalkeeper).map(formatPlayer).join(', ');
  
  const blueGK = boardState.blueTeam.filter(p => p.isGoalkeeper).map(formatPlayer).join(', ');
  const blueField = boardState.blueTeam.filter(p => !p.isGoalkeeper).map(formatPlayer).join(', ');
  
  const balls = boardState.balls.map(b => `(ID:${b.id}, x:${b.position.x}, y:${b.position.y})`).join(', ');

  return `CURRENT BOARD STATE:
[RED TEAM]
- Goalkeeper: ${redGK || 'None'}
- Field Players: ${redField || 'None'} (Available for drills)

[BLUE TEAM]
- Goalkeeper: ${blueGK || 'None'}
- Field Players: ${blueField || 'None'} (Available for drills)

Ball Position: ${balls || 'None'}
`;
};

const buildFieldViewSection = (fieldConfig?: FieldConfig): string => {
  if (!fieldConfig) return '';
  
  const circleDetailNote = fieldConfig.type === 'circle_detail'
    ? `- Focus: Shooting circles (D areas). Left D (x: 0-15), Right D (x: 85-100).`
    : `- Full field view.`;

  return `FIELD VIEW CONTEXT:
- Current view: ${fieldConfig.name}
${circleDetailNote}
`;
};

const buildTacticalKnowledgeSection = (): string => {
  return `TACTICAL KNOWLEDGE:
- "Attacking Penalty Corner (APC)": Injector backline 10m from post. Castle top of D.
- "Defensive Penalty Corner (DPC)": GK in goal. 4 Runners (First Wave, Second Wave). Rest halfway.
- "Outlet": Moving ball from defense to midfield. Structures: Back 4 (dish), Back 3 (cup), Three High.
- "Press": Win ball back. Structures: Full Court, Half Court, W-Press.
`;
};

const buildInstructionsSection = (isTrainingMode: boolean): string => {
  if (isTrainingMode) {
    return `INSTRUCTIONS (TRAINING MODE):
1. Focus on DRILLS and EXERCISES.
2. You can place MULTIPLE balls if requested (use "ball", "ball_2", etc.).
3. Available Actions:
   - Option A: TrainingSessionAction (PREFERRED for multi-activity or complex drills)
   - Option B: DrillAction (simple single activity)
   - Option C: Standard Moves
   
   FOR TRAINING SESSIONS:
   - Break down the request into 'activities'.
   - Assign 'entities' (players, cones, goals, coaches) to each activity.
   - Use 'anchor' points to position each activity.

   CRITICAL GROUPING RULES:
   1. INTERACTING GROUPS: If players are working together (e.g., a 3v2 drill, a Rondo), group them into ONE activity at their center location.
   2. DISTRIBUTED SETUPS: If items are static or far apart (e.g., "cones in each corner", "goals at both ends"), create SEPARATE activities for each specific location.
      - CORRECT: 4 separate activities for "cones in corners".
      - INCORRECT: 1 activity at center_spot with 4 cones.
   
   Example Anchors: "center_spot", "top_D_left", "goal_left", "corner_top_left".
`;
  } else {
    return `INSTRUCTIONS (GAME MODE):
1. Focus on MATCH SCENARIOS.
2. Ensure only 1 ball is on the pitch.
3. Available Actions:
   - Option A: Standard Moves (move players/ball)
   - Option B: SetPieceAction (APC, DPC, shootout)
   - Option C: TacticalPhaseAction (outlet, press)
   - Option D: ShapeAction (formation adjustments)
   
   FOR TACTICS:
   - "APC": Set up attacking penalty corner.
   - "DPC": Set up defensive penalty corner.
   - "Outlet"/"Press": Arrange full team structures.
`;
  }
};

const buildHistorySection = (history: Message[]): string => {
  if (history.length === 0) return '';
  
  const formattedHistory = history
    .filter(msg => msg.role !== 'system') // Skip system messages
    .slice(-10) // Only keep last 10 messages for context window
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');

  return `CONVERSATION HISTORY (Use to resolve references like "them", "it", "wider", "higher"):
${formattedHistory}
`;
};
