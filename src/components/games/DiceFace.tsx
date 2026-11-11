import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface DiceFaceProps {
  value: number; // 1 to 6
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isRolling?: boolean;
  className?: string;
}

export const DiceFace: React.FC<DiceFaceProps> = ({
  value,
  size = 'md',
  isRolling = false,
  className = '',
}) => {
  const num = Math.min(6, Math.max(1, value || 1));
  const [justLanded, setJustLanded] = useState(false);

  useEffect(() => {
    if (!isRolling) {
      setJustLanded(true);
      const t = window.setTimeout(() => setJustLanded(false), 380);
      return () => window.clearTimeout(t);
    }
  }, [isRolling, num]);

  const sizeClasses = {
    sm: 'w-9 h-9 p-1 text-xs border-2 shadow-[2px_2px_0_var(--px-hard-shadow)]',
    md: 'w-14 h-14 p-1.5 text-sm border-3 shadow-[3px_3px_0_var(--px-hard-shadow)]',
    lg: 'w-24 h-24 p-3 text-base border-3 shadow-[5px_5px_0_var(--px-hard-shadow)]',
    xl: 'w-28 h-28 p-3.5 text-lg border-4 shadow-[6px_6px_0_var(--px-hard-shadow)]',
  }[size];

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  }[size];

  const renderDots = () => {
    const positions: { r: number; c: number; isCenter?: boolean }[] = [];

    switch (num) {
      case 1:
        positions.push({ r: 2, c: 2, isCenter: true });
        break;
      case 2:
        positions.push({ r: 1, c: 3 });
        positions.push({ r: 3, c: 1 });
        break;
      case 3:
        positions.push({ r: 1, c: 3 });
        positions.push({ r: 2, c: 2, isCenter: true });
        positions.push({ r: 3, c: 1 });
        break;
      case 4:
        positions.push({ r: 1, c: 1 });
        positions.push({ r: 1, c: 3 });
        positions.push({ r: 3, c: 1 });
        positions.push({ r: 3, c: 3 });
        break;
      case 5:
        positions.push({ r: 1, c: 1 });
        positions.push({ r: 1, c: 3 });
        positions.push({ r: 2, c: 2, isCenter: true });
        positions.push({ r: 3, c: 1 });
        positions.push({ r: 3, c: 3 });
        break;
      case 6:
        positions.push({ r: 1, c: 1 });
        positions.push({ r: 1, c: 3 });
        positions.push({ r: 2, c: 1 });
        positions.push({ r: 2, c: 3 });
        positions.push({ r: 3, c: 1 });
        positions.push({ r: 3, c: 3 });
        break;
    }

    return (
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, idx) => {
          const r = Math.floor(idx / 3) + 1;
          const c = (idx % 3) + 1;
          const hasDot = positions.some((p) => p.r === r && p.c === c);
          const isCenterOne = num === 1 && r === 2 && c === 2;

          return (
            <div key={idx} className="flex items-center justify-center">
              {hasDot && (
                <span
                  className={`${dotSizeClasses} transition-transform ${
                    isCenterOne
                      ? 'bg-[#FF8FA3] border-2 border-[#B91C47] scale-125'
                      : 'bg-[#2A2350]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      animate={
        isRolling
          ? {
              y: [0, -14, 0, -10, 0],
              rotate: [0, -16, 18, -12, 10, 0],
              scaleX: [1, 0.9, 1.1, 0.92, 1],
              scaleY: [1, 1.12, 0.88, 1.08, 1],
            }
          : justLanded
          ? {
              y: [0, 4, 0],
              rotate: 0,
              scaleX: [1.24, 0.92, 1.04, 1],
              scaleY: [0.76, 1.1, 0.97, 1],
            }
          : {
              y: 0,
              rotate: 0,
              scaleX: 1,
              scaleY: 1,
            }
      }
      transition={
        isRolling
          ? { duration: 0.36, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.32, ease: 'easeOut' }
      }
      className={`relative select-none bg-[#FDFBFF] border-[var(--px-border)] flex items-center justify-center ${sizeClasses} ${
        isRolling ? 'bg-[var(--color-px-yellow)]' : ''
      } ${className}`}
    >
      {/* Inner pixel bevel */}
      <div className="w-full h-full border border-[var(--px-border-muted)] p-0.5 flex items-center justify-center">
        {renderDots()}
      </div>
    </motion.div>
  );
};
