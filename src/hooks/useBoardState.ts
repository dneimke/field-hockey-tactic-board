import { useState, useCallback } from 'react';
import { Player, Ball, Path, BoardState, FieldType, Position } from '../types';
import { INITIAL_RED_TEAM, INITIAL_BLUE_TEAM, INITIAL_BALLS } from '../constants';
import { addPlayer as addPlayerUtil, removePlayer as removePlayerUtil, createInitialTeam } from '../utils/playerManagement';
import { reversePortraitTransform } from '../utils/coordinateTransform';
import { v4 as uuidv4 } from 'uuid';
import { RED_PLAYER_PREFIX, BLUE_PLAYER_PREFIX, BALL_PREFIX } from '../constants';

export interface UseBoardStateOptions {
  isDrawingMode: boolean;
  playbackState: 'idle' | 'playing';
  isPortrait: boolean;
  mode: 'game' | 'training';
}

export interface UseBoardStateReturn {
  redTeam: Player[];
  blueTeam: Player[];
  balls: Ball[];
  paths: Path[];
  fieldType: FieldType;
  mode: 'game' | 'training';
  setRedTeam: React.Dispatch<React.SetStateAction<Player[]>>;
  setBlueTeam: React.Dispatch<React.SetStateAction<Player[]>>;
  setBalls: React.Dispatch<React.SetStateAction<Ball[]>>;
  setPaths: React.Dispatch<React.SetStateAction<Path[]>>;
  setFieldType: React.Dispatch<React.SetStateAction<FieldType>>;
  setMode: React.Dispatch<React.SetStateAction<'game' | 'training'>>;
  setBoardState: (state: BoardState) => void;
  handlePieceMove: (id: string, position: Position, isStandardCoordinates?: boolean) => void;
  handleResetBalls: () => void;
  handleAddPath: (path: Omit<Path, 'id'>) => void;
  undoLastPath: () => void;
  clearAllPaths: () => void;
  resetBoard: () => void;
  handleAddPlayer: (team: 'red' | 'blue') => void;
  handleRemovePlayer: (playerId: string) => void;
  handleModeChange: (newMode: 'game' | 'training') => void;
  handlePresetChange: (playerCount: number) => void;
  boardState: BoardState;
}

export const useBoardState = (
  options: UseBoardStateOptions
): UseBoardStateReturn => {
  const { isDrawingMode, playbackState, isPortrait, mode: initialMode } = options;
  
  const [redTeam, setRedTeam] = useState<Player[]>(INITIAL_RED_TEAM);
  const [blueTeam, setBlueTeam] = useState<Player[]>(INITIAL_BLUE_TEAM);
  const [balls, setBalls] = useState<Ball[]>(INITIAL_BALLS);
  const [paths, setPaths] = useState<Path[]>([]);
  const [mode, setMode] = useState<'game' | 'training'>(initialMode);
  const [fieldType, setFieldType] = useState<FieldType>('standard');

  const setBoardState = useCallback((state: BoardState) => {
    setRedTeam(Array.isArray(state.redTeam) ? state.redTeam : []);
    setBlueTeam(Array.isArray(state.blueTeam) ? state.blueTeam : []);
    setBalls(Array.isArray(state.balls) ? state.balls : INITIAL_BALLS);
    if (state.mode) {
      setMode(state.mode);
    }
  }, []);

  const handlePieceMove = useCallback(
    (id: string, position: Position, isStandardCoordinates: boolean = false) => {
      if (isDrawingMode || playbackState === 'playing') return;

      let finalPosition = position;
      // Only reverse transform if position is in display coordinates (from dragging)
      // Command execution provides positions already in standard coordinates
      if (!isStandardCoordinates && isPortrait) {
        finalPosition = reversePortraitTransform(position);
      }

      const updatePiece = (setter: React.Dispatch<React.SetStateAction<Player[]>>) =>
        setter((team) => team.map((p) => (p.id === id ? { ...p, position: finalPosition } : p)));

      if (id.startsWith(BALL_PREFIX)) {
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
          points: path.points.map((p) => reversePortraitTransform(p)),
        };
      }
      setPaths((prev) => [...prev, { ...finalPath, id: uuidv4() }]);
    },
    [isPortrait],
  );

  const undoLastPath = useCallback(() => setPaths((prev) => prev.slice(0, -1)), []);
  const clearAllPaths = useCallback(() => setPaths([]), []);

  const resetBoard = useCallback(() => {
    if (mode === 'game') {
      setRedTeam(INITIAL_RED_TEAM);
      setBlueTeam(INITIAL_BLUE_TEAM);
    } else {
      setRedTeam(INITIAL_RED_TEAM);
      setBlueTeam(INITIAL_BLUE_TEAM);
    }
    setBalls(INITIAL_BALLS);
    clearAllPaths();
  }, [clearAllPaths, mode]);

  const handleAddPlayer = useCallback(
    (team: 'red' | 'blue') => {
      if (mode === 'game') return; // Cannot add players in game mode

      const currentTeam = team === 'red' ? redTeam : blueTeam;
      const newPlayer = addPlayerUtil(currentTeam, team);
      const setter = team === 'red' ? setRedTeam : setBlueTeam;
      setter([...currentTeam, newPlayer]);
    },
    [mode, redTeam, blueTeam],
  );

  const handleRemovePlayer = useCallback(
    (playerId: string) => {
      if (mode === 'game') return; // Cannot remove players in game mode

      if (playerId.startsWith(RED_PLAYER_PREFIX)) {
        setRedTeam(removePlayerUtil(redTeam, playerId));
      } else if (playerId.startsWith(BLUE_PLAYER_PREFIX)) {
        setBlueTeam(removePlayerUtil(blueTeam, playerId));
      }
    },
    [mode, redTeam, blueTeam],
  );

  const handleModeChange = useCallback(
    (newMode: 'game' | 'training') => {
      if (newMode === mode) return;

      if (newMode === 'game') {
        // Switching to game mode: ensure 11 players per team
        setRedTeam(INITIAL_RED_TEAM);
        setBlueTeam(INITIAL_BLUE_TEAM);
      }
      // Switching to training mode: keep current players
      setMode(newMode);
    },
    [mode],
  );

  const handlePresetChange = useCallback(
    (playerCount: number) => {
      // Switch to training mode if not already
      if (mode !== 'training') {
        setMode('training');
      }

      // Create teams with specified player count
      // For presets, include goalkeepers
      const includeGK = playerCount >= 5; // Include GK for 5v5, 7v7, 11v11
      setRedTeam(createInitialTeam('red', playerCount, includeGK));
      setBlueTeam(createInitialTeam('blue', playerCount, includeGK));
    },
    [mode],
  );

  const boardState: BoardState = {
    redTeam,
    blueTeam,
    balls,
    mode,
  };

  return {
    redTeam,
    blueTeam,
    balls,
    paths,
    fieldType,
    mode,
    setRedTeam,
    setBlueTeam,
    setBalls,
    setPaths,
    setFieldType,
    setMode,
    setBoardState,
    handlePieceMove,
    handleResetBalls,
    handleAddPath,
    undoLastPath,
    clearAllPaths,
    resetBoard,
    handleAddPlayer,
    handleRemovePlayer,
    handleModeChange,
    handlePresetChange,
    boardState,
  };
};

