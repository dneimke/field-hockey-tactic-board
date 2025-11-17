import React, { useState, useRef, useEffect, useCallback } from "react";
import { Position } from "../types";

interface UseDraggableProps {
  onMove: (position: Position) => void;
  // Fix: Add React namespace to RefObject type.
  containerRef: React.RefObject<HTMLElement>;
  // Fix: Add React namespace to RefObject type.
  nodeRef: React.RefObject<HTMLElement>;
}

export const useDraggable = ({
  onMove,
  containerRef,
  nodeRef,
}: UseDraggableProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  // Fix: Add React namespace to PointerEvent type.
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!nodeRef.current) return;

      const nodeRect = nodeRef.current.getBoundingClientRect();
      offset.current = {
        x: e.clientX - nodeRect.left,
        y: e.clientY - nodeRect.top,
      };

      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [nodeRef]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging || !containerRef.current || !nodeRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const nodeWidth = nodeRef.current.offsetWidth;
      const nodeHeight = nodeRef.current.offsetHeight;

      let newX = e.clientX - containerRect.left - offset.current.x;
      let newY = e.clientY - containerRect.top - offset.current.y;

      // Constrain within container boundaries
      newX = Math.max(0, Math.min(newX, containerRect.width - nodeWidth));
      newY = Math.max(0, Math.min(newY, containerRect.height - nodeHeight));

      const newPosition: Position = {
        x: (newX / containerRect.width) * 100,
        y: (newY / containerRect.height) * 100,
      };

      onMove(newPosition);
    },
    [isDragging, onMove, containerRef, nodeRef]
  );

  const handlePointerUp = useCallback((e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const handleMove = (e: PointerEvent) => handlePointerMove(e);
    const handleUp = (e: PointerEvent) => handlePointerUp(e);

    if (isDragging) {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    }

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp, nodeRef]);

  return { isDragging, handlePointerDown };
};
