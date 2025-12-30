import { useState } from 'react';
import { Search, Plus, Tag, LayoutList, CheckSquare, ChevronDown, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type SortOption = 'recent' | 'oldest' | 'reading-time' | 'title';

interface ContentHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onLabelsClick: () => void;
  isSelectMode: boolean;
  onSelectModeToggle: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortLabels: Record<SortOption, string> = {
  recent: 'Recent',
  oldest: 'Oldest',
  'reading-time': 'Reading time',
  title: 'Title',
};

const ContentHeader = ({
  searchQuery,
  onSearchChange,
  onAddClick,
  onLabelsClick,
  isSelectMode,
  onSelectModeToggle,
  sortBy,
  onSortChange,
}: ContentHeaderProps) => {
  return (
    <div className="space-y-3 mb-4">
      {/* Search + Add Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search saved items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border focus:border-accent"
          />
        </div>
        <Button
          onClick={onAddClick}
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-medium gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Filter Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Labels Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onLabelsClick}
            className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow/10 gap-2"
          >
            <Tag className="w-4 h-4" />
            Labels
          </Button>

          {/* List Toggle - simplified */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground px-2"
          >
            <LayoutList className="w-4 h-4" />
          </Button>

          {/* Select Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectModeToggle}
            className={cn(
              'gap-2',
              isSelectMode
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-foreground hover:bg-muted'
            )}
          >
            <CheckSquare className="w-4 h-4" />
            Select
          </Button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-caption text-muted-foreground">Sort:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-foreground gap-1">
                {sortLabels[sortBy]}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => onSortChange(option)}
                  className={cn(
                    'text-body cursor-pointer',
                    sortBy === option && 'text-brand-yellow'
                  )}
                >
                  {sortLabels[option]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

export default ContentHeader;
