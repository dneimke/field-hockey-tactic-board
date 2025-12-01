import { BoardState, Player } from '../types';
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
interface DrillAction {
  reasoning: string;
  action: 'drill';
  type: 'small_sided_game' | 'possession';
  parameters: {
    attackers: number; // FIELD PLAYERS ONLY
    defenders: number; // FIELD PLAYERS ONLY
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

  return `
    You are a field hockey tactic assistant. Your job is to interpret natural language commands and convert them into specific player movements on a field hockey pitch.
    
    ${geometryAnchors}
    
    ${fieldViewSection}
    
    ${tacticalKnowledgeSection}
    
    ${splitPlayerList}
    
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
- Top of Shooting Circle (D): {x: 14.6, y: 50} and {x: 85.4, y: 50}
- Penalty Spot (P-Spot): {x: 11, y: 50} and {x: 89, y: 50}
- Long Corner Marks (23m line): {x: 23, y: 0/100} and {x: 77, y: 0/100}
- Goal Posts: {x: 0, y: 45/55} and {x: 100, y: 45/55}
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
   - Option A: Standard Moves (move players/balls)
   - Option B: DrillAction (small_sided_game, possession)
   - Option C: ShapeAction (circle, line, grid)
   
   FOR DRILLS:
   - "5v5" means 5 FIELD PLAYERS per team.
   - "withGK": false unless explicitly requested.
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
