import { useState, useRef } from 'react';
import { Clock, AlertCircle, RotateCcw, User, Globe, Star, Trash2, MoreHorizontal, Mail, Pin, Eye, Timer, Check, Tag as TagIcon } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Article, DensityMode, Tag } from '@/types/article';
import FlairIcon from './FlairIcon';
import TagChip from './TagChip';
import ProgressBar from './ProgressBar';
import CardSkeleton from './CardSkeleton';

interface LibraryCardProps {
  article: Article;
  density: DensityMode;
  isSelectMode?: boolean;
  isInReadLater?: boolean;
  onSelect?: (id: string) => void;
  onRead?: (id: string) => void;
  onReadLater?: () => void;
  onMarkAsRead?: () => void;
  onStar?: () => void;
  onArchive?: (id: string) => void;
  onTag?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
  onEnterSelectMode?: () => void;
  onTagClick?: (tag: Tag) => void;
}

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const SWIPE_THRESHOLD = 80;

const LibraryCard = ({
  article,
  density,
  isSelectMode = false,
  isInReadLater = false,
  onSelect,
  onRead,
  onReadLater,
  onMarkAsRead,
  onStar,
  onArchive,
  onTag,
  onDelete,
  onRetry,
  onEnterSelectMode,
  onTagClick,
}: LibraryCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Swipe gesture state
  const x = useMotionValue(0);
  const swipeLeftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const swipeRightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  
  // Processing state shows skeleton
  if (article.state === 'processing') {
    return <CardSkeleton density={density} />;
  }
  
  const showThumbnail = density !== 'compact' && article.thumbnailUrl;
  const isComplete = article.progress >= 100;
  const isInProgress = article.progress > 0 && article.progress < 100;
  const isArchived = article.state === 'archived';
  const isFailed = article.state === 'failed';
  const isPinned = article.flairs.some(f => f.icon === 'pin');
  const isSaved = article.flairs.some(f => f.icon === 'mail');
  const isStarred = article.flairs.some(f => f.icon === 'star');
  
  // Density-based styling
  const titleClamp = density === 'compact' ? 'line-clamp-1' : density === 'spacious' ? 'line-clamp-3' : 'line-clamp-2';
  const contentPadding = density === 'spacious' ? 'p-4' : 'p-3';
  const titleSize = density === 'spacious' ? 'text-lg' : 'text-heading';
  
  const handleCardClick = () => {
    if (isSelectMode) {
      onSelect?.(article.id);
    } else {
      onRead?.(article.id);
    }
  };
  
  // Long press handlers for mobile
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      if (!isSelectMode && onEnterSelectMode) {
        onEnterSelectMode();
        onSelect?.(article.id);
      }
    }, 500);
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  
  // Swipe handlers
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeX = info.offset.x;
    
    if (swipeX < -SWIPE_THRESHOLD) {
      onArchive?.(article.id);
    } else if (swipeX > SWIPE_THRESHOLD) {
      onStar?.();
    }
  };
  
  const visibleTags = article.tags.slice(0, 3);
  const remainingTags = article.tags.length - 3;
  
  return (
    <div className="relative h-full">
      {/* Swipe action backgrounds (mobile) */}
      <div className="absolute inset-0 flex lg:hidden">
        <motion.div 
          className="absolute right-0 top-0 bottom-0 w-20 bg-destructive/80 flex items-center justify-center rounded-r-lg"
          style={{ opacity: swipeLeftOpacity }}
        >
          <Trash2 className="w-6 h-6 text-destructive-foreground" />
        </motion.div>
        
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-20 bg-brand-yellow/80 flex items-center justify-center rounded-l-lg"
          style={{ opacity: swipeRightOpacity }}
        >
          <Star className="w-6 h-6 text-primary-foreground" />
        </motion.div>
      </div>
      
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={handleCardClick}
        className={cn(
          'group relative bg-card rounded-lg overflow-hidden cursor-pointer card-lift flex flex-col h-full',
          'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-background',
          'touch-pan-y',
          article.isSelected && 'ring-2 ring-accent bg-elevated',
          isArchived && 'opacity-60',
          isFailed && 'border border-destructive/50'
        )}
        tabIndex={0}
        role="button"
        aria-label={`${article.title} from ${article.sourceName}`}
      >
        {/* Thumbnail */}
        {showThumbnail && (
          <div className={cn(
            "relative bg-muted flex-shrink-0",
            density === 'spacious' ? 'aspect-[16/10]' : 'aspect-video'
          )}>
            <img
              src={article.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Reading state badges - top left */}
            {(isInReadLater || isInProgress) && (
              <div className="absolute top-2 left-2 flex items-center gap-1">
                {isInReadLater && article.progress === 0 && (
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-md" title="Read Later">
                    <Timer className="w-3.5 h-3.5 text-accent-foreground" />
                  </div>
                )}
                {isInProgress && (
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-md" title="In Progress">
                    <Eye className="w-3.5 h-3.5 text-accent-foreground" />
                  </div>
                )}
              </div>
            )}
            
            {/* Star icon - top right, always visible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStar?.();
              }}
              className={cn(
                'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all',
                isStarred 
                  ? 'bg-brand-yellow text-primary-foreground' 
                  : 'bg-background/80 text-muted-foreground hover:text-brand-yellow hover:border-brand-yellow border border-transparent'
              )}
            >
              <Star className={cn('w-4 h-4', isStarred && 'fill-current')} />
            </button>
            
            {/* Mobile overflow menu */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-2 right-2 lg:hidden w-8 h-8 p-0 bg-background/80 backdrop-blur-sm rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileActions(!showMobileActions);
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* Select checkbox */}
        {isSelectMode && (
          <div className={cn(
            'absolute z-10',
            showThumbnail ? 'top-2 left-2' : 'top-3 left-3'
          )}>
            <Checkbox
              checked={article.isSelected}
              onCheckedChange={() => onSelect?.(article.id)}
              className="w-5 h-5 bg-background border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              aria-label={`Select ${article.title}`}
            />
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          'flex-1 flex flex-col',
          contentPadding,
          isSelectMode && !showThumbnail && 'pl-10'
        )}>
          {/* Compact mode: Star + Flairs row */}
          {!showThumbnail && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {isInReadLater && article.progress === 0 && (
                  <Timer className="w-3.5 h-3.5 text-accent" />
                )}
                {isInProgress && (
                  <Eye className="w-3.5 h-3.5 text-accent" />
                )}
                {article.flairs.filter(f => f.icon !== 'star').map((flair, idx) => (
                  <FlairIcon key={idx} flair={flair} />
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStar?.();
                }}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                  isStarred 
                    ? 'text-brand-yellow' 
                    : 'text-muted-foreground hover:text-brand-yellow'
                )}
              >
                <Star className={cn('w-4 h-4', isStarred && 'fill-current')} />
              </button>
            </div>
          )}
          
          {/* Metadata row - for comfortable/spacious with thumbnail */}
          {showThumbnail && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground mb-2">
              {isPinned && (
                <Pin className="w-3.5 h-3.5 text-accent" />
              )}
              {isSaved && (
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              
              <span className="text-caption">
                {getTimeAgo(article.savedAt)}
              </span>
              
              {article.readingTime > 0 && (
                <span className="flex items-center gap-1 text-caption">
                  <Clock className="w-3 h-3" />
                  {article.readingTime} min
                </span>
              )}
            </div>
          )}
          
          {/* Title */}
          <h3 className={cn('text-foreground font-semibold leading-snug mb-1', titleSize, titleClamp)}>
            {article.title}
          </h3>
          
          {/* Source and author row */}
          <div className="text-caption text-foreground/70 mb-2">
            {article.author && <span>{article.author}</span>}
            {article.author && article.sourceName && <span> · </span>}
            <span>{article.sourceName}</span>
          </div>
          
          {/* Compact mode: Metadata row */}
          {!showThumbnail && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mb-2">
              <span className="text-caption">
                {getTimeAgo(article.savedAt)}
              </span>
              
              {article.readingTime > 0 && (
                <span className="flex items-center gap-1 text-caption">
                  <Clock className="w-3 h-3" />
                  {article.readingTime} min
                </span>
              )}
            </div>
          )}
          
          {/* Failed state */}
          {isFailed && (
            <div className="flex items-center gap-2 py-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-caption text-destructive">Failed to process</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry?.(article.id);
                }}
                className="flex items-center gap-1 text-caption text-accent hover:text-accent/80 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}
          
          {/* Tags - pushed to bottom */}
          <div className="flex-1" />
          {article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  onClick={(e) => {
                    e?.stopPropagation();
                    onTagClick?.(tag);
                  }}
                />
              ))}
              {remainingTags > 0 && (
                <span className="text-micro text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
                  +{remainingTags} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Progress bar at bottom with integrated menu */}
        {article.state === 'default' && !isFailed && (
          <div className={cn(
            density === 'spacious' ? 'px-4 pb-4' : 'px-3 pb-3'
          )}>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <ProgressBar 
                progress={article.progress} 
                showPercentage={article.progress > 0}
                isHovered={isHovered && !isSelectMode && density === 'compact'}
                onMenuClick={density === 'compact' && !isSelectMode ? (e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(true);
                } : undefined}
              />
              <DropdownMenuTrigger asChild>
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuItem onClick={() => onRead?.(article.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Read Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReadLater}>
                  <Timer className="w-4 h-4 mr-2" />
                  {isInReadLater ? 'Remove from Read Later' : 'Read Later'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onStar}>
                  <Star className={cn('w-4 h-4 mr-2', isStarred && 'fill-current text-brand-yellow')} />
                  {isStarred ? 'Unstar' : 'Star'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMarkAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTag?.(article.id)}>
                  <TagIcon className="w-4 h-4 mr-2" />
                  Edit Tags
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(article.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {/* Desktop hover menu - 3-dot dropdown (for non-compact modes) */}
        {!isSelectMode && !isFailed && density !== 'compact' && (
          <div className={cn(
            'absolute hidden lg:block transition-opacity',
            showThumbnail ? 'bottom-2 right-2' : 'top-1/2 right-2 -translate-y-1/2',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-8 h-8 p-0 bg-card/90 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuItem onClick={() => onRead?.(article.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Read Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReadLater}>
                  <Timer className="w-4 h-4 mr-2" />
                  {isInReadLater ? 'Remove from Read Later' : 'Read Later'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onStar}>
                  <Star className={cn('w-4 h-4 mr-2', isStarred && 'fill-current text-brand-yellow')} />
                  {isStarred ? 'Unstar' : 'Star'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMarkAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTag?.(article.id)}>
                  <TagIcon className="w-4 h-4 mr-2" />
                  Edit Tags
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(article.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </motion.article>
      
      {/* Mobile actions menu */}
      <AnimatePresence>
        {showMobileActions && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute bottom-0 left-0 right-0 bg-elevated border border-border rounded-b-lg p-2 flex items-center justify-around gap-2 lg:hidden z-20"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRead?.(article.id);
                setShowMobileActions(false);
              }}
              className="flex-1 gap-1.5"
            >
              Read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onReadLater?.();
                setShowMobileActions(false);
              }}
              className="flex-1 gap-1.5"
            >
              <Timer className="w-4 h-4" />
              Later
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(article.id);
                setShowMobileActions(false);
              }}
              className="flex-1 gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibraryCard;
