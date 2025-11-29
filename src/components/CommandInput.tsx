import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CommandInputProps {
  isVisible: boolean;
  onClose: () => void;
  onExecute: (command: string) => void;
  isLoading: boolean;
  error: string | null;
  lastExplanation?: string;
  disabled?: boolean;
}

import PromptHelp from './PromptHelp';

const CommandInput: React.FC<CommandInputProps> = ({
  isVisible,
  onClose,
  onExecute,
  isLoading,
  error,
  lastExplanation,
  disabled = false,
}) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      // Escape to close
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
          e.stopPropagation(); // Prevent closing the main dialog
          return;
        }
        onClose();
        return;
      }

      // Arrow up/down for history
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (history.length === 0) return;

        let newIndex = historyIndex;
        if (e.key === 'ArrowUp') {
          newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        } else {
          newIndex = historyIndex === -1 ? -1 : Math.min(history.length - 1, historyIndex + 1);
        }

        setHistoryIndex(newIndex);
        if (newIndex >= 0) {
          setCommand(history[newIndex]);
        } else {
          setCommand('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, history, historyIndex, onClose, showHelp]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!command.trim() || isLoading || disabled) return;

      const trimmedCommand = command.trim();

      // Add to history
      setHistory((prev) => {
        const newHistory = [trimmedCommand, ...prev.filter((c) => c !== trimmedCommand)].slice(0, 10);
        return newHistory;
      });
      setHistoryIndex(-1);
      setCommand('');
      setShowHelp(false);

      onExecute(trimmedCommand);
    },
    [command, isLoading, disabled, onExecute]
  );

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 border border-gray-700 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">AI Command</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 relative">
          <PromptHelp
            isVisible={showHelp}
            onClose={() => setShowHelp(false)}
            onSelectExample={(example) => {
              setCommand(example);
              setShowHelp(false);
              inputRef.current?.focus();
            }}
          />

          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => {
                  setCommand(e.target.value);
                  setHistoryIndex(-1);
                }}
                placeholder="Type a command..."
                className="w-full bg-gray-700 text-white rounded-md px-4 py-3 pr-12 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                disabled={isLoading || disabled}
                autoComplete="off"
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="animate-spin h-5 w-5 text-indigo-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="px-3 bg-gray-700 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
              title="Show Examples"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-sm">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {lastExplanation && !error && (
            <div className="mt-3 p-3 bg-green-900/30 border border-green-700 rounded-md text-green-200 text-sm">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>{lastExplanation}</div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Press <kbd className="px-2 py-1 bg-gray-700 rounded">Enter</kbd> to execute,{' '}
              <kbd className="px-2 py-1 bg-gray-700 rounded">↑↓</kbd> for history,{' '}
              <kbd className="px-2 py-1 bg-gray-700 rounded">Esc</kbd> to close
            </div>
            <button
              type="submit"
              disabled={!command.trim() || isLoading || disabled}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors"
            >
              {isLoading ? 'Processing...' : 'Execute'}
            </button>
          </div>
        </form>

        {history.length > 0 && (
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-400 mb-2">Recent commands:</div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 5).map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCommand(cmd);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-md transition-colors"
                >
                  {cmd.length > 30 ? `${cmd.substring(0, 30)}...` : cmd}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandInput;


