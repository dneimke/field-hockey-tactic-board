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
    'absolute transform -translate-x-1/2 flex flex-col select-none touch-none z-30';
  const draggingClasses = isDragging
    ? 'cursor-grabbing scale-105'
    : 'cursor-grab hover:scale-105';

  // Modern annotation card styling
  const bubbleClasses = `
    relative rounded-[8px] p-4
    max-w-[250px] min-w-[120px]
    transition-all duration-200
    ${isEditing ? 'ring-2 ring-indigo-400' : ''}
  `;

  const borderColor = annotation.color || '#E5E7EB';

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
      {/* Modern annotation card */}
      <div
        className={bubbleClasses}
        style={{
          backgroundColor: 'white',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          fontFamily: "'Inter', sans-serif",
          color: '#374151',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        {/* Delete button - inside card, top-right with hover circle */}
        <button
          onClick={handleDelete}
          className="delete-button absolute top-3 right-3 w-6 h-6 text-gray-400 hover:text-red-500 flex items-center justify-center text-xl font-normal transition-all duration-200 rounded-full hover:bg-gray-100 z-40"
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
            className="w-full resize-none outline-none bg-transparent border-none p-0 pr-8"
            style={{ 
              minHeight: '2rem',
              fontFamily: "'Inter', sans-serif",
              color: '#374151',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
            rows={Math.min(5, Math.max(2, editText.split('\n').length))}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="whitespace-pre-wrap break-words pr-8"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: '#374151',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            {annotation.text || 'Click to edit'}
          </div>
        )}
      </div>

      {/* Seamless tail that merges with the box */}
      <svg
        className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
        style={{
          top: 'calc(100% - 1px)',
          width: '12px',
          height: '8px',
        }}
        viewBox="0 0 12 8"
      >
        {/* Simple triangle tail with matching border */}
        <path
          d="M 0 0 L 12 0 L 6 8 Z"
          fill="white"
          stroke={borderColor}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Small rounded dot at tip */}
        <circle
          cx="6"
          cy="7.5"
          r="1.5"
          fill={borderColor}
        />
      </svg>
    </div>
  );
};

export default Annotation;
