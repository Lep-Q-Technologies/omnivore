import { useState } from 'react';
import { LayoutGrid, List, ChevronDown, SlidersHorizontal, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DensityMode, TagColor } from '@/types/article';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'oldest' | 'updated' | 'reading-time' | 'reading-time-desc' | 'title' | 'author' | 'published';
type ContentType = 'newsletters' | 'rss' | 'videos' | 'podcasts' | 'articles';
type ReadingTime = 'quick' | 'medium' | 'long';
type ReadingStatus = 'unread' | 'in-progress' | 'completed';

interface FilterState {
  tags: string[];
  sources: string[];
  contentTypes: ContentType[];
  readingTime: ReadingTime[];
  readingStatus: ReadingStatus[];
}

interface FilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onLabelsClick?: () => void;
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
}

const densityLabels: Record<DensityMode, string> = {
  compact: 'Compact',
  comfortable: 'Comfortable',
  spacious: 'Spacious',
};

const sortLabels: Record<SortOption, string> = {
  recent: 'Most Recent',
  oldest: 'Oldest First',
  updated: 'Recently Updated',
  'reading-time': 'Reading Time (Short)',
  'reading-time-desc': 'Reading Time (Long)',
  title: 'Title (A-Z)',
  author: 'Author (A-Z)',
  published: 'Publication Date',
};

// Mock data for filters
const availableTags = [
  { id: 'ai', label: 'AI', count: 15, color: 'purple' as TagColor },
  { id: 'programming', label: 'Programming', count: 23, color: 'blue' as TagColor },
  { id: 'design', label: 'Design', count: 8, color: 'pink' as TagColor },
  { id: 'react', label: 'React', count: 12, color: 'blue' as TagColor },
  { id: 'typescript', label: 'TypeScript', count: 9, color: 'blue' as TagColor },
  { id: 'news', label: 'News', count: 5, color: 'red' as TagColor },
  { id: 'productivity', label: 'Productivity', count: 7, color: 'yellow' as TagColor },
  { id: 'finance', label: 'Finance', count: 3, color: 'green' as TagColor },
];

const availableSources = [
  { id: 'hackernews', label: 'Hacker News', count: 30 },
  { id: 'dense-discovery', label: 'Dense Discovery', count: 12 },
  { id: 'techcrunch', label: 'TechCrunch', count: 8 },
  { id: 'morning-brew', label: 'Morning Brew', count: 15 },
  { id: 'vercel', label: 'Vercel Blog', count: 5 },
];

const contentTypeOptions: { id: ContentType; label: string; count: number }[] = [
  { id: 'newsletters', label: 'Newsletters', count: 25 },
  { id: 'rss', label: 'RSS Feeds', count: 45 },
  { id: 'articles', label: 'Articles', count: 18 },
  { id: 'videos', label: 'Videos', count: 8 },
  { id: 'podcasts', label: 'Podcasts', count: 6 },
];

const readingTimeOptions: { id: ReadingTime; label: string }[] = [
  { id: 'quick', label: 'Quick (< 5 min)' },
  { id: 'medium', label: 'Medium (5-15 min)' },
  { id: 'long', label: 'Long (15+ min)' },
];

