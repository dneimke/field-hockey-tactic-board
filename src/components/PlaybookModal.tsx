import React, { useState, useEffect, useMemo } from "react";
import { SavedTactic } from "../types";
import { getAllTactics, deleteTactic, searchTactics } from "../utils/tacticManager";

// Helper functions to analyze tactics (similar to commandInterpreter)
const getTacticTeam = (tactic: SavedTactic): 'red' | 'blue' | 'both' | null => {
  const hasRed = tactic.positions.some(p => p.team === 'red');
  const hasBlue = tactic.positions.some(p => p.team === 'blue');
  if (hasRed && hasBlue) return 'both';
  if (hasRed) return 'red';
  if (hasBlue) return 'blue';
  return null;
};

const getTacticPhase = (tactic: SavedTactic): { type: 'attack' | 'defense' | null; isAPC: boolean; isDPC: boolean } => {
  const nameLower = tactic.name.toLowerCase();
  const tagsLower = tactic.tags.map(t => t.toLowerCase());
  const isAPC = nameLower.includes('apc') || nameLower.includes('attacking') || tagsLower.includes('apc') || tagsLower.includes('attacking');
  const isDPC = nameLower.includes('dpc') || nameLower.includes('defending') || nameLower.includes('defense') || tagsLower.includes('dpc') || tagsLower.includes('defending') || tagsLower.includes('defense');
  let type: 'attack' | 'defense' | null = null;
  if (isDPC) type = 'defense';
  else if (isAPC) type = 'attack';
  return { type, isAPC, isDPC };
};

const getMatchingExamples = (tactic: SavedTactic): string[] => {
  const examples: string[] = [];
  const team = getTacticTeam(tactic);
  const phase = getTacticPhase(tactic);
  const nameLower = tactic.name.toLowerCase();
  
  // Generate example commands that would match
  if (team === 'red' || team === 'both') {
    if (phase.isDPC || phase.type === 'defense') {
      examples.push('Red PC Defense', 'Setup Red DPC', 'Red defending penalty corner');
    }
    if (phase.isAPC || phase.type === 'attack') {
      examples.push('Red PC Attack', 'Setup Red APC', 'Red attacking penalty corner');
    }
  }
  if (team === 'blue' || team === 'both') {
    if (phase.isDPC || phase.type === 'defense') {
      examples.push('Blue PC Defense', 'Setup Blue DPC', 'Blue defending penalty corner');
    }
    if (phase.isAPC || phase.type === 'attack') {
      examples.push('Blue PC Attack', 'Setup Blue APC', 'Blue attacking penalty corner');
    }
  }
  
  // Add name-based examples
  if (nameLower.includes('outlet')) {
    examples.push('Red Outlet', 'Blue Outlet', 'Setup Outlet');
  }
  if (nameLower.includes('press')) {
    examples.push('Red Press', 'Blue Press', 'Setup Press');
  }
  
  return examples.slice(0, 3); // Limit to 3 examples
};

interface PlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTactic: (savedTactic: SavedTactic) => void;
  onEditTactic: (tactic: SavedTactic) => void;
}

