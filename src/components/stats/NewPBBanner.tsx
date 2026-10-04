import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { NewPBNotification } from '../../features/statistics/pb';
import { formatTime } from '../../utils/formatTime';
import { TimerPrecision } from '../../types/settings';

interface NewPBBannerProps {
  notification: NewPBNotification | null;
  onDismiss: () => void;
  precision: TimerPrecision;
}

export const NewPBBanner: React.FC<NewPBBannerProps> = ({
  notification,
  onDismiss,
  precision,
}) => {
  useEffect(() => {
    if (notification) {
      // Fire celebratory confetti burst
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          startVelocity: 35,
          origin: { y: 0.65 },
          colors: ['#00FF66', '#10E364', '#FFD700', '#38BDF8', '#FFFFFF'],
          disableForReducedMotion: true,
        });

        // Second gentle wave for extra delight
        setTimeout(() => {
          confetti({
            particleCount: 45,
            angle: 60,
            spread: 55,
            origin: { x: 0.2, y: 0.7 },
            colors: ['#00FF66', '#FFD700', '#FFFFFF'],
            disableForReducedMotion: true,
          });
          confetti({
            particleCount: 45,
            angle: 120,
            spread: 55,
            origin: { x: 0.8, y: 0.7 },
            colors: ['#10E364', '#38BDF8', '#FFFFFF'],
            disableForReducedMotion: true,
          });
        }, 220);
      } catch {
        // Fallback if confetti fails
      }

      const timer = setTimeout(() => {
        onDismiss();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  const typeLabels: Record<string, string> = {
    single: 'Nuevo PB Single',
    ao5: 'Nuevo PB Ao5',
    ao12: 'Nuevo PB Ao12',
    ao100: 'Nuevo PB Ao100',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.94 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={onDismiss}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#121214]/90 dark:bg-[#18181B]/95 backdrop-blur-xl border border-[#00FF66]/40 text-[#00FF66] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(0,255,102,0.25)] cursor-pointer select-none"
      >
        <Trophy size={16} className="text-[#00FF66] animate-bounce shrink-0" />
        <span className="text-xs font-semibold tracking-wide uppercase">
          {typeLabels[notification.type] || 'Nuevo PB'}
        </span>
        <span className="font-mono-numbers text-sm font-bold text-white drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]">
          {formatTime(notification.value, 'none', { precision })}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};
