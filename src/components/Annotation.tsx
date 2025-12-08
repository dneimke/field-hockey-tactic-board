import React, { useState, useRef, useEffect } from 'react';
import { Annotation as AnnotationType, Position } from '../types';
import { useDraggable } from '../hooks/useDraggable';

interface AnnotationProps {
  annotation: AnnotationType;
  onMove: (id: string, position: Position) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isPortrait?: boolean;
}

const Annotation: React.FC<AnnotationProps> = ({
  annotation,
  onMove,
  onUpdate,
  onDelete,
  containerRef,
  isPortrait = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(annotation.text);
  const annotationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleMove = (position: Position) => {
    onMove(annotation.id, position);
  };

  const { isDragging, handlePointerDown } = useDraggable({
    onMove: handleMove,
    containerRef,
    nodeRef: annotationRef,
  });

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle click to edit (but not when dragging)
  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && e.target !== inputRef.current) {
      setIsEditing(true);
      setEditText(annotation.text);
    }
  };

  // Handle save on Enter or blur
  const handleSave = () => {
    const trimmedText = editText.trim();
    if (trimmedText) {
      onUpdate(annotation.id, trimmedText);
    } else {
      // Delete if empty
      onDelete(annotation.id);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(annotation.text);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(annotation.id);
  };

  // Calculate anchor position (where the tail points to)
  // The annotation bubble is positioned above the anchor point
  const anchorY = annotation.position.y;
  const bubbleY = Math.max(5, anchorY - 8); // Position bubble above anchor, but not too close to top

  const baseClasses =
    'absolute transform -translate-x-1/2 flex flex-col shadow-lg select-none touch-none z-30';
  const draggingClasses = isDragging
    ? 'cursor-grabbing scale-105'
    : 'cursor-grab hover:scale-105';

  // Speech bubble styling
  const bubbleClasses = `
    relative bg-white bg-opacity-95 border-2 rounded-lg p-2 md:p-3
    max-w-[200px] min-w-[120px]
    transition-all duration-200
    ${isEditing ? 'ring-2 ring-indigo-400' : ''}
  `;

  const borderColor = annotation.color || '#FFFFFF';
  const tailSize = 12;

  return (
    <div
      ref={annotationRef}
      onPointerDown={(e) => {
        // Don't start dragging if clicking on delete button or input
        if (
          (e.target as HTMLElement).closest('.delete-button') ||
          (e.target as HTMLElement).tagName === 'TEXTAREA'
        ) {
          return;
        }
        handlePointerDown(e);
      }}
      onClick={handleClick}
      className={`${baseClasses} ${draggingClasses}`}
      style={{
        left: `${annotation.position.x}%`,
        top: `${bubbleY}%`,
      }}
    >
      {/* Speech bubble */}
      <div
        className={bubbleClasses}
        style={{
          borderColor: borderColor,
        }}
      >
        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="delete-button absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-colors z-40"
          title="Delete annotation"
          aria-label="Delete annotation"
        >
          ×
        </button>

        {/* Content */}
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full resize-none outline-none text-sm text-gray-900 bg-transparent border-none p-0"
            rows={Math.min(5, Math.max(2, editText.split('\n').length))}
            style={{ minHeight: '2rem' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
            {annotation.text || 'Click to edit'}
          </div>
        )}
      </div>

      {/* Tail pointing to anchor */}
      <svg
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{
          top: '100%',
          width: `${tailSize}px`,
          height: `${tailSize}px`,
        }}
        viewBox="0 0 12 12"
      >
        <path
          d={`M 0 0 L ${tailSize} 0 L ${tailSize / 2} ${tailSize} Z`}
          fill={borderColor}
          stroke="white"
          strokeWidth="1"
        />
        <path
          d={`M 1 1 L ${tailSize - 1} 1 L ${tailSize / 2} ${tailSize - 1} Z`}
          fill="white"
          fillOpacity="0.95"
        />
      </svg>
    </div>
  );
};

export default Annotation;
