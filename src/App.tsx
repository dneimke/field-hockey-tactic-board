// Fix: Implement the main App component to serve as the entry point and state manager for the application.
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Piece from './components/Piece';
import DrawingCanvas from './components/DrawingCanvas';
import Controls from './components/Controls';
import SaveTacticModal from './components/SaveTacticModal';
import LoadTacticModal from './components/LoadTacticModal';
import PlaybookModal from './components/PlaybookModal';
import EditTacticModal from './components/EditTacticModal';
import HeaderToolbar from './components/HeaderToolbar';
import CommandInput from './components/CommandInput';
import TeamSettingsModal from './components/TeamSettingsModal';
import { INITIAL_RED_TEAM, INITIAL_BLUE_TEAM, INITIAL_BALLS, createGameModeTeam } from './constants';
import { Player, Ball, Position, Path, Tactic, BoardState, FieldType, SavedTactic } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useCommandExecution } from './hooks/useCommandExecution';
import { FIELD_CONFIGS } from './config/fieldConfig';
import { addPlayer as addPlayerUtil, removePlayer as removePlayerUtil, validatePlayerCount, createInitialTeam } from './utils/playerManagement';
import { saveTactic as saveTacticToPlaybook, savedTacticToMoves, updateTactic, setCurrentUserId } from './utils/tacticManager';
import { subscribeToAuthState, signOutUser, getCurrentUser } from './services/authService';
import { User } from 'firebase/auth';
import AuthModal from './components/AuthModal';

const TACTICS_STORAGE_KEY = 'hockey_tactics';

