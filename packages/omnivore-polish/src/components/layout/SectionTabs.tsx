import { cn } from '@/lib/utils';
import { LayoutList, Clock, Star, Trash2, CheckSquare, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SectionTab = 'all' | 'inprogress' | 'readlater' | 'starred' | 'trash';

interface SectionTabsProps {
  activeTab: SectionTab;
  onTabChange: (tab: SectionTab) => void;
  counts?: {
    all?: number;
    inprogress?: number;
    readlater?: number;
    starred?: number;
    trash?: number;
  };
  isSelectMode?: boolean;
  onSelectModeToggle?: () => void;
}

const tabs: { id: SectionTab; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: LayoutList },
  { id: 'inprogress', label: 'In Progress', icon: BookOpen },
  { id: 'readlater', label: 'Read Later', icon: Clock },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const SectionTabs = ({ activeTab, onTabChange, counts = {}, isSelectMode, onSelectModeToggle }: SectionTabsProps) => {
  return (
    <nav className="flex items-center justify-between border-b border-border mb-4" role="tablist" aria-label="Library sections">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const count = counts[tab.id];
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-body font-medium transition-colors relative whitespace-nowrap',
                'hover:text-foreground focus-ring',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-micro font-medium',
                  isActive 
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Select mode toggle */}
      {onSelectModeToggle && (
        <Button
          variant={isSelectMode ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onSelectModeToggle}
          className={cn(
            'h-8 gap-1.5 mr-2 shrink-0',
            isSelectMode 
              ? 'bg-accent text-accent-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Select</span>
        </Button>
      )}
    </nav>
  );
};

export default SectionTabs;
