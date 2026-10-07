import React, { useEffect, useRef, useState } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import { Move } from 'cubing/alg';

export interface CubeRendererAction {
  type: 'move' | 'scramble' | 'reset' | 'undo' | 'redo';
  moveStr?: string;
  scrambleStr?: string;
  id: number;
}

interface CubeRendererProps {
  lastAction: CubeRendererAction | null;
  className?: string;
}

export const CubeRenderer: React.FC<CubeRendererProps> = ({ lastAction, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const twistyRef = useRef<TwistyPlayer | null>(null);
  const processedActionIdRef = useRef<number>(-1);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize TwistyPlayer 3D instance synchronously
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setIsLoading(true);

    try {
      const player = new TwistyPlayer({
        puzzle: '3x3x3',
        visualization: '3D',
        background: 'none',
        controlPanel: 'none',
        hintFacelets: 'none',
        cameraLatitude: 25,
        cameraLongitude: 35,
        cameraDistance: 4.8,
      });

      // TwistyPlayer requires display: grid (its default :host style)
      // If overridden to display: block, .wrapper collapses to 0px height due to contain: size
      player.style.display = 'grid';
      player.style.width = '100%';
      player.style.height = '100%';
      player.style.minWidth = '240px';
      player.style.minHeight = '240px';
      player.style.margin = '0 auto';

      try {
        player.tempoScale = 6;
      } catch {
        // Fallback if not settable
      }

      container.appendChild(player);
      twistyRef.current = player;
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize 3D TwistyPlayer in CubeRenderer:', err);
      setIsLoading(false);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
      twistyRef.current = null;
    };
  }, []);

  // Handle incoming moves/scrambles/resets smoothly
  useEffect(() => {
    if (!lastAction || !twistyRef.current) return;
    if (processedActionIdRef.current === lastAction.id) return;
    processedActionIdRef.current = lastAction.id;

    const player = twistyRef.current;

    try {
      if (lastAction.type === 'move' && lastAction.moveStr) {
        player.experimentalAddMove(new Move(lastAction.moveStr));
      } else if (lastAction.type === 'undo' && lastAction.moveStr) {
        player.experimentalAddMove(new Move(lastAction.moveStr));
      } else if (lastAction.type === 'redo' && lastAction.moveStr) {
        player.experimentalAddMove(new Move(lastAction.moveStr));
      } else if (lastAction.type === 'scramble') {
        player.alg = '';
        player.experimentalSetupAlg = lastAction.scrambleStr || '';
      } else if (lastAction.type === 'reset') {
        player.alg = '';
        player.experimentalSetupAlg = '';
      }
    } catch (err) {
      console.error('Error applying action to TwistyPlayer:', err);
    }
  }, [lastAction]);

  return (
    <div
      className={`relative w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] md:w-[340px] md:h-[340px] flex items-center justify-center select-none mx-auto ${className}`}
      role="region"
      aria-label="Cubo de Rubik Virtual interactivo 3D"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-neutral-400 dark:text-neutral-500 animate-pulse">
          Cargando Cubo Virtual 3D...
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minWidth: '240px', minHeight: '240px' }}
        className="w-full h-full flex items-center justify-center overflow-hidden"
      />
    </div>
  );
};
