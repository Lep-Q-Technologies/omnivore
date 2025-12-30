import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  isHovered?: boolean;
  onMenuClick?: (e: React.MouseEvent) => void;
}

const ProgressBar = ({ 
  progress, 
  showLabel = false, 
  showPercentage = true, 
  size = 'sm', 
  className,
  isHovered = false,
  onMenuClick
}: ProgressBarProps) => {
  const isComplete = progress >= 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const showHoverMenu = isHovered && onMenuClick && clampedProgress > 0;
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'flex-1 bg-border rounded-full overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2'
      )}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'h-full rounded-full relative',
            isComplete ? 'bg-state-success' : 'progress-gradient'
          )}
          style={{
            boxShadow: clampedProgress > 0 ? '0 0 8px hsl(var(--action-blue) / 0.5)' : 'none'
          }}
        >
          {/* Animated shine effect */}
          {!isComplete && clampedProgress > 0 && clampedProgress < 100 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'easeInOut'
              }}
            />
          )}
        </motion.div>
      </div>
      
      {/* Container for percentage/menu with fixed width to prevent layout shift */}
      {showPercentage && !showLabel && clampedProgress > 0 && (
        <div className="relative min-w-[40px] h-5 flex items-center justify-end">
          <AnimatePresence mode="wait">
            {showHoverMenu ? (
              <motion.button
                key="menu"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={onMenuClick}
                className="w-6 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.span
                key="percentage"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={cn(
                  'text-micro font-medium',
                  isComplete ? 'text-state-success' : 'text-muted-foreground'
                )}
              >
                {Math.round(clampedProgress)}%
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {showLabel && (
        <span className={cn(
          'text-micro min-w-[32px] text-right font-medium',
          isComplete ? 'text-state-success' : 'text-muted-foreground'
        )}>
          {isComplete ? '✓ Done' : `${Math.round(clampedProgress)}%`}
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
