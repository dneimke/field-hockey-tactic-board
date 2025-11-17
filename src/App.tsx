// Fix: Implement the main App component to serve as the entry point and state manager for the application.
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import Piece from "./components/Piece";
import DrawingCanvas from "./components/DrawingCanvas";
import Controls from "./components/Controls";
import SaveTacticModal from "./components/SaveTacticModal";
import LoadTacticModal from "./components/LoadTacticModal";
import MainMenu from "./components/MainMenu";
import { INITIAL_RED_TEAM, INITIAL_BLUE_TEAM, INITIAL_BALL } from "./constants";
import { Player, Ball, Position, Path, Tactic, BoardState } from "./types";
import { v4 as uuidv4 } from "uuid";
import { useMediaQuery } from "./hooks/useMediaQuery";

const TACTICS_STORAGE_KEY = "hockey_tactics";

const exportTacticToFile = (tactic: Tactic) => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(tactic, null, 2)
  )}`;
  const link = document.createElement("a");
  link.href = jsonString;
  link.download = `${tactic.name.replace(/\s+/g, "_").toLowerCase()}.json`;

  // The link must be added to the DOM for the click to work in some browsers
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const importTacticFromFile = (
  onSuccess: (tactic: Tactic) => void,
  onError: (error: string) => void
) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          throw new Error("File content is not a string.");
        }
        const tactic = JSON.parse(text);
        if (
          tactic &&
          typeof tactic.name === "string" &&
          Array.isArray(tactic.frames) &&
          Array.isArray(tactic.paths)
        ) {
          onSuccess(tactic);
        } else {
          throw new Error("Invalid tactic file format.");
        }
      } catch (err) {
        onError((err as Error).message);
      }
    };
    reader.onerror = () => {
      onError("Failed to read the file.");
    };
    reader.readAsText(file);
  };
  input.click();
};

const App: React.FC = () => {
  const [redTeam, setRedTeam] = useState<Player[]>(INITIAL_RED_TEAM);
  const [blueTeam, setBlueTeam] = useState<Player[]>(INITIAL_BLUE_TEAM);
  const [ball, setBall] = useState<Ball>(INITIAL_BALL);
  const [paths, setPaths] = useState<Path[]>([]);

  // Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<"freehand" | "arrow">(
    "freehand"
  );
  const [drawingColor] = useState("#FFFFFF");
  const [strokeWidth, setStrokeWidth] = useState(4);

  // Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [overwriteConfirm, setOverwriteConfirm] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Animation State
  const [frames, setFrames] = useState<BoardState[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackState, setPlaybackState] = useState<"idle" | "playing">(
    "idle"
  );
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const animationInterval = useRef<number | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);

  const isPortrait = useMediaQuery(
    "(orientation: portrait) and (max-width: 768px)"
  );

  const setBoardState = useCallback((state: BoardState) => {
    setRedTeam(state.redTeam);
    setBlueTeam(state.blueTeam);
    setBall(state.ball);
  }, []);

  const handlePieceMove = useCallback(
    (id: string, position: Position) => {
      if (isDrawingMode || playbackState === "playing") return;

      let finalPosition = position;
      if (isPortrait) {
        // Reverse the transformation for saving state
        finalPosition = {
          x: position.y,
          y: 100 - position.x,
        };
      }

      const updatePiece = (
        setter: React.Dispatch<React.SetStateAction<any[]>>
      ) =>
        setter((team) =>
          team.map((p) => (p.id === id ? { ...p, position: finalPosition } : p))
        );

      if (id === "ball") {
        setBall((b) => ({ ...b, position: finalPosition }));
      } else {
        updatePiece(setRedTeam);
        updatePiece(setBlueTeam);
      }
    },
    [isDrawingMode, playbackState, isPortrait]
  );

  const handleAddPath = useCallback(
    (path: Omit<Path, "id">) => {
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
    [isPortrait]
  );

  const undoLastPath = useCallback(
    () => setPaths((prev) => prev.slice(0, -1)),
    []
  );
  const clearAllPaths = useCallback(() => setPaths([]), []);

  const resetBoard = useCallback(() => {
    setRedTeam(INITIAL_RED_TEAM);
    setBlueTeam(INITIAL_BLUE_TEAM);
    setBall(INITIAL_BALL);
    clearAllPaths();
    setFrames([]);
    setCurrentFrame(0);
    setPlaybackState("idle");
  }, [clearAllPaths]);

  // Animation Handlers
  const handleAddFrame = useCallback(() => {
    const newFrame: BoardState = { redTeam, blueTeam, ball };
    setFrames((prev) => [...prev, newFrame]);
  }, [redTeam, blueTeam, ball]);

  const handleGoToFrame = useCallback(
    (frameIndex: number) => {
      if (frameIndex >= 0 && frameIndex < frames.length) {
        setCurrentFrame(frameIndex);
        setBoardState(frames[frameIndex]);
      }
    },
    [frames, setBoardState]
  );

  const handlePlay = useCallback(() => {
    if (frames.length < 2) return;

    if (playbackState === "playing") {
      // PAUSE
      setPlaybackState("idle");
      if (animationInterval.current) clearInterval(animationInterval.current);
      return;
    }

    setPlaybackState("playing");
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
        setPlaybackState("idle");
        setCurrentFrame(frames.length - 1);
      } else {
        handleGoToFrame(frame);
      }
    }, 2250 / animationSpeed);
  }, [
    frames.length,
    currentFrame,
    playbackState,
    handleGoToFrame,
    animationSpeed,
  ]);

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
    (name: string) => {
      let framesToSave = frames;
      if (frames.length === 0) {
        framesToSave = [{ redTeam, blueTeam, ball }];
      }

      const newTactic: Tactic = {
        name,
        frames: framesToSave,
        paths,
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
    [redTeam, blueTeam, ball, paths, frames]
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
      }
    );
  }, []);

  const handleLoadTactic = useCallback(
    (tactic: Tactic) => {
      setPaths(tactic.paths);
      setFrames(tactic.frames);
      setCurrentFrame(0);
      setPlaybackState("idle");
      if (tactic.frames.length > 0) {
        setBoardState(tactic.frames[0]);
      }
      setIsLoadModalOpen(false);
    },
    [setBoardState]
  );

  const transformPositionForPortrait = useCallback(
    (position: Position): Position => {
      // Corresponds to a 90-degree clockwise rotation of the field content.
      return {
        x: 100 - position.y,
        y: position.x,
      };
    },
    []
  );

  const allPieces = useMemo(
    () => [...redTeam, ...blueTeam, ball],
    [redTeam, blueTeam, ball]
  );

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
          <h2 className="text-2xl font-bold mb-4 text-white">
            Overwrite Tactic?
          </h2>
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

  return (
    <div className="relative bg-gray-900 text-white min-h-screen flex flex-col items-center p-2 md:p-4 font-sans">
      <MainMenu
        onSave={() => setIsSaveModalOpen(true)}
        onLoad={() => setIsLoadModalOpen(true)}
        onReset={resetBoard}
      />

      <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-center">
        Field Hockey Tactic Board
      </h1>

      <div className="w-full flex-1 flex items-center justify-center">
        <div
          ref={boardRef}
          className={`relative w-full max-w-5xl border-4 border-white overflow-hidden shadow-2xl ${
            isPortrait ? "aspect-[68/105]" : "aspect-[105/68]"
          }`}
        >
          <div
            className={`absolute inset-0 bg-green-700 bg-cover bg-center bg-[url('https://storage.googleapis.com/hostinger-horizons-assets-prod/7f3aa00e-4765-4224-a301-9c51b8d05496/492a3643c0b46d7745057a94978fd3e8.webp')] transition-transform duration-300 ease-in-out
                ${isPortrait ? "rotate-90 scale-[1.55]" : ""}`}
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

      <div className="w-full max-w-6xl mt-auto py-2 z-40">
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

      <SaveTacticModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTactic}
        title="Save Tactic"
        confirmButtonText="Save"
        placeholderText="e.g., High Press Formation"
      />
      <LoadTacticModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoad={handleLoadTactic}
        onExport={exportTacticToFile}
        onImport={handleImportTactic}
      />
      {renderConfirmationModal()}
    </div>
  );
};

export default App;
