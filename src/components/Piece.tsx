import React, { useRef } from "react";
import { Player, Ball, PieceType, Position } from "../types";
import { useDraggable } from "../hooks/useDraggable";

interface PieceProps {
  piece: PieceType;
  onMove: (id: string, position: Position) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  animationSpeed: number;
}

const isPlayer = (piece: PieceType): piece is Player => {
  return "team" in piece;
};

const Piece: React.FC<PieceProps> = ({
  piece,
  onMove,
  containerRef,
  animationSpeed,
}) => {
  const pieceRef = useRef<HTMLDivElement>(null);

  const handleMove = (position: Position) => {
    onMove(piece.id, position);
  };

  const { isDragging, handlePointerDown } = useDraggable({
    onMove: handleMove,
    containerRef,
    nodeRef: pieceRef,
  });

  const player = isPlayer(piece) ? piece : null;
  const ball = !isPlayer(piece) ? piece : null;

  const baseClasses =
    "absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold shadow-lg select-none touch-none";
  const draggingClasses = isDragging
    ? "cursor-grabbing scale-110 z-20"
    : "cursor-grab z-10 hover:scale-105";

  // Added transition for smooth animation
  const animationClasses = "transition-all ease-in-out";

  let specificClasses = "";
  if (player) {
    const teamColor =
      player.team === "red"
        ? "bg-red-600 border-red-800"
        : "bg-blue-600 border-blue-800";
    specificClasses = `w-6 h-6 md:w-8 md:h-8 text-white text-xs md:text-sm border-2 ${teamColor}`;
  } else if (ball) {
    specificClasses =
      "w-3 h-3 md:w-4 md:h-4 bg-white border-2 border-gray-400 z-30";
  }

  const transitionDuration = 1500 / animationSpeed;

  return (
    <div
      ref={pieceRef}
      onPointerDown={handlePointerDown}
      className={`${baseClasses} ${specificClasses} ${draggingClasses} ${animationClasses}`}
      style={{
        left: `${piece.position.x}%`,
        top: `${piece.position.y}%`,
        transitionDuration: isDragging ? "0ms" : `${transitionDuration}ms`,
      }}
    >
      {player && <span>{player.number}</span>}
    </div>
  );
};

export default Piece;
