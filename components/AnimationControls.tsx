import React from 'react';

interface AnimationControlsProps {
  onAddFrame: () => void;
  onPlay: () => void;
  onGoToFrame: (frameIndex: number) => void;
  frameCount: number;
  currentFrame: number;
  playbackState: 'idle' | 'playing';
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
}

const ControlButton: React.FC<React.PropsWithChildren<{
  onClick: () => void;
  disabled?: boolean;
  title: string;
  className?: string;
}>> = ({ onClick, disabled = false, title, children, className = '' }) => (
  <button
    onClick={onClick}
    export { default } from '../src/components/AnimationControls';