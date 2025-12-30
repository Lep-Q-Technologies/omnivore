import { cn } from '@/lib/utils';
import type { DensityMode } from '@/types/article';

interface CardSkeletonProps {
  density: DensityMode;
}

const CardSkeleton = ({ density }: CardSkeletonProps) => {
  const showThumbnail = density !== 'compact';
  
  return (
    <div 
      className={cn(
        'bg-card rounded-lg overflow-hidden animate-pulse',
        density === 'compact' && 'p-2',
        density === 'comfortable' && 'p-3',
        density === 'spacious' && 'p-4'
      )}
    >
      {showThumbnail && (
        <div 
          className={cn(
            'skeleton-shimmer rounded-md mb-3',
            density === 'comfortable' && 'h-36',
            density === 'spacious' && 'h-44'
          )}
        />
      )}
      
      <div className="space-y-2">
        {/* Metadata */}
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer h-3 w-3 rounded" />
          <div className="skeleton-shimmer h-3 w-16 rounded" />
          <div className="skeleton-shimmer h-3 w-12 rounded" />
        </div>
        
        {/* Title */}
        <div className="space-y-1.5">
          <div className="skeleton-shimmer h-4 w-full rounded" />
          {density !== 'compact' && (
            <div className="skeleton-shimmer h-4 w-3/4 rounded" />
          )}
        </div>
        
        {/* Source */}
        <div className="skeleton-shimmer h-3 w-24 rounded" />
        
        {/* Tags */}
        {density !== 'compact' && (
          <div className="flex gap-2 pt-1">
            <div className="skeleton-shimmer h-5 w-16 rounded-full" />
            <div className="skeleton-shimmer h-5 w-20 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardSkeleton;
