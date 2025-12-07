import React, { useRef } from 'react';
import { Player, PieceType, Position, Equipment, Ball } from '../types';
import { useDraggable } from '../hooks/useDraggable';

interface PieceProps {
  piece: PieceType;
  onMove: (id: string, position: Position) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  animationSpeed: number;
}

const isPlayer = (piece: PieceType): piece is Player => {
  return 'team' in piece;
};

const isBall = (piece: PieceType): piece is Ball => {
  return 'id' in piece && piece.id.startsWith('ball') && !('team' in piece) && !('type' in piece);
};

const isEquipment = (piece: PieceType): piece is Equipment => {
  return 'type' in piece && (piece.type === 'cone' || piece.type === 'mini_goal' || piece.type === 'coach');
};

const Piece: React.FC<PieceProps> = ({ piece, onMove, containerRef, animationSpeed }) => {
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
  const ball = isBall(piece) ? piece : null;
  const equipment = isEquipment(piece) ? piece : null;

  const baseClasses =
    'absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-bold shadow-lg select-none touch-none';
  const draggingClasses = isDragging
    ? 'cursor-grabbing scale-110 z-20'
    : 'cursor-grab z-10 hover:scale-105';

  // Added transition for smooth animation
  const animationClasses = 'transition-all ease-in-out';

  let specificClasses = '';
  let displayText: string | number = '';
  let customContent: React.ReactNode = null;
  
  if (player) {
    const roundedClasses = 'rounded-full';
    if (player.isGoalkeeper) {
      // Goalkeeper: distinct color and "GK" label
      const gkColor = 'bg-yellow-600 border-yellow-800';
      specificClasses = `w-6 h-6 md:w-8 md:h-8 text-white text-[10px] md:text-xs border-2 ${gkColor} ${roundedClasses}`;
      displayText = 'GK';
    } else {
      // Regular player: team colors
      const teamColor =
        player.team === 'red' ? 'bg-red-600 border-red-800' : 'bg-blue-600 border-blue-800';
      specificClasses = `w-6 h-6 md:w-8 md:h-8 text-white text-xs md:text-sm border-2 ${teamColor} ${roundedClasses}`;
      displayText = player.number;
    }
  } else if (ball) {
    specificClasses = 'w-3 h-3 md:w-4 md:h-4 bg-white border-2 border-gray-400 z-30 rounded-full';
  } else if (equipment) {
    const rotation = equipment.rotation || 0;
    const color = equipment.color || '#FFD700'; // Default yellow for cones
    
    if (equipment.type === 'cone') {
      // Cone: triangle shape
      specificClasses = 'w-4 h-4 md:w-5 md:h-5 z-25';
      customContent = (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 20 20"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <polygon
            points="10,2 18,18 2,18"
            fill={color}
            stroke="#000"
            strokeWidth="1"
          />
        </svg>
      );
    } else if (equipment.type === 'mini_goal') {
      // Mini goal: small rectangle
      specificClasses = 'w-6 h-4 md:w-8 md:h-5 z-25';
      customContent = (
        <div
          className="border-2 border-white bg-green-600"
          style={{
            width: '100%',
            height: '100%',
            transform: `rotate(${rotation}deg)`,
          }}
        />
      );
    } else if (equipment.type === 'coach') {
      // Coach: person icon or text
      specificClasses = 'w-5 h-5 md:w-6 md:h-6 bg-purple-600 border-2 border-purple-800 rounded-full z-25';
      displayText = 'C';
    }
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
        transitionDuration: isDragging ? '0ms' : `${transitionDuration}ms`,
      }}
    >
      {customContent || (displayText && <span>{displayText}</span>)}
    </div>
  );
};

export default Piece;
