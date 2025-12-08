import React from "react";

interface ControlsProps {
  onAddFrame: () => void;
  onPlay: () => void;
  onGoToFrame: (frameIndex: number) => void;
  frameCount: number;
  currentFrame: number;
  playbackState: "idle" | "playing";
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  isDrawingMode: boolean;
  setIsDrawingMode: (isDrawing: boolean) => void;
  drawingTool: "freehand" | "arrow";
  setDrawingTool: (tool: "freehand" | "arrow") => void;
  undoLastPath: () => void;
  clearAllPaths: () => void;
  canUndo: boolean;
  canClear: boolean;
}

const ControlButton: React.FC<
  React.PropsWithChildren<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    className?: string;
  }>
> = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  className = "",
}) => {
  const baseClasses =
    "p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500";
  const activeClasses = isActive
    ? "bg-indigo-600 text-white"
    : "bg-gray-700 hover:bg-gray-600";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${baseClasses} ${activeClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const Controls: React.FC<ControlsProps> = ({
  onAddFrame,
  onPlay,
  onGoToFrame,
  frameCount,
  currentFrame,
  playbackState,
  animationSpeed,
  setAnimationSpeed,
  isDrawingMode,
  setIsDrawingMode,
  drawingTool,
  setDrawingTool,
  undoLastPath,
  clearAllPaths,
  canUndo,
  canClear,
}) => {
  const hasFrames = frameCount > 0;
  const canPlay = frameCount > 1;

  return (
    <div className="w-full p-2 bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-xl flex flex-wrap gap-x-4 gap-y-2 items-center justify-center shadow-lg">
      <ControlButton
        onClick={onAddFrame}
        title="Add current positions as a new frame"
        className="flex items-center !bg-indigo-600 hover:!bg-indigo-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="ml-2 font-semibold hidden sm:inline">Add Frame</span>
      </ControlButton>

      <div className="h-8 w-px bg-gray-600"></div>

      {/* Playback & Timeline */}
      {canPlay ? (
        <>
          <div className="flex items-center gap-2">
            <ControlButton
              onClick={() => onGoToFrame(0)}
              disabled={!hasFrames}
              title="Reset to first frame"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </ControlButton>
            <ControlButton
              onClick={onPlay}
              disabled={!canPlay}
              title={playbackState === "playing" ? "Pause" : "Play"}
            >
              {playbackState === "playing" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                </svg>
              )}
            </ControlButton>
          </div>
          <div className="flex items-center gap-2 flex-grow min-w-[160px] sm:min-w-[240px]">
            <span className="text-sm font-semibold text-gray-300 hidden sm:inline">
              Frame:
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(0, frameCount - 1)}
              value={currentFrame}
              onChange={(e) => onGoToFrame(Number(e.target.value))}
              disabled={!hasFrames}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
              title="Scrub through frames"
            />
            <span className="text-sm font-mono bg-gray-900 px-2 py-1 rounded">
              {hasFrames ? `${currentFrame + 1}/${frameCount}` : "0/0"}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-gray-700 rounded-md p-1">
            {[1, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => setAnimationSpeed(speed)}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${
                  animationSpeed === speed
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-600"
                }`}
                title={`Set speed to ${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-400 px-4 flex-grow text-center">
          Add a frame to start animating
        </div>
      )}

      <div className="h-8 w-px bg-gray-600"></div>

      {/* Drawing Tools */}
      <div className="flex items-center gap-2">
        <ControlButton
          onClick={() => setIsDrawingMode(!isDrawingMode)}
          isActive={isDrawingMode}
          title={isDrawingMode ? "Disable Drawing Mode" : "Enable Drawing Mode"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
            />
          </svg>
        </ControlButton>

        {isDrawingMode && (
          <div className="flex items-center gap-1 p-1 bg-gray-700 rounded-md">
            <ControlButton
              onClick={() => setDrawingTool("freehand")}
              isActive={drawingTool === "freehand"}
              title="Freehand Tool"
              className="bg-transparent hover:bg-gray-600 p-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </ControlButton>
            <ControlButton
              onClick={() => setDrawingTool("arrow")}
              isActive={drawingTool === "arrow"}
              title="Arrow Tool"
              className="bg-transparent hover:bg-gray-600 p-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </ControlButton>
            <div className="h-6 w-px bg-gray-500 mx-1"></div>
            <ControlButton
              onClick={undoLastPath}
              disabled={!canUndo}
              title="Undo Last Drawing"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4"
                />
              </svg>
            </ControlButton>

            <ControlButton
              onClick={clearAllPaths}
              disabled={!canClear}
              title="Clear All Drawings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </ControlButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Controls;
