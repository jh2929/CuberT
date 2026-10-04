import React, { useState } from 'react';
import { Copy, Check, RotateCw, ChevronLeft } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

interface ScrambleProps {
  scramble: string;
  hasPrevious: boolean;
  onNextScramble: () => void;
  onPreviousScramble: () => void;
  onCopyScramble: () => Promise<boolean>;
  isGenerating?: boolean;
}

export const Scramble: React.FC<ScrambleProps> = ({
  scramble,
  hasPrevious,
  onNextScramble,
  onPreviousScramble,
  onCopyScramble,
  isGenerating = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await onCopyScramble();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Scramble text rendered directly over the background */}
      <div className="relative group w-full text-center px-4">
        <p className="text-base sm:text-lg md:text-xl font-normal text-neutral-800 dark:text-[#E2E2E5] tracking-wide leading-relaxed font-mono select-text transition-opacity duration-150">
          {scramble || (isGenerating ? 'Generando scramble...' : '—')}
        </p>

        {/* Action icons below scramble */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5 opacity-60 hover:opacity-100 transition-opacity">
          {hasPrevious && (
            <IconButton
              size="sm"
              ariaLabel="Scramble anterior"
              onClick={onPreviousScramble}
              className="text-neutral-500 dark:text-neutral-400"
            >
              <ChevronLeft size={15} />
            </IconButton>
          )}

          <IconButton
            size="sm"
            ariaLabel={copied ? 'Copiado' : 'Copiar scramble'}
            onClick={handleCopy}
            className="text-neutral-500 dark:text-neutral-400"
          >
            {copied ? (
              <Check size={14} className="text-[#00FF66]" />
            ) : (
              <Copy size={14} />
            )}
          </IconButton>

          <IconButton
            size="sm"
            ariaLabel="Nuevo scramble (R)"
            onClick={onNextScramble}
            disabled={isGenerating}
            className="text-neutral-500 dark:text-neutral-400"
          >
            <RotateCw
              size={14}
              className={isGenerating ? 'animate-spin text-[#00FF66]' : ''}
            />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
