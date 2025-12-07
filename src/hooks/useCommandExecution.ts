import { useState, useCallback } from 'react';
import { BoardState, CommandResult, Position, Message } from '../types';
import { interpretCommand } from '../utils/commandInterpreter';
import { calculateTacticalPositions } from '../utils/positionCalculator';
import { resolveTrainingSession } from '../utils/trainingSessionResolver';
import { FieldConfig } from '../config/fieldConfig';

export interface UseCommandExecutionProps {
  boardState: BoardState;
  onPieceMove: (id: string, position: Position, isStandardCoordinates?: boolean) => void;
  onAddFrame?: () => void;
  onResetBalls?: () => void;
  onSetEquipment?: (equipment: any[]) => void;
  fieldConfig?: FieldConfig;
  mode?: "game" | "training";
  onModeChange?: (mode: "game" | "training") => void;
}

interface CommandExecutionState {
  isLoading: boolean;
  error: string | null;
  lastResult: CommandResult | null;
}

export const useCommandExecution = ({
  boardState,
  onPieceMove,
  onAddFrame,
  onResetBalls,
  onSetEquipment,
  fieldConfig,
  mode,
  onModeChange,
}: UseCommandExecutionProps) => {
  const [state, setState] = useState<CommandExecutionState>({
    isLoading: false,
    error: null,
    lastResult: null,
  });

  const executeCommand = useCallback(
    async (command: string, model?: string, history: Message[] = []) => {
      if (!command.trim()) {
        const errorMsg = 'Command cannot be empty';
        setState({ isLoading: false, error: errorMsg, lastResult: null });
        throw new Error(errorMsg);
      }

      setState({ isLoading: true, error: null, lastResult: null });

      try {
        const result = await interpretCommand(command, boardState, model, fieldConfig, mode, history);

        let movesToExecute: Array<{ targetId: string; newPosition: Position }> = [];

        // Handle Training Session (Unified Field Model)
        if (result.action === 'training_session') {
          // Use the resolver to get moves and equipment
          const resolution = resolveTrainingSession(result.request, boardState);
          movesToExecute = resolution.moves;
          
          // Set equipment state
          if (onSetEquipment) {
            onSetEquipment(resolution.equipment);
          }
          
          // Equipment moves are handled by setting state (above) 
          // and potentially by movesToExecute if we want to animate them moving
          // For now, just setting state is enough as they will re-render at new positions
        }
        // Handle Tactical Actions
        else if (result.action === 'set_piece' || result.action === 'drill' || result.action === 'tactical_phase') {
          movesToExecute = calculateTacticalPositions(result, boardState);
        } 
        // Handle Standard Actions
        else {
          if ('moves' in result) {
            movesToExecute = result.moves;
          }

          // Handle Reset Action
          if (result.action === 'reset' && onResetBalls) {
            onResetBalls();
          }
        }

        // Execute the moves
        // Pass true to indicate positions are already in standard coordinates
        for (const move of movesToExecute) {
          onPieceMove(move.targetId, move.newPosition, true);
        }

        // Optionally add a frame after command execution
        if (onAddFrame && movesToExecute.length > 0) {
          // Small delay to ensure state updates are processed
          setTimeout(() => {
            onAddFrame();
          }, 100);
        }

        setState({
          isLoading: false,
          error: null,
          lastResult: result,
        });

        // Automatic mode switching based on command action type
        if (onModeChange) {
          const explanation = result.explanation || '';
          const isSavedTactic = explanation.includes('Loaded saved tactic') || explanation.includes('Loaded from saved tactic');
          
          // Don't change mode if result came from saved tactic (they're already game tactics)
          if (!isSavedTactic) {
            if (result.action === 'drill' || result.action === 'training_session') {
              // Drill commands → switch to training mode
              onModeChange('training');
            } else if (result.action === 'set_piece' || result.action === 'tactical_phase') {
              // Tactical commands → switch to game mode
              onModeChange('game');
            }
          }
        }

        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to execute command';
        setState({
          isLoading: false,
          error: errorMessage,
          lastResult: null,
        });
        throw new Error(errorMessage);
      }
    },
    [boardState, onPieceMove, onAddFrame, onResetBalls, onSetEquipment, fieldConfig, mode, onModeChange]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    executeCommand,
    isLoading: state.isLoading,
    error: state.error,
    lastResult: state.lastResult,
    clearError,
  };
};