const PlaybookModal: React.FC<PlaybookModalProps> = ({
  isOpen,
  onClose,
  onLoadTactic,
  onEditTactic,
}) => {
  const [tactics, setTactics] = useState<SavedTactic[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredTactics, setFilteredTactics] = useState<SavedTactic[]>([]);

  const refreshTactics = async () => {
    setIsLoading(true);
    try {
      const allTactics = await getAllTactics();
      setTactics(allTactics);
      setFilteredTactics(allTactics);
    } catch (error) {
      console.error('Failed to load tactics:', error);
      setTactics([]);
      setFilteredTactics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshTactics();
      setSearchTerm("");
    }
  }, [isOpen]);

  useEffect(() => {
    const updateFiltered = async () => {
      if (!searchTerm.trim()) {
        setFilteredTactics(tactics);
        return;
      }
      
      setIsLoading(true);
      try {
        const filtered = await searchTactics(searchTerm);
        setFilteredTactics(filtered);
      } catch (error) {
        console.error('Failed to search tactics:', error);
        setFilteredTactics([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    updateFiltered();
  }, [searchTerm, tactics]);

  if (!isOpen) {
    return null;
  }

  const handleLoad = (tactic: SavedTactic) => {
    onLoadTactic(tactic);
    onClose();
  };

  const handleDelete = async (tacticId: string, tacticName: string) => {
    if (
      window.confirm(`Are you sure you want to delete "${tacticName}"?`)
    ) {
      try {
        await deleteTactic(tacticId);
        await refreshTactics();
      } catch (error) {
        console.error('Failed to delete tactic:', error);
        alert('Failed to delete tactic. Please try again.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl flex flex-col"
        style={{ height: "min(80vh, 700px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Living Playbook</h2>
            <p className="text-sm text-gray-400 mt-1">
              Saved tactics for command lookup
            </p>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-4"
          placeholder="Search by name or tags..."
        />

        <div className="flex-grow overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
              <p className="text-lg font-medium">Loading tactics...</p>
            </div>
          ) : filteredTactics.length > 0 ? (
            <ul className="space-y-3">
              {filteredTactics.map((tactic) => (
                <li
                  key={tactic.id}
                  className="bg-gray-700 rounded-md p-4 flex flex-col gap-3 transition-colors hover:bg-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg mb-2 truncate">
                        {tactic.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tactic.tags.length > 0 ? (
                          tactic.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-indigo-600/30 text-indigo-300 text-xs rounded-md border border-indigo-500/50"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs italic">No tags</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-2">
                        <span
                          className={`px-2 py-1 rounded ${
                            tactic.type === "full_scenario"
                              ? "bg-green-600/20 text-green-400 border border-green-500/50"
                              : "bg-blue-600/20 text-blue-400 border border-blue-500/50"
                          }`}
                        >
                          {tactic.type === "full_scenario"
                            ? "Full Scenario"
                            : "Single Team"}
                        </span>
                        {(() => {
                          const team = getTacticTeam(tactic);
                          if (team === 'both') {
                            return <span className="px-2 py-1 bg-purple-600/20 text-purple-400 border border-purple-500/50 rounded">Both Teams</span>;
                          } else if (team === 'red') {
                            return <span className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/50 rounded">Red Team</span>;
                          } else if (team === 'blue') {
                            return <span className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded">Blue Team</span>;
                          }
                          return null;
                        })()}
                        {(() => {
                          const phase = getTacticPhase(tactic);
                          if (phase.isAPC && phase.isDPC) {
                            return <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-500/50 rounded">⚠️ Conflicting Tags</span>;
                          } else if (phase.type === 'attack') {
                            return <span className="px-2 py-1 bg-orange-600/20 text-orange-400 border border-orange-500/50 rounded">Attack</span>;
                          } else if (phase.type === 'defense') {
                            return <span className="px-2 py-1 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded">Defense</span>;
                          }
                          return null;
                        })()}
                        <span className="text-gray-500">
                          {tactic.positions.length} position{tactic.positions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {(() => {
                        const examples = getMatchingExamples(tactic);
                        if (examples.length > 0) {
                          return (
                            <div className="text-xs text-gray-500 italic">
                              Would match: "{examples.join('", "')}"
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-4">
                      <button
                        onClick={() => handleLoad(tactic)}
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 rounded-md transition-colors font-semibold"
                        title={`Load ${tactic.name} onto board`}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onEditTactic(tactic)}
                        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold"
                        title={`Edit ${tactic.name}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tactic.id, tactic.name)}
                        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors font-semibold"
                        title={`Delete ${tactic.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-lg font-medium mb-2">
                {searchTerm
                  ? "No tactics match your search."
                  : "No saved tactics in your playbook."}
              </p>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? "Try a different search term."
                  : "Save tactics from the board to build your playbook."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybookModal;

