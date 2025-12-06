// Fix: Implement the SaveTacticModal component to provide a user interface for saving tactics.
import React, { useState, useEffect, useMemo } from "react";
import { BoardState, SavedTactic } from "../types";
import { extractMetadataFromTags } from "../utils/tacticManager";

interface SaveTacticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, tags: string[], type: 'single_team' | 'full_scenario', metadata?: SavedTactic['metadata']) => void;
  title: string;
  confirmButtonText: string;
  placeholderText: string;
  initialValue?: string;
  boardState?: BoardState;
  mode: 'animation' | 'playbook';
}

const SaveTacticModal: React.FC<SaveTacticModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  confirmButtonText,
  placeholderText,
  initialValue = "",
  boardState,
  mode,
}) => {
  const [tacticName, setTacticName] = useState(initialValue);
  const [tags, setTags] = useState("");
  const [tacticType, setTacticType] = useState<'single_team' | 'full_scenario'>('full_scenario');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  // Analyze tags for warnings
  const tagWarnings = useMemo(() => {
    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
    
    const warnings: string[] = [];
    const hasRed = tagsArray.some(t => t === 'red' || t.includes('red'));
    const hasBlue = tagsArray.some(t => t === 'blue' || t.includes('blue'));
    const hasAPC = tagsArray.some(t => t === 'apc' || t.includes('apc') || t.includes('attacking'));
    const hasDPC = tagsArray.some(t => t === 'dpc' || t.includes('dpc') || t.includes('defending') || t.includes('defense'));
    
    if (hasRed && hasBlue) {
      warnings.push("Tag only the team this tactic is FOR, not both teams. Use 'Full Scenario' type to save both teams' positions.");
    }
    if (hasAPC && hasDPC) {
      warnings.push("Tag only one phase (APC/attack OR DPC/defense), not both.");
    }
    
    return warnings;
  }, [tags]);

  // Analyze board state for suggestions
  const suggestions = useMemo(() => {
    if (!boardState) return { name: '', tags: [], type: 'full_scenario' as const };
    
    const redCount = boardState.redTeam.length;
    const blueCount = boardState.blueTeam.length;
    const suggestedType = (redCount > 0 && blueCount > 0) ? 'full_scenario' : 'single_team';
    
    // Analyze positions to suggest name and tags
    const suggestedTags: string[] = [];
    let suggestedName = '';
    
    // Determine which team has more players (for single team tactics)
    const primaryTeam = redCount >= blueCount ? 'red' : 'blue';
    const primaryTeamPlayers = primaryTeam === 'red' ? boardState.redTeam : boardState.blueTeam;
    
    // Check for PC formations
    // DPC: GK near goal (x close to 0 or 100), multiple players near goal line
    // APC: Players around D arc (x around 85-100 for right goal)
    const gk = primaryTeamPlayers.find(p => p.isGoalkeeper);
    const playersNearGoal = primaryTeamPlayers.filter(p => {
      const goalX = primaryTeam === 'red' ? 0 : 100;
      return Math.abs(p.position.x - goalX) < 5 && Math.abs(p.position.y - 50) < 20;
    });
    const playersAtHalfway = primaryTeamPlayers.filter(p => Math.abs(p.position.x - 50) < 10);
    
    // DPC detection: GK in goal, 4+ players near goal line, some at halfway
    if (gk && playersNearGoal.length >= 4 && playersAtHalfway.length > 0) {
      suggestedName = `${primaryTeam === 'red' ? 'Red' : 'Blue'} PC Defense`;
      suggestedTags.push(primaryTeam === 'red' ? 'red' : 'blue', 'dpc', 'defense', 'corner');
    }
    // APC detection: Players around D arc (x > 75 for right goal, or x < 25 for left goal)
    else {
      const playersInD = primaryTeamPlayers.filter(p => {
        if (primaryTeam === 'red') {
          return p.position.x > 75 && Math.abs(p.position.y - 50) < 30;
        } else {
          return p.position.x < 25 && Math.abs(p.position.y - 50) < 30;
        }
      });
      if (playersInD.length >= 5) {
        suggestedName = `${primaryTeam === 'red' ? 'Red' : 'Blue'} PC Attack`;
        suggestedTags.push(primaryTeam === 'red' ? 'red' : 'blue', 'apc', 'attack', 'corner');
      } else {
        // Generic suggestion
        suggestedName = `${primaryTeam === 'red' ? 'Red' : 'Blue'} Formation`;
        suggestedTags.push(primaryTeam === 'red' ? 'red' : 'blue');
      }
    }
    
    return { name: suggestedName, tags: suggestedTags, type: suggestedType };
  }, [boardState]);

  // Auto-detect suggested type based on board state
  useEffect(() => {
    if (boardState && isOpen) {
      setTacticType(suggestions.type);
      if (!initialValue && suggestions.name) {
        setTacticName(suggestions.name);
      }
      if (suggestions.tags.length > 0 && !tags) {
        setTags(suggestions.tags.join(', '));
      }
    }
  }, [boardState, isOpen, suggestions, initialValue, tags]);

  useEffect(() => {
    // Reset form when modal opens or initial value changes
    if (isOpen) {
      setTacticName(initialValue);
      setTags("");
      setTacticType('full_scenario');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tacticName.trim()) {
      if (mode === 'animation') {
        // For animations, we don't need tags, type or metadata
        // Pass defaults that satisfy the interface but won't be used by the animation saver
        onSave(tacticName.trim(), [], 'full_scenario', undefined);
      } else {
        // Playbook save logic
        // Parse tags from comma-separated string
        const tagsArray = tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
        
        // Extract metadata from name and tags (auto-detection)
        const metadata = extractMetadataFromTags(tacticName.trim(), tagsArray);
        
        onSave(tacticName.trim(), tagsArray, tacticType, metadata);
      }
    } else {
      alert("Please enter a name for the tactic.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>
        <form onSubmit={handleSave}>
          {/* Name Field */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label
                htmlFor="tacticName"
                className="block text-sm font-medium text-gray-300"
              >
                Tactic Name
              </label>
              <button
                type="button"
                onClick={() => setShowHelp(showHelp === 'name' ? null : 'name')}
                className="text-gray-400 hover:text-gray-300 text-xs"
                title="Help"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            {showHelp === 'name' && (
              <div className="mb-2 p-2 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-200">
                This name is used to match commands. Be specific: &quot;Blue PC Defense - 1-3&quot; is better than &quot;Setup&quot;. 
                Examples: &quot;Blue PC Defense&quot;, &quot;Red Outlet - Back 4&quot;, &quot;Half Court Press&quot;
              </div>
            )}
            <input
              id="tacticName"
              type="text"
              value={tacticName}
              onChange={(e) => setTacticName(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder={placeholderText}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-400">
              Used for command matching. Be descriptive and specific.
            </p>
          </div>
          
          {/* Tags Field - Only for Playbook */}
          {mode === 'playbook' && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label
                htmlFor="tacticTags"
                className="block text-sm font-medium text-gray-300"
              >
                Tags (comma-separated)
              </label>
              <button
                type="button"
                onClick={() => setShowHelp(showHelp === 'tags' ? null : 'tags')}
                className="text-gray-400 hover:text-gray-300 text-xs"
                title="Help"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            {showHelp === 'tags' && (
              <div className="mb-2 p-2 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-200">
                <strong>Important:</strong> Tag the PRIMARY team and phase this tactic is FOR, not both teams.
                <br />
                <strong>Examples:</strong> &quot;blue, dpc, defense&quot; or &quot;red, apc, attack&quot; or &quot;outlet, back_4&quot;
                <br />
                <strong>Don&apos;t:</strong> &quot;red, blue, apc, dpc&quot; (tags both teams and phases)
              </div>
            )}
            <input
              id="tacticTags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={`w-full bg-gray-700 text-white rounded-md p-2 border ${
                tagWarnings.length > 0 ? 'border-yellow-600' : 'border-gray-600'
              } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none`}
              placeholder="e.g., blue, dpc, defense"
            />
            {suggestions.tags.length > 0 && !tags && (
              <button
                type="button"
                onClick={() => setTags(suggestions.tags.join(', '))}
                className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Use suggested: &quot;{suggestions.tags.join(', ')}&quot;
              </button>
            )}
            {tagWarnings.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-200">
                {tagWarnings.map((warning, idx) => (
                  <div key={idx}>⚠️ {warning}</div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Tag the team and phase this tactic is FOR. Examples: &quot;blue, dpc&quot; or &quot;red, apc, attack&quot;
            </p>
          </div>
          )}
          
          {/* Type Field - Only for Playbook */}
          {mode === 'playbook' && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Tactic Type
              </label>
              <button
                type="button"
                onClick={() => setShowHelp(showHelp === 'type' ? null : 'type')}
                className="text-gray-400 hover:text-gray-300 text-xs"
                title="Help"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            {showHelp === 'type' && (
              <div className="mb-2 p-2 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-200">
                <strong>Single Team:</strong> Saves positions for one team only (the team with more players on the board).
                <br />
                <strong>Full Scenario:</strong> Saves positions for BOTH teams (complete tactical situation with both teams positioned).
              </div>
            )}
            <div className="space-y-2">
              <label className="flex items-start p-3 bg-gray-700/50 rounded-md cursor-pointer hover:bg-gray-700/70 transition-colors">
                <input
                  type="radio"
                  value="single_team"
                  checked={tacticType === 'single_team'}
                  onChange={(e) => setTacticType(e.target.value as 'single_team' | 'full_scenario')}
                  className="mt-1 mr-3"
                />
                <div>
                  <span className="text-gray-300 font-medium">Single Team</span>
                  <p className="text-xs text-gray-400 mt-1">Saves positions for one team only (the team with more players)</p>
                </div>
              </label>
              <label className="flex items-start p-3 bg-gray-700/50 rounded-md cursor-pointer hover:bg-gray-700/70 transition-colors">
                <input
                  type="radio"
                  value="full_scenario"
                  checked={tacticType === 'full_scenario'}
                  onChange={(e) => setTacticType(e.target.value as 'single_team' | 'full_scenario')}
                  className="mt-1 mr-3"
                />
                <div>
                  <span className="text-gray-300 font-medium">Full Scenario</span>
                  <p className="text-xs text-gray-400 mt-1">Saves positions for BOTH teams (complete tactical situation)</p>
                </div>
              </label>
            </div>
            {boardState && (
              <p className="mt-2 text-xs text-gray-400">
                {tacticType === 'full_scenario' 
                  ? `Will save: Red team (${boardState.redTeam.length} players) + Blue team (${boardState.blueTeam.length} players)`
                  : `Will save: ${boardState.redTeam.length >= boardState.blueTeam.length ? 'Red' : 'Blue'} team (${Math.max(boardState.redTeam.length, boardState.blueTeam.length)} players)`
                }
              </p>
            )}
          </div>
          )}
          
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors"
            >
              {confirmButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveTacticModal;
