// Fix: Implement the LoadTacticModal component to provide a UI for loading and managing saved tactics.
import React, { useState, useEffect, useMemo } from 'react';
import { Tactic } from '../types';

interface LoadTacticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (tactic: Tactic) => void;
  onExport: (tactic: Tactic) => void;
  onImport: (onSuccess: () => void) => void;
}

const TACTICS_STORAGE_KEY = 'hockey_tactics';

const LoadTacticModal: React.FC<LoadTacticModalProps> = ({ isOpen, onClose, onLoad, onExport, onImport }) => {
  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshTactics = () => {
    const tacticsJson = localStorage.getItem(TACTICS_STORAGE_KEY);
    const savedTactics = tacticsJson ? JSON.parse(tacticsJson) : [];
    setTactics(savedTactics);
  };
  
  useEffect(() => {
    if (isOpen) {
      refreshTactics();
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredTactics = useMemo(() => {
    if (!searchTerm) {
        return tactics;
    }
    return tactics.filter(tactic => 
      tactic.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tactics, searchTerm]);

  if (!isOpen) {
    return null;
  }

  const handleLoad = (tactic: Tactic) => {
    onLoad(tactic);
  };
  
  const handleDelete = (tacticNameToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete "${tacticNameToDelete}"?`)) {
      const updatedTactics = tactics.filter(t => t.name !== tacticNameToDelete);
      localStorage.setItem(TACTICS_STORAGE_KEY, JSON.stringify(updatedTactics));
      refreshTactics();
    }
  };

  const handleImportClick = () => {
    onImport(refreshTactics);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl flex flex-col"
        style={{ height: 'min(80vh, 700px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Load Tactic</h2>
            <button onClick={onClose} title="Close" className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-4"
            placeholder="Search tactics..."
        />
        
        <div className="flex-grow overflow-y-auto pr-2">
          {filteredTactics.length > 0 ? (
            <ul className="space-y-2">
              {filteredTactics.map((tactic) => (
                <li key={tactic.name} className="bg-gray-700 rounded-md p-3 flex justify-between items-center transition-colors hover:bg-gray-600">
                  <span className="font-semibold text-white truncate pr-4">{tactic.name}</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                        onClick={() => handleLoad(tactic)}
                        className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-md transition-colors font-semibold"
                        title={`Load ${tactic.name}`}
                    >
                        Load
                    </button>
                     <button 
                        onClick={() => onExport(tactic)}
                        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold"
                        title={`Export ${tactic.name}`}
                    >
                        Export
                    </button>
                    <button 
                        onClick={() => handleDelete(tactic.name)}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors font-semibold"
                        title={`Delete ${tactic.name}`}
                    >
                        Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>{searchTerm ? 'No tactics match your search.' : 'No saved tactics found.'}</p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
            <button 
                onClick={handleImportClick}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors"
            >
                Import Tactic
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoadTacticModal;