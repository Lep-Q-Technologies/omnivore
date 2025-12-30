import { BookOpen, Archive, Tag, ExternalLink, Trash2, MoreHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CardActionsProps {
  onRead?: () => void;
  onArchive?: () => void;
  onTag?: () => void;
  onOpenOriginal?: () => void;
  onDelete?: () => void;
  className?: string;
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
}

const ActionButton = ({ icon: Icon, label, onClick, variant = 'default' }: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={cn(
          'p-2 rounded-md transition-colors duration-150 focus-ring',
          variant === 'destructive'
            ? 'text-muted-foreground hover:text-state-danger hover:bg-state-danger/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label={label}
      >
        <Icon className="w-4 h-4" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="bg-elevated text-foreground border-border">
      <p className="text-micro">{label}</p>
    </TooltipContent>
  </Tooltip>
);

const CardActions = ({
  onRead,
  onArchive,
  onTag,
  onOpenOriginal,
  onDelete,
  className
}: CardActionsProps) => {
  return (
    <div 
      className={cn(
        'flex items-center gap-0.5 p-1 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50',
        className
      )}
    >
      <ActionButton icon={BookOpen} label="Read article" onClick={onRead} />
      <ActionButton icon={Archive} label="Archive" onClick={onArchive} />
      <ActionButton icon={Tag} label="Add label" onClick={onTag} />
      <ActionButton icon={ExternalLink} label="Open original" onClick={onOpenOriginal} />
      <ActionButton icon={Trash2} label="Delete" onClick={onDelete} variant="destructive" />
    </div>
  );
};

export default CardActions;
