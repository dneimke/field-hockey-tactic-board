// Fix: Implement the LoadTacticModal component to provide a UI for loading and managing saved tactics.
import React, { useState, useEffect, useMemo } from "react";
import { Tactic, StoredAnimation } from "../types";
import { ANIMATIONS_STORAGE_KEY } from "../constants";
import { getAllAnimations, deleteAnimation } from "../services/animationService";
import { User } from "firebase/auth";
import { getCurrentUser } from "../services/authService";

interface LoadTacticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (tactic: Tactic) => void;
  onExport: (tactic: Tactic) => void;
  onImport: (onSuccess: () => void) => void;
  onShare?: (animation: StoredAnimation) => void;
}

const LoadTacticModal: React.FC<LoadTacticModalProps> = ({
  isOpen,
  onClose,
  onLoad,
  onExport,
  onImport,
  onShare,
}) => {
  const [ownAnimations, setOwnAnimations] = useState<StoredAnimation[]>([]);
  const [sharedAnimations, setSharedAnimations] = useState<StoredAnimation[]>([]);
  const [localAnimations, setLocalAnimations] = useState<Tactic[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'own' | 'shared' | 'local'>('all');
  const [user, setUser] = useState<User | null>(null);

  const refreshTactics = async () => {
    setIsLoading(true);
    setError(null);
    
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      try {
        const { own, shared } = await getAllAnimations(currentUser.uid);
        setOwnAnimations(own);
        setSharedAnimations(shared);
      } catch (err) {
        console.error('Failed to load animations:', err);
        setError('Failed to load animations. Please try again.');
      }
    }
    
    // Also load from localStorage as fallback
    const tacticsJson = localStorage.getItem(ANIMATIONS_STORAGE_KEY);
    const savedTactics = tacticsJson ? JSON.parse(tacticsJson) : [];
    setLocalAnimations(savedTactics);
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshTactics();
      setSearchTerm("");
      setFilter('all');
    }
  }, [isOpen]);

  const allAnimations = useMemo(() => {
    const all: Array<{ tactic: Tactic | StoredAnimation; isShared?: boolean; isLocal?: boolean; ownerEmail?: string }> = [];
    
    // Add own animations
    ownAnimations.forEach(anim => {
      all.push({ tactic: anim, isShared: false });
    });
    
    // Add shared animations
    sharedAnimations.forEach(anim => {
      all.push({ tactic: anim, isShared: true, ownerEmail: anim.userId });
    });
    
    // Add local animations (only if no user or as fallback)
    if (!user || filter === 'local') {
      localAnimations.forEach(anim => {
        all.push({ tactic: anim, isLocal: true });
      });
    }
    
    return all;
  }, [ownAnimations, sharedAnimations, localAnimations, user, filter]);

  const filteredAnimations = useMemo(() => {
    let filtered = allAnimations;
    
    // Apply filter
    if (filter === 'own') {
      filtered = filtered.filter(item => !item.isShared && !item.isLocal);
    } else if (filter === 'shared') {
      filtered = filtered.filter(item => item.isShared);
    } else if (filter === 'local') {
      filtered = filtered.filter(item => item.isLocal);
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.tactic.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [allAnimations, searchTerm, filter]);

  if (!isOpen) {
    return null;
  }

  const handleLoad = (tactic: Tactic | StoredAnimation) => {
    onLoad(tactic);
  };

  const handleDelete = async (animation: Tactic | StoredAnimation) => {
    if (
      window.confirm(`Are you sure you want to delete "${animation.name}"?`)
    ) {
      if ('id' in animation && 'userId' in animation && user && animation.userId === user.uid) {
        // Delete from Firestore
        try {
          await deleteAnimation(user.uid, animation.id);
          await refreshTactics();
        } catch (error) {
          console.error('Failed to delete animation:', error);
          alert('Failed to delete animation. Please try again.');
        }
      } else {
        // Delete from localStorage
        const updatedTactics = localAnimations.filter(
          (t) => t.name !== animation.name
        );
        localStorage.setItem(ANIMATIONS_STORAGE_KEY, JSON.stringify(updatedTactics));
        refreshTactics();
      }
    }
  };

  const handleShare = (animation: StoredAnimation) => {
    if (onShare && user && animation.userId === user.uid) {
      onShare(animation);
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
        style={{ height: "min(80vh, 700px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Load Animation</h2>
          <button
            onClick={onClose}
            title="Close"
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Search animations..."
          />
          {user && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'own' | 'shared' | 'local')}
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">All</option>
              <option value="own">My Animations</option>
              <option value="shared">Shared With Me</option>
              {localAnimations.length > 0 && <option value="local">Local Only</option>}
            </select>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex-grow overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">
              <p>Loading animations...</p>
            </div>
          ) : filteredAnimations.length > 0 ? (
            <ul className="space-y-2">
              {filteredAnimations.map((item) => {
                const tactic = item.tactic;
                const isStored = 'id' in tactic && 'userId' in tactic;
                const isOwned = isStored && user && tactic.userId === user.uid;
                
                return (
                  <li
                    key={isStored ? tactic.id : tactic.name}
                    className={`bg-gray-700 rounded-md p-3 flex justify-between items-center transition-colors hover:bg-gray-600 ${
                      item.isShared ? 'border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">
                          {tactic.name}
                        </span>
                        {item.isShared && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                            Shared
                          </span>
                        )}
                        {item.isLocal && (
                          <span className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded">
                            Local
                          </span>
                        )}
                      </div>
                      {item.isShared && item.ownerEmail && (
                        <div className="text-xs text-gray-400 mt-1">
                          Shared by {item.ownerEmail}
                        </div>
                      )}
                    </div>
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
                      {isOwned && onShare && (
                        <button
                          onClick={() => handleShare(tactic as StoredAnimation)}
                          className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded-md transition-colors font-semibold"
                          title={`Share ${tactic.name}`}
                        >
                          Share
                        </button>
                      )}
                      {(isOwned || item.isLocal) && (
                        <button
                          onClick={() => handleDelete(tactic)}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors font-semibold"
                          title={`Delete ${tactic.name}`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>
                {searchTerm
                  ? "No animations match your search."
                  : "No saved animations found."}
              </p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={handleImportClick}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors"
          >
            Import Animation
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadTacticModal;
