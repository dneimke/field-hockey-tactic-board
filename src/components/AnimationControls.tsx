import React from "react";

interface AnimationControlsProps {
  onAddFrame: () => void;
  onPlay: () => void;
  onGoToFrame: (frameIndex: number) => void;
  frameCount: number;
  currentFrame: number;
  playbackState: "idle" | "playing";
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
}

const ControlButton: React.FC<
  React.PropsWithChildren<{
    onClick: () => void;
    disabled?: boolean;
    title: string;
    className?: string;
  }>
> = ({ onClick, disabled = false, title, children, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={`p-1.5 md:p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const AnimationControls: React.FC<AnimationControlsProps> = ({
  onAddFrame,
  onPlay,
  onGoToFrame,
  frameCount,
  currentFrame,
  playbackState,
  animationSpeed,
  setAnimationSpeed,
}) => {
  const hasFrames = frameCount > 0;
  const canPlay = frameCount > 1;

  return (
    <div className="w-full max-w-5xl p-1 md:p-2 bg-gray-800 rounded-lg flex flex-wrap gap-2 md:gap-4 items-center justify-center">
      <ControlButton
        onClick={onAddFrame}
        title="Add current positions as a new frame"
        className="flex items-center"
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
        <span className="ml-2 font-semibold hidden md:inline">Add Frame</span>
      </ControlButton>

      {canPlay && (
        <>
          <div className="hidden md:block h-8 w-px bg-gray-600"></div>

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

          <div className="flex items-center gap-2">
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
              className="w-20 sm:w-32 md:w-48 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
              title="Scrub through frames"
            />
            <span className="text-sm font-mono bg-gray-900 px-2 py-1 rounded">
              {hasFrames ? `${currentFrame + 1}/${frameCount}` : "0/0"}
            </span>
          </div>

          <div className="hidden md:block h-8 w-px bg-gray-600"></div>

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
      )}
    </div>
  );
};

export default AnimationControls;
