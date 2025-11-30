import React, { useState, useEffect, useMemo } from "react";
import { SavedTactic } from "../types";
import { extractMetadataFromTags } from "../utils/tacticManager";

interface EditTacticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, name: string, tags: string[], type: 'single_team' | 'full_scenario', metadata?: SavedTactic['metadata']) => void;
  tactic: SavedTactic | null;
}

const EditTacticModal: React.FC<EditTacticModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tactic,
}) => {
  const [tacticName, setTacticName] = useState("");
  const [tags, setTags] = useState("");
  const [tacticType, setTacticType] = useState<'single_team' | 'full_scenario'>('full_scenario');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  // Initialize form when tactic changes
  useEffect(() => {
    if (tactic && isOpen) {
      setTacticName(tactic.name);
      setTags(tactic.tags.join(', '));
      setTacticType(tactic.type);
    }
  }, [tactic, isOpen]);

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

  if (!isOpen || !tactic) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tacticName.trim()) {
      // Parse tags from comma-separated string
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Extract metadata from name and tags (auto-detection)
      const metadata = extractMetadataFromTags(tacticName.trim(), tagsArray);
      
      onSave(tactic.id, tacticName.trim(), tagsArray, tacticType, metadata);
      onClose();
    } else {
      alert("Please enter a name for the tactic.");
    }
  };

  // Determine which teams are in the tactic
  const hasRed = tactic.positions.some(p => p.team === 'red');
  const hasBlue = tactic.positions.some(p => p.team === 'blue');
  const teamInfo = hasRed && hasBlue ? 'Both teams' : hasRed ? 'Red team' : hasBlue ? 'Blue team' : 'Unknown';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 text-white">Edit Tactic</h2>
        <p className="text-sm text-gray-400 mb-6">
          Note: To change positions, load this tactic, adjust players, and save again.
        </p>
        <form onSubmit={handleSave}>
          {/* Name Field */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label
                htmlFor="editTacticName"
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
              </div>
            )}
            <input
              id="editTacticName"
              type="text"
              value={tacticName}
              onChange={(e) => setTacticName(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g., Blue PC Defense"
              autoFocus
            />
          </div>
          
          {/* Tags Field */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label
                htmlFor="editTacticTags"
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
                <strong>Examples:</strong> &quot;blue, dpc, defense&quot; or &quot;red, apc, attack&quot;
              </div>
            )}
            <input
              id="editTacticTags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={`w-full bg-gray-700 text-white rounded-md p-2 border ${
                tagWarnings.length > 0 ? 'border-yellow-600' : 'border-gray-600'
              } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none`}
              placeholder="e.g., blue, dpc, defense"
            />
            {tagWarnings.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-200">
                {tagWarnings.map((warning, idx) => (
                  <div key={idx}>⚠️ {warning}</div>
                ))}
              </div>
            )}
          </div>
          
          {/* Type Field */}
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
                <strong>Single Team:</strong> Saves positions for one team only.
                <br />
                <strong>Full Scenario:</strong> Saves positions for BOTH teams.
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
                  <p className="text-xs text-gray-400 mt-1">Saves positions for one team only</p>
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
                  <p className="text-xs text-gray-400 mt-1">Saves positions for BOTH teams</p>
                </div>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Current tactic contains: {teamInfo} ({tactic.positions.length} positions)
            </p>
          </div>
          
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTacticModal;

