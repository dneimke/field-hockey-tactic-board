import React, { useState, useRef } from "react";
import { Position, Path } from "../types";
import { COLORS } from "../constants";

interface DrawingCanvasProps {
  isDrawingMode: boolean;
  drawingTool: "freehand" | "arrow";
  paths: Path[];
  onAddPath: (path: Omit<Path, "id">) => void;
  color: string;
  strokeWidth: number;
  lineStyle?: "solid" | "dashed";
}

const pointsToPathData = (points: Position[]): string => {
  if (points.length < 1) return "";
  const command = (point: Position) => `${point.x} ${point.y}`;
  const d = points
    .slice(1)
    .map((p) => `L ${command(p)}`)
    .join(" ");
  return `M ${command(points[0])} ${d}`;
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawingMode,
  drawingTool,
  paths,
  onAddPath,
  color,
  strokeWidth,
  lineStyle = "solid",
}) => {
  const [currentPoints, setCurrentPoints] = useState<Position[]>([]);
  const isDrawing = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const getPoint = (e: React.PointerEvent<SVGSVGElement>): Position | null => {
    const svg = svgRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // The incoming paths are already transformed, so we don't need to check orientation here.
    // The raw pointer events are relative to the rendered (potentially non-rotated) canvas.
    return {
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingMode || e.button !== 0) return;
    isDrawing.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const point = getPoint(e);
    if (point) {
      if (drawingTool === "arrow") {
        setCurrentPoints([point, point]);
      } else {
        setCurrentPoints([point]);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingMode || !isDrawing.current) return;

    const point = getPoint(e);
    if (point) {
      if (drawingTool === "arrow") {
        setCurrentPoints((prev) => [prev[0], point]);
      } else {
        setCurrentPoints((prev) => [...prev, point]);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingMode || !isDrawing.current) return;
    isDrawing.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (currentPoints.length > 1) {
      onAddPath({
        type: drawingTool,
        points: currentPoints,
        color,
        strokeWidth,
        style: lineStyle,
      });
    }
    setCurrentPoints([]);
  };

  const svgStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 40,
    touchAction: "none",
    pointerEvents: isDrawingMode ? "auto" : "none",
    cursor: isDrawingMode ? "crosshair" : "default",
  };

  const renderPath = (path: Omit<Path, "id">, key?: string) => {
    const pathProps = {
      d: pointsToPathData(path.points),
      stroke: path.color,
      strokeWidth: path.strokeWidth,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      strokeDasharray: path.style === "dashed" ? "1, 1" : undefined,
      fill: "none",
      markerEnd:
        path.type === "arrow"
          ? `url(#arrowhead-${path.color.replace("#", "")})`
          : undefined,
    };
    return <path key={key} {...pathProps} />;
  };

  return (
    <svg
      ref={svgRef}
      style={svgStyle}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <defs>
        {COLORS.map((c) => (
          <marker
            key={c}
            id={`arrowhead-${c.replace("#", "")}`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
          </marker>
        ))}
      </defs>

      {paths.map((path) => renderPath(path, path.id))}

      {currentPoints.length > 1 &&
        renderPath({
          type: drawingTool,
          points: currentPoints,
          color: color,
          strokeWidth: strokeWidth,
          style: lineStyle,
        })}
    </svg>
  );
};

export default DrawingCanvas;
