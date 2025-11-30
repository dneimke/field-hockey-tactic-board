import React from 'react';
import { Player } from '../types';

interface TeamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "game" | "training";
  redTeam: Player[];
  blueTeam: Player[];
  onAddPlayer: (team: "red" | "blue") => void;
  onRemovePlayer: (playerId: string) => void;
  onPresetChange?: (playerCount: number) => void;
}

const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({
  isOpen,
  onClose,
  mode,
  redTeam,
  blueTeam,
  onAddPlayer,
  onRemovePlayer,
  onPresetChange,
}) => {
  if (!isOpen) return null;

  const isGameMode = mode === "game";
  const canModifyPlayers = !isGameMode;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isGameMode && (
          <div className="mb-6 p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
            <p className="text-sm text-yellow-200">
              Training mode active: You can add or remove players for custom drills.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Red Team */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.6)]"></div>
                <span className="font-bold text-lg text-white">Red Team</span>
              </div>
              <span className="text-lg font-mono text-gray-300">{redTeam.length} Players</span>
            </div>
            
            {canModifyPlayers ? (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onAddPlayer("red")}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center justify-center gap-2"
                  title="Add player"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add
                </button>
                {redTeam.length > 0 && (
                  <button
                    onClick={() => {
                      const lastPlayer = redTeam[redTeam.length - 1];
                      onRemovePlayer(lastPlayer.id);
                    }}
                    className="flex-1 py-2 bg-gray-700 hover:bg-red-900/50 text-red-200 rounded transition-colors flex items-center justify-center gap-2"
                    title="Remove last player"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center mt-2">Fixed roster size (Game Mode)</p>
            )}
          </div>

          {/* Blue Team */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                <span className="font-bold text-lg text-white">Blue Team</span>
              </div>
              <span className="text-lg font-mono text-gray-300">{blueTeam.length} Players</span>
            </div>

            {canModifyPlayers ? (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onAddPlayer("blue")}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center justify-center gap-2"
                  title="Add player"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add
                </button>
                {blueTeam.length > 0 && (
                  <button
                    onClick={() => {
                      const lastPlayer = blueTeam[blueTeam.length - 1];
                      onRemovePlayer(lastPlayer.id);
                    }}
                    className="flex-1 py-2 bg-gray-700 hover:bg-red-900/50 text-red-200 rounded transition-colors flex items-center justify-center gap-2"
                    title="Remove last player"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center mt-2">Fixed roster size (Game Mode)</p>
            )}
          </div>
        </div>

        {!isGameMode && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm font-medium text-gray-400 mb-3">Quick Presets</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onPresetChange?.(5)}
                className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                5v5 (Small Game)
              </button>
              <button
                onClick={() => onPresetChange?.(7)}
                className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                7v7 (Half Field)
              </button>
              <button
                onClick={() => onPresetChange?.(11)}
                className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                11v11 (Full Match)
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
           <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
            >
              Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default TeamSettingsModal;

