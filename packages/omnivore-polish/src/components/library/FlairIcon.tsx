import { Star, Mail, Pin, Rss } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Flair } from '@/types/article';

interface FlairIconProps {
  flair: Flair;
  onClick?: () => void;
}

const iconMap = {
  star: Star,
  mail: Mail,
  pin: Pin,
  rss: Rss,
};

const FlairIcon = ({ flair, onClick }: FlairIconProps) => {
  const Icon = iconMap[flair.icon];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-brand-yellow transition-colors duration-150 focus-ring rounded"
          aria-label={flair.name}
        >
          <Icon className="w-3 h-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-elevated text-foreground border-border">
        <p className="text-micro">{flair.name}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default FlairIcon;
