import { cn } from '@/lib/utils';
import type { Tag, TagColor } from '@/types/article';

interface TagChipProps {
  tag: Tag;
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
}

const colorClasses: Record<TagColor, string> = {
  red: 'tag-chip-red',
  orange: 'tag-chip-orange',
  yellow: 'tag-chip-yellow',
  green: 'tag-chip-green',
  blue: 'tag-chip-blue',
  purple: 'tag-chip-purple',
  pink: 'tag-chip-pink',
  gray: 'tag-chip-gray',
};

const TagChip = ({ tag, onClick, className }: TagChipProps) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        'tag-chip hover:opacity-80 focus-ring',
        colorClasses[tag.color],
        className
      )}
      aria-label={`Filter by tag: ${tag.label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      <span className="truncate max-w-[80px]">{tag.label}</span>
    </button>
  );
};

export default TagChip;