const exportTacticToFile = (tactic: Tactic) => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(tactic, null, 2),
  )}`;
  const link = document.createElement('a');
  link.href = jsonString;
  link.download = `${tactic.name.replace(/\s+/g, '_').toLowerCase()}.json`;

  // The link must be added to the DOM for the click to work in some browsers
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const importTacticFromFile = (
  onSuccess: (tactic: Tactic) => void,
  onError: (error: string) => void,
) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File content is not a string.');
        }
        const tactic = JSON.parse(text);
        if (
          tactic &&
          typeof tactic.name === 'string' &&
          Array.isArray(tactic.frames) &&
          Array.isArray(tactic.paths)
        ) {
          onSuccess(tactic);
        } else {
          throw new Error('Invalid tactic file format.');
        }
      } catch (err) {
        onError((err as Error).message);
      }
    };
    reader.onerror = () => {
      onError('Failed to read the file.');
    };
    reader.readAsText(file);
  };
  input.click();
};

const App: React.FC = () => {
  const [redTeam, setRedTeam] = useState<Player[]>(INITIAL_RED_TEAM);
  const [blueTeam, setBlueTeam] = useState<Player[]>(INITIAL_BLUE_TEAM);
  const [balls, setBalls] = useState<Ball[]>(INITIAL_BALLS);
  const [paths, setPaths] = useState<Path[]>([]);
  const [mode, setMode] = useState<"game" | "training">("game");
  const [fieldType, setFieldType] = useState<FieldType>("standard");

  // Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'freehand' | 'arrow'>('freehand');
  const [drawingColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(4);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);

  // Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isPlaybookModalOpen, setIsPlaybookModalOpen] = useState(false);
  const [isEditTacticModalOpen, setIsEditTacticModalOpen] = useState(false);
  const [editingTactic, setEditingTactic] = useState<SavedTactic | null>(null);
  const [isCommandInputOpen, setIsCommandInputOpen] = useState(false);
  const [isTeamSettingsModalOpen, setIsTeamSettingsModalOpen] = useState(false);
  const [overwriteConfirm, setOverwriteConfirm] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Animation State
  const [frames, setFrames] = useState<BoardState[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing'>('idle');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const animationInterval = useRef<number | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);

  const isPortrait = useMediaQuery('(orientation: portrait) and (max-width: 768px)');


  // Initialize auth state and subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      setIsAuthInitializing(false);
      setUser(currentUser);
      setCurrentUserId(currentUser?.uid || null);

      // Show auth modal if not authenticated
      if (!currentUser) {
        setIsAuthModalOpen(true);
      } else {
        setIsAuthModalOpen(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
      setUser(null);
      setCurrentUserId(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      alert('Failed to sign out. Please try again.');
    }
  }, []);

  // Handle auth success
  const handleAuthSuccess = useCallback(() => {
    setIsAuthModalOpen(false);
    // Auth state will be updated by the subscription
  }, []);

  const setBoardState = useCallback((state: BoardState) => {
    setRedTeam(Array.isArray(state.redTeam) ? state.redTeam : []);
    setBlueTeam(Array.isArray(state.blueTeam) ? state.blueTeam : []);
    setBalls(Array.isArray(state.balls) ? state.balls : INITIAL_BALLS);
  }, []);

  const handlePieceMove = useCallback(
    (id: string, position: Position, isStandardCoordinates: boolean = false) => {
      if (isDrawingMode || playbackState === 'playing') return;

      let finalPosition = position;
      // Only reverse transform if position is in display coordinates (from dragging)
      // Command execution provides positions already in standard coordinates
      if (!isStandardCoordinates && isPortrait) {
        // Reverse the transformation for saving state
        finalPosition = {
          x: position.y,
          y: 100 - position.x,
        };
      }

      const updatePiece = (setter: React.Dispatch<React.SetStateAction<Player[]>>) =>
        setter((team) => team.map((p) => (p.id === id ? { ...p, position: finalPosition } : p)));

      if (id.startsWith('ball')) {
        setBalls((prevBalls) => {
          const existingBall = prevBalls.find((b) => b.id === id);
          if (existingBall) {
            return prevBalls.map((b) => (b.id === id ? { ...b, position: finalPosition } : b));
          } else {
            // Create new ball
            return [...prevBalls, { id, position: finalPosition }];
          }
        });
      } else {
        updatePiece(setRedTeam);
        updatePiece(setBlueTeam);
      }
    },
    [isDrawingMode, playbackState, isPortrait],
  );

  const handleResetBalls = useCallback(() => {
    setBalls(INITIAL_BALLS);
  }, []);

  const handleAddPath = useCallback(
    (path: Omit<Path, 'id'>) => {
      let finalPath = path;
      if (isPortrait) {
        // Reverse the transformation for saving state
        finalPath = {
          ...path,
          points: path.points.map((p) => ({ x: p.y, y: 100 - p.x })),
        };
      }
      setPaths((prev) => [...prev, { ...finalPath, id: uuidv4() }]);
    },
    [isPortrait],
  );

  const undoLastPath = useCallback(() => setPaths((prev) => prev.slice(0, -1)), []);
  const clearAllPaths = useCallback(() => setPaths([]), []);

  const resetBoard = useCallback(() => {
    if (mode === "game") {
      setRedTeam(INITIAL_RED_TEAM);
      setBlueTeam(INITIAL_BLUE_TEAM);
    } else {
      setRedTeam(INITIAL_RED_TEAM);
      setBlueTeam(INITIAL_BLUE_TEAM);
    }
    setBalls(INITIAL_BALLS);
    clearAllPaths();
    setFrames([]);
    setCurrentFrame(0);
    setPlaybackState('idle');
  }, [clearAllPaths, mode]);

  // Player management functions
  const handleAddPlayer = useCallback((team: "red" | "blue") => {
    if (mode === "game") return; // Cannot add players in game mode
    
    const currentTeam = team === "red" ? redTeam : blueTeam;
    const newPlayer = addPlayerUtil(currentTeam, team);
    const setter = team === "red" ? setRedTeam : setBlueTeam;
    setter([...currentTeam, newPlayer]);
  }, [mode, redTeam, blueTeam]);

  const handleRemovePlayer = useCallback((playerId: string) => {
    if (mode === "game") return; // Cannot remove players in game mode
    
    if (playerId.startsWith("R")) {
      setRedTeam(removePlayerUtil(redTeam, playerId));
    } else if (playerId.startsWith("B")) {
      setBlueTeam(removePlayerUtil(blueTeam, playerId));
    }
  }, [mode, redTeam, blueTeam]);

  const handleModeChange = useCallback((newMode: "game" | "training") => {
    if (newMode === mode) return;
    
    if (newMode === "game") {
      // Switching to game mode: ensure 11 players per team
      setRedTeam(INITIAL_RED_TEAM);
      setBlueTeam(INITIAL_BLUE_TEAM);
    }
    // Switching to training mode: keep current players
    setMode(newMode);
  }, [mode]);

  const handlePresetChange = useCallback((playerCount: number) => {
    // Switch to training mode if not already
    if (mode !== "training") {
      setMode("training");
    }
    
    // Create teams with specified player count
    // For presets, include goalkeepers
    const includeGK = playerCount >= 5; // Include GK for 5v5, 7v7, 11v11
    setRedTeam(createInitialTeam("red", playerCount, includeGK));
    setBlueTeam(createInitialTeam("blue", playerCount, includeGK));
  }, [mode]);

  // Animation Handlers
  const handleAddFrame = useCallback(() => {
    const newFrame: BoardState = { redTeam, blueTeam, balls };
    setFrames((prev) => [...prev, newFrame]);
  }, [redTeam, blueTeam, balls]);

  const handleGoToFrame = useCallback(
    (frameIndex: number) => {
      if (frameIndex >= 0 && frameIndex < frames.length) {
        setCurrentFrame(frameIndex);
        setBoardState(frames[frameIndex]);
      }
    },
    [frames, setBoardState],
  );

  const handlePlay = useCallback(() => {
    if (frames.length < 2) return;

    if (playbackState === 'playing') {
      // PAUSE
      setPlaybackState('idle');
      if (animationInterval.current) clearInterval(animationInterval.current);
      return;
    }

    setPlaybackState('playing');
    // If at the end, reset to the beginning before playing
    const startFrame = currentFrame >= frames.length - 1 ? 0 : currentFrame;
    if (startFrame === 0) {
      handleGoToFrame(0);
    }

    let frame = startFrame;
    animationInterval.current = window.setInterval(() => {
      frame++;
      if (frame >= frames.length) {
        if (animationInterval.current) clearInterval(animationInterval.current);
        setPlaybackState('idle');
        setCurrentFrame(frames.length - 1);
      } else {
        handleGoToFrame(frame);
      }
    }, 2250 / animationSpeed);
  }, [frames.length, currentFrame, playbackState, handleGoToFrame, animationSpeed]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (animationInterval.current) clearInterval(animationInterval.current);
    };
  }, []);

  // Save & Load
  const writeTacticToStorage = (tactic: Tactic) => {
    const tacticsJson = localStorage.getItem(TACTICS_STORAGE_KEY);
    const tactics: Tactic[] = tacticsJson ? JSON.parse(tacticsJson) : [];

    const existingIndex = tactics.findIndex((t) => t.name === tactic.name);
    if (existingIndex > -1) {
      tactics[existingIndex] = tactic;
    } else {
      tactics.push(tactic);
    }

    localStorage.setItem(TACTICS_STORAGE_KEY, JSON.stringify(tactics));
  };

  const handleSaveTactic = useCallback(
    async (name: string, tags: string[], type: 'single_team' | 'full_scenario', metadata?: SavedTactic['metadata']) => {
      // Save as SavedTactic for playbook lookup
      const currentBoardState: BoardState = { redTeam, blueTeam, balls, mode };
      try {
        await saveTacticToPlaybook(currentBoardState, name, tags, type, metadata);
      } catch (error) {
        console.error('Failed to save tactic to playbook:', error);
        alert('Failed to save tactic. Please try again.');
        return;
      }

      // Also save as Tactic for backward compatibility (animation frames)
      let framesToSave = frames;
      if (frames.length === 0) {
        framesToSave = [{ redTeam, blueTeam, balls }];
      }

      const newTactic: Tactic = {
        name,
        frames: framesToSave,
        paths,
        fieldType,
      };

      const tacticsJson = localStorage.getItem(TACTICS_STORAGE_KEY);
      const tactics: Tactic[] = tacticsJson ? JSON.parse(tacticsJson) : [];
      const existing = tactics.find((t) => t.name === newTactic.name);

      if (existing) {
        setOverwriteConfirm({
          message: `A tactic named "${newTactic.name}" already exists. Do you want to overwrite it?`,
          onConfirm: () => {
            writeTacticToStorage(newTactic);
            setOverwriteConfirm(null);
            setIsSaveModalOpen(false);
          },
          onCancel: () => setOverwriteConfirm(null),
        });
      } else {
        writeTacticToStorage(newTactic);
        setIsSaveModalOpen(false);
      }
    },
    [redTeam, blueTeam, balls, paths, frames, mode],
  );

  const handleImportTactic = useCallback((onSuccess: () => void) => {
    importTacticFromFile(
      (tactic) => {
        const tacticsJson = localStorage.getItem(TACTICS_STORAGE_KEY);
        const tactics: Tactic[] = tacticsJson ? JSON.parse(tacticsJson) : [];
        const existing = tactics.find((t) => t.name === tactic.name);

        if (existing) {
          setOverwriteConfirm({
            message: `A tactic named "${tactic.name}" already exists. Do you want to overwrite it?`,
            onConfirm: () => {
              writeTacticToStorage(tactic);
              setOverwriteConfirm(null);
              onSuccess();
            },
            onCancel: () => {
              setOverwriteConfirm(null);
            },
          });
        } else {
          writeTacticToStorage(tactic);
          onSuccess();
        }
      },
      (error) => {
        // This could be improved with an error modal in the future
        console.error(`Error importing tactic: ${error}`);
      },
    );
  }, []);

  const handleLoadTactic = useCallback(
    (tactic: Tactic) => {
      setPaths(tactic.paths);
      
      // Sanitize frames to ensure all properties exist and are arrays
      const sanitizedFrames = tactic.frames.map(frame => ({
        ...frame,
        redTeam: Array.isArray(frame.redTeam) ? frame.redTeam : [],
        blueTeam: Array.isArray(frame.blueTeam) ? frame.blueTeam : [],
        balls: Array.isArray(frame.balls) ? frame.balls : INITIAL_BALLS
      }));
      
      setFrames(sanitizedFrames);
      setCurrentFrame(0);
      setPlaybackState('idle');
      // Load field type if present, default to standard
      if (tactic.fieldType) {
        setFieldType(tactic.fieldType);
      }
      if (sanitizedFrames.length > 0) {
        const firstFrame = sanitizedFrames[0];
        setBoardState(firstFrame);
        // Set mode from loaded frame if present
        if (firstFrame.mode) {
          setMode(firstFrame.mode);
        }
      }
      setIsLoadModalOpen(false);
    },
    [setBoardState],
  );

  const transformPositionForPortrait = useCallback((position: Position): Position => {
    // Corresponds to a 90-degree clockwise rotation of the field content.
    return {
      x: 100 - position.y,
      y: position.x,
    };
  }, []);

  // Board state for command execution
  const boardState = useMemo<BoardState>(
    () => ({
      redTeam,
      blueTeam,
      balls,
      mode,
    }),
    [redTeam, blueTeam, balls, mode]
  );

  const handleLoadSavedTactic = useCallback(
    (savedTactic: SavedTactic) => {
      // Convert SavedTactic to moves and apply to board
      const moves = savedTacticToMoves(savedTactic, boardState);
      
      // Apply each move to the board
      moves.forEach((move) => {
        handlePieceMove(move.targetId, move.newPosition, true);
      });
    },
    [boardState, handlePieceMove]
  );

  const handleEditTactic = useCallback(
    (tactic: SavedTactic) => {
      setEditingTactic(tactic);
      setIsEditTacticModalOpen(true);
    },
    []
  );

  const handleUpdateTactic = useCallback(
    async (id: string, name: string, tags: string[], type: 'single_team' | 'full_scenario', metadata?: SavedTactic['metadata']) => {
      try {
        await updateTactic(id, { name, tags, type, metadata });
        setIsEditTacticModalOpen(false);
        setEditingTactic(null);
        // Refresh playbook if it's open
        if (isPlaybookModalOpen) {
          // The PlaybookModal will refresh when it reopens
        }
      } catch (error) {
        console.error('Failed to update tactic:', error);
        alert('Failed to update tactic. Please try again.');
      }
    },
    [isPlaybookModalOpen]
  );

  // Command execution hook
  const currentFieldConfig = FIELD_CONFIGS[fieldType];
  const { executeCommand, isLoading: isCommandLoading, error: commandError, lastResult, clearError } =
    useCommandExecution({
      boardState,
      onPieceMove: handlePieceMove,
      onAddFrame: handleAddFrame,
      onResetBalls: handleResetBalls,
      fieldConfig: currentFieldConfig,
      mode,
      onModeChange: handleModeChange,
    });

  // Keyboard shortcut for command input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isSaveModalOpen ||
        isLoadModalOpen
      ) {
        return;
      }

      // `/` key to open command input
      if (e.key === '/' && !isCommandInputOpen) {
        e.preventDefault();
        setIsCommandInputOpen(true);
      }

      // Escape to close (handled in CommandInput component too)
      if (e.key === 'Escape' && isCommandInputOpen) {
        setIsCommandInputOpen(false);
        clearError();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandInputOpen, isSaveModalOpen, isLoadModalOpen, clearError]);

  const allPieces = useMemo(() => [...redTeam, ...blueTeam, ...balls], [redTeam, blueTeam, balls]);

  const transformedPieces = useMemo(() => {
    if (!isPortrait) return allPieces;
    return allPieces.map((p) => ({
      ...p,
      position: transformPositionForPortrait(p.position),
    }));
  }, [allPieces, isPortrait, transformPositionForPortrait]);

  const transformedPaths = useMemo(() => {
    if (!isPortrait) return paths;
    return paths.map((p) => ({
      ...p,
      points: p.points.map(transformPositionForPortrait),
    }));
  }, [paths, isPortrait, transformPositionForPortrait]);

  const renderConfirmationModal = () => {
    if (!overwriteConfirm) return null;
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        onClick={overwriteConfirm.onCancel}
      >
        <div
          className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Overwrite Tactic?</h2>
          <p className="text-gray-300 mb-6">{overwriteConfirm.message}</p>
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={overwriteConfirm.onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={overwriteConfirm.onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
            >
              Overwrite
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading screen while checking auth
  if (isAuthInitializing) {
    return (
      <div className="relative bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-900 text-white min-h-screen flex flex-col font-sans overflow-hidden">
      <HeaderToolbar
        onSave={() => setIsSaveModalOpen(true)}
        onLoad={() => setIsLoadModalOpen(true)}
        onReset={resetBoard}
        onAICommand={() => setIsCommandInputOpen(true)}
        fieldType={fieldType}
        onFieldTypeChange={setFieldType}
        mode={mode}
        onModeChange={handleModeChange}
        modeDescription={mode === "game" ? "11 v 11 Regulation" : "Training Session"}
        redTeamCount={redTeam.length}
        blueTeamCount={blueTeam.length}
        onOpenTeamSettings={() => setIsTeamSettingsModalOpen(true)}
        onOpenPlaybook={() => setIsPlaybookModalOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Block board access if not authenticated */}
      {!user && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-gray-400 mb-2">Authentication Required</p>
            <p className="text-gray-500">Please sign in to use the Tactic Board</p>
          </div>
        </div>
      )}

      {user && (
      <div className="flex-1 flex flex-col items-center p-2 md:p-4 w-full overflow-y-auto">
        <div className="w-full flex-1 flex items-center justify-center min-h-0">
          <div
            ref={boardRef}
            className={`relative w-full max-w-5xl border-4 border-white overflow-hidden shadow-2xl shrink-0 ${isPortrait ? 'aspect-[550/914]' : 'aspect-[914/550]'
              }`}
          >
            <div
              className={`absolute inset-0 bg-green-700 bg-cover bg-center transition-transform duration-300 ease-in-out
                  ${isPortrait ? 'rotate-90 scale-[1.67]' : ''}`}
              style={{
                backgroundImage: `url('${currentFieldConfig.imageUrl}')`,
              }}
            />
            <DrawingCanvas
              isDrawingMode={isDrawingMode}
              drawingTool={drawingTool}
              paths={transformedPaths}
              onAddPath={handleAddPath}
              color={drawingColor}
              strokeWidth={strokeWidth / 10}
            />
            {transformedPieces.map((piece) => (
              <Piece
                key={piece.id}
                piece={piece}
                onMove={handlePieceMove}
                containerRef={boardRef}
                animationSpeed={animationSpeed}
              />
            ))}
          </div>
        </div>

        <div className="w-full max-w-6xl mt-4 z-30">
          <Controls
            isDrawingMode={isDrawingMode}
            setIsDrawingMode={setIsDrawingMode}
            drawingTool={drawingTool}
            setDrawingTool={setDrawingTool}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            undoLastPath={undoLastPath}
            clearAllPaths={clearAllPaths}
            canUndo={paths.length > 0}
            canClear={paths.length > 0}
            onAddFrame={handleAddFrame}
            onPlay={handlePlay}
            onGoToFrame={handleGoToFrame}
            frameCount={frames.length}
            currentFrame={currentFrame}
            playbackState={playbackState}
            animationSpeed={animationSpeed}
            setAnimationSpeed={setAnimationSpeed}
          />
        </div>
      </div>
      )}

      <SaveTacticModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTactic}
        title="Save Tactic"
        confirmButtonText="Save"
        placeholderText="e.g., High Press Formation"
        boardState={boardState}
      />
      <LoadTacticModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoad={handleLoadTactic}
        onExport={exportTacticToFile}
        onImport={handleImportTactic}
      />
      <PlaybookModal
        isOpen={isPlaybookModalOpen}
        onClose={() => setIsPlaybookModalOpen(false)}
        onLoadTactic={handleLoadSavedTactic}
        onEditTactic={handleEditTactic}
      />
      <EditTacticModal
        isOpen={isEditTacticModalOpen}
        onClose={() => {
          setIsEditTacticModalOpen(false);
          setEditingTactic(null);
        }}
        onSave={handleUpdateTactic}
        tactic={editingTactic}
      />
      <TeamSettingsModal
        isOpen={isTeamSettingsModalOpen}
        onClose={() => setIsTeamSettingsModalOpen(false)}
        mode={mode}
        redTeam={redTeam}
        blueTeam={blueTeam}
        onAddPlayer={handleAddPlayer}
        onRemovePlayer={handleRemovePlayer}
        onPresetChange={handlePresetChange}
      />
      {renderConfirmationModal()}
      <CommandInput
        isVisible={isCommandInputOpen}
        onClose={() => {
          setIsCommandInputOpen(false);
          clearError();
        }}
        onExecute={executeCommand}
        isLoading={isCommandLoading}
        error={commandError}
        lastExplanation={lastResult?.explanation}
        disabled={isDrawingMode || playbackState === 'playing'}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        required={!user} // Required if user is not authenticated
      />
    </div>
  );
};

export default App;