const readingStatusOptions: { id: ReadingStatus; label: string }[] = [
  { id: 'unread', label: 'Unread' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

const tagColorClasses: Record<TagColor, string> = {
  red: 'bg-tag-red',
  orange: 'bg-tag-orange',
  yellow: 'bg-tag-yellow',
  green: 'bg-tag-green',
  blue: 'bg-tag-blue',
  purple: 'bg-tag-purple',
  pink: 'bg-tag-pink',
  gray: 'bg-tag-gray',
};

const emptyFilters: FilterState = {
  tags: [],
  sources: [],
  contentTypes: [],
  readingTime: [],
  readingStatus: [],
};

const FilterBar = ({
  viewMode,
  onViewModeChange,
  density,
  onDensityChange,
  sortBy,
  onSortChange,
  onLabelsClick,
  filters = emptyFilters,
  onFiltersChange,
}: FilterBarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  
  const activeFilterCount = 
    localFilters.tags.length + 
    localFilters.sources.length + 
    localFilters.contentTypes.length + 
    localFilters.readingTime.length +
    localFilters.readingStatus.length;
  
  const toggleFilter = <K extends keyof FilterState>(
    category: K,
    value: FilterState[K][number]
  ) => {
    setLocalFilters(prev => {
      const current = prev[category] as string[];
      const updated = current.includes(value as string)
        ? current.filter(v => v !== value)
        : [...current, value as string];
      return { ...prev, [category]: updated };
    });
  };
  
  const clearAllFilters = () => {
    setLocalFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
  };
  
  const applyFilters = () => {
    onFiltersChange?.(localFilters);
    setIsFilterOpen(false);
  };
  
  const removeFilter = (category: keyof FilterState, value: string) => {
    const updated = {
      ...localFilters,
      [category]: (localFilters[category] as string[]).filter(v => v !== value),
    };
    setLocalFilters(updated);
    onFiltersChange?.(updated);
  };
  
  return (
    <div className="space-y-2 py-3 mb-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filters */}
        <div className="flex items-center gap-2">
          {/* Filter Popover */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-2 h-8',
                  activeFilterCount > 0 && 'border-accent text-accent'
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="bg-accent text-accent-foreground text-micro px-1.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-0 bg-popover border-border z-50" 
              align="start"
              sideOffset={8}
            >
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-5">
                  {/* Tags Section */}
                  <div>
                    <h4 className="text-micro uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      By Tag
                    </h4>
                    <div className="space-y-1">
                      {availableTags.map(tag => (
                        <label
                          key={tag.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={localFilters.tags.includes(tag.id)}
                            onCheckedChange={() => toggleFilter('tags', tag.id)}
                          />
                          <span className={cn('w-2 h-2 rounded-full', tagColorClasses[tag.color])} />
                          <span className="flex-1 text-body">{tag.label}</span>
                          <span className="text-micro text-muted-foreground">{tag.count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sources Section */}
                  <div>
                    <h4 className="text-micro uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      By Source
                    </h4>
                    <div className="space-y-1">
                      {availableSources.map(source => (
                        <label
                          key={source.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={localFilters.sources.includes(source.id)}
                            onCheckedChange={() => toggleFilter('sources', source.id)}
                          />
                          <span className="flex-1 text-body">{source.label}</span>
                          <span className="text-micro text-muted-foreground">{source.count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Content Type Section */}
                  <div>
                    <h4 className="text-micro uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      By Content Type
                    </h4>
                    <div className="space-y-1">
                      {contentTypeOptions.map(type => (
                        <label
                          key={type.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={localFilters.contentTypes.includes(type.id)}
                            onCheckedChange={() => toggleFilter('contentTypes', type.id)}
                          />
                          <span className="flex-1 text-body">{type.label}</span>
                          <span className="text-micro text-muted-foreground">{type.count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Reading Time Section */}
                  <div>
                    <h4 className="text-micro uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      By Reading Time
                    </h4>
                    <div className="space-y-1">
                      {readingTimeOptions.map(time => (
                        <label
                          key={time.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={localFilters.readingTime.includes(time.id)}
                            onCheckedChange={() => toggleFilter('readingTime', time.id)}
                          />
                          <span className="text-body">{time.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Reading Status Section */}
                  <div>
                    <h4 className="text-micro uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      By Status
                    </h4>
                    <div className="space-y-1">
                      {readingStatusOptions.map(status => (
                        <label
                          key={status.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={localFilters.readingStatus.includes(status.id)}
                            onCheckedChange={() => toggleFilter('readingStatus', status.id)}
                          />
                          <span className="text-body">{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              {/* Footer */}
              <div className="border-t border-border p-3 flex items-center justify-between bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
                <Button
                  size="sm"
                  onClick={applyFilters}
                  className="bg-accent hover:bg-accent/90"
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 gap-1">
                {sortLabels[sortBy]}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border-border z-50">
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => onSortChange(option)}
                  className={cn(
                    'text-body cursor-pointer',
                    sortBy === option && 'text-brand-yellow font-medium'
                  )}
                >
                  {sortLabels[option]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Right: View controls */}
        <div className="flex items-center gap-2">
          {/* Density toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{densityLabels[density]}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border z-50">
              {(Object.keys(densityLabels) as DensityMode[]).map((mode) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onDensityChange(mode)}
                  className={cn(
                    'text-body cursor-pointer',
                    density === mode && 'text-brand-yellow font-medium'
                  )}
                >
                  {densityLabels[mode]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View mode toggle */}
          <div className="flex items-center bg-muted rounded-md p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {localFilters.tags.map(tagId => {
            const tag = availableTags.find(t => t.id === tagId);
            return tag ? (
              <button
                key={`tag-${tagId}`}
                onClick={() => removeFilter('tags', tagId)}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent/10 border border-accent/30 rounded-full text-micro text-accent hover:bg-accent/20 transition-colors"
              >
                <span className={cn('w-2 h-2 rounded-full', tagColorClasses[tag.color])} />
                {tag.label}
                <X className="w-3 h-3" />
              </button>
            ) : null;
          })}
          {localFilters.sources.map(sourceId => {
            const source = availableSources.find(s => s.id === sourceId);
            return source ? (
              <button
                key={`source-${sourceId}`}
                onClick={() => removeFilter('sources', sourceId)}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded-full text-micro text-foreground hover:bg-muted/80 transition-colors"
              >
                {source.label}
                <X className="w-3 h-3" />
              </button>
            ) : null;
          })}
          {localFilters.contentTypes.map(typeId => {
            const type = contentTypeOptions.find(t => t.id === typeId);
            return type ? (
              <button
                key={`type-${typeId}`}
                onClick={() => removeFilter('contentTypes', typeId)}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded-full text-micro text-foreground hover:bg-muted/80 transition-colors"
              >
                {type.label}
                <X className="w-3 h-3" />
              </button>
            ) : null;
          })}
          {localFilters.readingTime.map(timeId => {
            const time = readingTimeOptions.find(t => t.id === timeId);
            return time ? (
              <button
                key={`time-${timeId}`}
                onClick={() => removeFilter('readingTime', timeId)}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded-full text-micro text-foreground hover:bg-muted/80 transition-colors"
              >
                {time.label}
                <X className="w-3 h-3" />
              </button>
            ) : null;
          })}
          {localFilters.readingStatus.map(statusId => {
            const status = readingStatusOptions.find(s => s.id === statusId);
            return status ? (
              <button
                key={`status-${statusId}`}
                onClick={() => removeFilter('readingStatus', statusId)}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded-full text-micro text-foreground hover:bg-muted/80 transition-colors"
              >
                {status.label}
                <X className="w-3 h-3" />
              </button>
            ) : null;
          })}
          <button
            onClick={clearAllFilters}
            className="text-micro text-accent hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
