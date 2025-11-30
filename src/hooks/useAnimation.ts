import { useState, useCallback, useRef, useEffect } from 'react';
import { BoardState } from '../types';
import { ANIMATION_DEFAULTS } from '../constants';

export interface UseAnimationOptions {
  onFrameChange: (frameIndex: number, frame: BoardState) => void;
}

export interface UseAnimationReturn {
  frames: BoardState[];
  currentFrame: number;
  playbackState: 'idle' | 'playing';
  animationSpeed: number;
  setFrames: React.Dispatch<React.SetStateAction<BoardState[]>>;
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
  setPlaybackState: React.Dispatch<React.SetStateAction<'idle' | 'playing'>>;
  setAnimationSpeed: React.Dispatch<React.SetStateAction<number>>;
  handleAddFrame: (frame: BoardState) => void;
  handleGoToFrame: (frameIndex: number) => void;
  handlePlay: () => void;
  resetAnimation: () => void;
}

export const useAnimation = (options: UseAnimationOptions): UseAnimationReturn => {
  const { onFrameChange } = options;
  
  const [frames, setFrames] = useState<BoardState[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing'>('idle');
  const [animationSpeed, setAnimationSpeed] = useState(ANIMATION_DEFAULTS.DEFAULT_SPEED);
  const animationInterval = useRef<number | null>(null);

  const handleAddFrame = useCallback(
    (frame: BoardState) => {
      setFrames((prev) => [...prev, frame]);
    },
    [],
  );

  const handleGoToFrame = useCallback(
    (frameIndex: number) => {
      if (frameIndex >= 0 && frameIndex < frames.length) {
        setCurrentFrame(frameIndex);
        onFrameChange(frameIndex, frames[frameIndex]);
      }
    },
    [frames, onFrameChange],
  );

  const handlePlay = useCallback(() => {
    if (frames.length < 2) return;

    if (playbackState === 'playing') {
      // PAUSE
      setPlaybackState('idle');
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }
      return;
    }

    setPlaybackState('playing');
    // If at the end, reset to the beginning before playing
    const startFrame = currentFrame >= frames.length - 1 ? 0 : currentFrame;
    if (startFrame === 0) {
      handleGoToFrame(0);
    }

    let frame = startFrame;
    animationInterval.current = window.setInterval(() => {
      frame++;
      if (frame >= frames.length) {
        if (animationInterval.current) {
          clearInterval(animationInterval.current);
          animationInterval.current = null;
        }
        setPlaybackState('idle');
        setCurrentFrame(frames.length - 1);
      } else {
        handleGoToFrame(frame);
      }
    }, ANIMATION_DEFAULTS.BASE_INTERVAL_MS / animationSpeed);
  }, [frames.length, currentFrame, playbackState, handleGoToFrame, animationSpeed]);

  const resetAnimation = useCallback(() => {
    setFrames([]);
    setCurrentFrame(0);
    setPlaybackState('idle');
    if (animationInterval.current) {
      clearInterval(animationInterval.current);
      animationInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, []);

  return {
    frames,
    currentFrame,
    playbackState,
    animationSpeed,
    setFrames,
    setCurrentFrame,
    setPlaybackState,
    setAnimationSpeed,
    handleAddFrame,
    handleGoToFrame,
    handlePlay,
    resetAnimation,
  };
};

