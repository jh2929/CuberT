import React, { useEffect, useRef, useState } from 'react';
import { CubeEventId } from '../../types/event';
import { Eye, Box } from 'lucide-react';

interface CubeVisualizerProps {
  scramble: string;
  event: CubeEventId;
}

type SupportedPuzzle =
  | '3x3x3'
  | '2x2x2'
  | '4x4x4'
  | '5x5x5'
  | '6x6x6'
  | '7x7x7'
  | 'pyraminx'
  | 'skewb'
  | 'megaminx'
  | 'square1'
  | 'clock';

function mapEventToTwistyPuzzle(event: CubeEventId): SupportedPuzzle {
  switch (event) {
    case '333':
    case '333oh':
    case '333bld':
      return '3x3x3';
    case '222':
      return '2x2x2';
    case '444':
      return '4x4x4';
    case '555':
      return '5x5x5';
    case '666':
      return '6x6x6';
    case '777':
      return '7x7x7';
    case 'pyram':
      return 'pyraminx';
    case 'skewb':
      return 'skewb';
    case 'minx':
      return 'megaminx';
    case 'sq1':
      return 'square1';
    case 'clock':
      return 'clock';
    default:
      return '3x3x3';
  }
}

export const CubeVisualizer: React.FC<CubeVisualizerProps> = ({ scramble, event }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('2D');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    const container = containerRef.current;

    if (!container || !scramble) return;

    setIsLoading(true);

    const puzzle = mapEventToTwistyPuzzle(event);

    if (viewMode === '2D') {
      Promise.all([
        import('cubing/puzzles'),
        import('cubing/alg'),
        import('cubing/twisty'),
      ])
        .then(async ([{ puzzles }, { Alg }, { ExperimentalSVGAnimator }]) => {
          if (isCancelled || !container) return;

          const p = puzzles[puzzle];
          if (!p || typeof p.svg !== 'function' || typeof p.kpuzzle !== 'function') {
            setIsLoading(false);
            return;
          }

          try {
            const [kpuzzle, svgSource] = await Promise.all([p.kpuzzle(), p.svg()]);
            if (isCancelled || !container) return;

            const animator = new ExperimentalSVGAnimator(kpuzzle, svgSource);

            try {
              const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
              animator.draw(pattern);
            } catch (err) {
              console.warn('Could not apply scramble to pattern, drawing default:', err);
              animator.draw(kpuzzle.defaultPattern());
            }

            container.innerHTML = '';
            const wrapper = animator.wrapperElement;
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';

            if (animator.svgElement) {
              animator.svgElement.style.maxWidth = '100%';
              animator.svgElement.style.maxHeight = '100%';
              animator.svgElement.style.width = 'auto';
              animator.svgElement.style.height = 'auto';
            }

            container.appendChild(wrapper);
            setIsLoading(false);
          } catch (e) {
            console.warn('Error rendering 2D cube SVG:', e);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.warn('Error loading cubing modules:', err);
          setIsLoading(false);
        });
    } else {
      // 3D View mode
      import('cubing/twisty')
        .then(({ TwistyPlayer }) => {
          if (isCancelled || !container) return;

          container.innerHTML = '';

          try {
            const twistyPlayerInstance = new TwistyPlayer({
              puzzle,
              experimentalSetupAlg: scramble,
              visualization: '3D',
              background: 'none',
              controlPanel: 'none',
              hintFacelets: 'none',
              cameraLatitude: 30,
              cameraLongitude: 35,
              cameraDistance: 4.8,
            });

            twistyPlayerInstance.style.width = '100%';
            twistyPlayerInstance.style.height = '100%';
            twistyPlayerInstance.style.display = 'block';

            container.appendChild(twistyPlayerInstance);
            setIsLoading(false);
          } catch (e) {
            console.warn('Could not initialize 3D TwistyPlayer:', e);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.warn('Error loading cubing/twisty:', err);
          setIsLoading(false);
        });
    }

    return () => {
      isCancelled = true;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [scramble, event, viewMode]);

  return (
    <div
      className="relative flex flex-col items-center justify-center w-40 h-32 sm:w-48 sm:h-38 md:w-50 md:h-40 rounded-3xl bg-white/75 dark:bg-[#121215]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] p-2 group overflow-hidden transition-all duration-200 hover:border-black/[0.12] dark:hover:border-white/[0.15]"
      title="Vista del cubo desarmado por caras"
    >
      {/* 2D / 3D toggle in corner */}
      <button
        type="button"
        onClick={() => setViewMode((prev) => (prev === '3D' ? '2D' : '3D'))}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all opacity-0 group-hover:opacity-100"
        title={viewMode === '3D' ? 'Cambiar a vista 2D' : 'Cambiar a vista 3D'}
      >
        {viewMode === '3D' ? <Eye size={13} /> : <Box size={13} />}
      </button>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-400 font-mono">
          Cargando cubo...
        </div>
      )}

      {/* Player Canvas Container */}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center pointer-events-none" />
    </div>
  );
};
