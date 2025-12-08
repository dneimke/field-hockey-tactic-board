import React from "react";

interface DrawingControlsProps {
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
    "p-1.5 md:p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500";
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

const DrawingControls: React.FC<DrawingControlsProps> = ({
  isDrawingMode,
  setIsDrawingMode,
  drawingTool,
  setDrawingTool,
  undoLastPath,
  clearAllPaths,
  canUndo,
  canClear,
}) => {
  return (
    <div className="w-full max-w-5xl p-1 md:p-2 bg-gray-800 rounded-lg flex flex-wrap gap-2 md:gap-4 items-center justify-center">
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

      <div className="hidden md:block h-8 w-px bg-gray-600"></div>

      {isDrawingMode && (
        <>
          <div className="flex items-center gap-1 md:gap-2 bg-gray-700 rounded-md p-1">
            <ControlButton
              onClick={() => setDrawingTool("freehand")}
              isActive={drawingTool === "freehand"}
              title="Freehand Tool"
              className="bg-transparent hover:bg-gray-600"
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
              className="bg-transparent hover:bg-gray-600"
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
          </div>

          <div className="hidden md:block h-8 w-px bg-gray-600"></div>

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
        </>
      )}
    </div>
  );
};

export default DrawingControls;
