import { useState, useCallback } from 'react';
import { BoardState, CommandResult, Position } from '../types';
import { interpretCommand } from '../utils/commandInterpreter';
import { calculateTacticalPositions } from '../utils/positionCalculator';
import { FieldConfig } from '../config/fieldConfig';

interface UseCommandExecutionProps {
  boardState: BoardState;
  onPieceMove: (id: string, position: Position, isStandardCoordinates?: boolean) => void;
  onAddFrame?: () => void;
  onResetBalls?: () => void;
  fieldConfig?: FieldConfig;
  mode?: "game" | "training";
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
  fieldConfig,
  mode,
}: UseCommandExecutionProps) => {
  const [state, setState] = useState<CommandExecutionState>({
    isLoading: false,
    error: null,
    lastResult: null,
  });

  const executeCommand = useCallback(
    async (command: string, model?: string) => {
      if (!command.trim()) {
        setState({ isLoading: false, error: 'Command cannot be empty', lastResult: null });
        return;
      }

      setState({ isLoading: true, error: null, lastResult: null });

      try {
        const result = await interpretCommand(command, boardState, model, fieldConfig, mode);

        let movesToExecute: Array<{ targetId: string; newPosition: Position }> = [];

        // Handle Tactical Actions
        if (result.action === 'set_piece' || result.action === 'drill' || result.action === 'tactical_phase') {
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to execute command';
        setState({
          isLoading: false,
          error: errorMessage,
          lastResult: null,
        });
      }
    },
    [boardState, onPieceMove, onAddFrame, onResetBalls, fieldConfig, mode]
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

