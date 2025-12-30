import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Search, Filter, Download, ExternalLink, Copy, Trash2, BookOpen, Highlighter, Sparkles, Tag, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Highlight, HighlightColor, Tag as TagType } from '@/types/article';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import TagChip from '@/components/library/TagChip';
import AddContentModal from '@/components/modals/AddContentModal';

// Extended highlight with tags
interface HighlightWithTags extends Highlight {
  articleTitle: string;
  author?: string;
  sourceName: string;
  tags?: TagType[];
}

// Mock highlights data with tags and notes
const mockHighlights: HighlightWithTags[] = [
  {
    id: 'h1',
    text: 'Large language models represent a fundamental shift in how we interact with computers. The implications for software development are profound.',
    color: 'blue',
    articleId: '11',
    articleTitle: 'The Future of AI: How Large Language Models Are Reshaping Software...',
    author: 'Paul Graham',
    sourceName: 'Hacker News',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    note: 'This connects to my thesis about developer productivity. LLMs as "cognitive amplifiers" rather than replacements. Need to explore how this changes the economics of software projects.',
    tags: [
      { id: 't1', label: 'machine-learning', color: 'blue' },
      { id: 't2', label: 'transformers', color: 'purple' },
      { id: 't9', label: 'thesis-research', color: 'red' },
    ],
  },
  {
    id: 'h2',
    text: 'Users perceive aesthetically pleasing designs as more usable. This cognitive bias explains why investing in visual design improves user satisfaction and conversion rates.',
    color: 'yellow',
    articleId: '6',
    articleTitle: 'The Aesthetic-Usability Effect: Why Beautiful Design Feels Easier to Use',
    author: 'Kate Moran',
    sourceName: 'Nielsen Norman Group',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    note: 'Key insight for the product redesign. Beauty ≠ usability, but perceived usability. Users forgive minor usability issues when the interface feels polished. Counter-intuitive but well-documented.',
    tags: [
      { id: 't3', label: 'design', color: 'pink' },
      { id: 't4', label: 'ux', color: 'green' },
      { id: 't10', label: 'product-redesign', color: 'orange' },
    ],
  },
  {
    id: 'h3',
    text: 'React Server Components allow you to write UI that can be rendered and optionally cached on the server, reducing bundle size significantly.',
    color: 'green',
    articleId: '12',
    articleTitle: 'Understanding React Server Components: A Deep Dive',
    author: 'Dan Abramov',
    sourceName: "Dan Abramov's Blog",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    tags: [
      { id: 't5', label: 'react', color: 'blue' },
      { id: 't6', label: 'performance', color: 'orange' },
    ],
  },
  {
    id: 'h4',
    text: 'In a world obsessed with hustle culture, what if doing less could actually help you achieve more meaningful work? The key is deep focus.',
    color: 'purple',
    articleId: '9',
    articleTitle: 'The Case for Slow Productivity',
    author: 'Cal Newport',
    sourceName: 'Cal Newport',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    note: 'Resonates with the burnout research. "Slow productivity" as antidote. Three principles: 1) Do fewer things, 2) Work at a natural pace, 3) Obsess over quality. Compare with Newport\'s earlier work on Deep Work.',
    tags: [
      { id: 't7', label: 'productivity', color: 'yellow' },
      { id: 't11', label: 'personal-development', color: 'green' },
    ],
  },
  {
    id: 'h5',
    text: 'The best journalism has always been about truth-telling and holding power accountable. AI can help us do this better, but cannot replace human judgment.',
    color: 'orange',
    articleId: '1',
    articleTitle: 'The Daily',
    author: 'Michael Barbaro',
    sourceName: 'The Daily',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    note: 'AI ethics thread: the distinction between augmentation and replacement. In creative/judgment work, AI serves as amplifier not substitute. Cross-reference with the LLM highlight above.',
    tags: [
      { id: 't8', label: 'ethics', color: 'red' },
      { id: 't1', label: 'machine-learning', color: 'blue' },
    ],
  },
  {
    id: 'h6',
    text: 'The attention economy is not designed to help you think clearly. It is designed to capture and monetize your mental bandwidth.',
    color: 'red',
    articleId: '15',
    articleTitle: 'Stolen Focus: Why You Can\'t Pay Attention',
    author: 'Johann Hari',
    sourceName: 'Blinkist',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    note: 'This is the systemic context for Newport\'s slow productivity. Individual solutions (deep work) vs structural problems (attention economy). Both matter. Building personal systems while acknowledging the larger forces.',
    tags: [
      { id: 't7', label: 'productivity', color: 'yellow' },
      { id: 't8', label: 'ethics', color: 'red' },
      { id: 't12', label: 'attention', color: 'purple' },
    ],
  },
  {
    id: 'h7',
    text: 'The most successful companies treat design as a competitive advantage, not a cost center. Design-led companies outperform the S&P 500 by 219%.',
    color: 'yellow',
    articleId: '16',
    articleTitle: 'The Business Value of Design',
    author: 'McKinsey & Company',
    sourceName: 'McKinsey Quarterly',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    note: 'Hard data to support the design investment argument. Combine with the aesthetic-usability effect research for the exec presentation. Design ROI is measurable.',
    tags: [
      { id: 't3', label: 'design', color: 'pink' },
      { id: 't10', label: 'product-redesign', color: 'orange' },
      { id: 't13', label: 'business-case', color: 'blue' },
    ],
  },
  {
    id: 'h8',
    text: 'Transformer architecture enables attention mechanisms that can process entire sequences in parallel, fundamentally changing what\'s computationally tractable.',
    color: 'blue',
    articleId: '17',
    articleTitle: 'Attention Is All You Need - Explained',
    author: 'Jay Alammar',
    sourceName: 'The Illustrated Transformer',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    note: 'The technical foundation for the LLM revolution. Parallelization + attention = scale. This explains WHY the last 5 years happened. Essential for the thesis background chapter.',
    tags: [
      { id: 't1', label: 'machine-learning', color: 'blue' },
      { id: 't2', label: 'transformers', color: 'purple' },
      { id: 't9', label: 'thesis-research', color: 'red' },
    ],
  },
];

const colorFilters: { value: HighlightColor | 'all'; label: string; dotClass?: string }[] = [
  { value: 'all', label: 'All Colors' },
  { value: 'yellow', label: 'Yellow', dotClass: 'bg-tag-yellow' },
  { value: 'green', label: 'Green', dotClass: 'bg-tag-green' },
  { value: 'blue', label: 'Blue', dotClass: 'bg-tag-blue' },
  { value: 'purple', label: 'Purple', dotClass: 'bg-tag-purple' },
  { value: 'red', label: 'Red', dotClass: 'bg-tag-red' },
  { value: 'orange', label: 'Orange', dotClass: 'bg-tag-orange' },
];

// Get all unique tags from highlights
const getAllTags = (highlights: HighlightWithTags[]): TagType[] => {
  const tagMap = new Map<string, TagType>();
  highlights.forEach(h => {
    h.tags?.forEach(tag => {
      if (!tagMap.has(tag.id)) {
        tagMap.set(tag.id, tag);
      }
    });
  });
  return Array.from(tagMap.values());
};

const Highlights = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [searchParams] = useSearchParams();
  const topicFilter = searchParams.get('topic');
  
  const [highlights, setHighlights] = useState(mockHighlights);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<HighlightColor | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'markdown-grouped' | 'json' | 'text'>('markdown');
  const [exportOptions, setExportOptions] = useState({
    includeCitations: true,
    includeTags: true,
    includeTimestamps: true,
    includeLinks: false,
    includeNotes: true,
  });
  const [activeSection, setActiveSection] = useState('highlights');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);

  const allTags = useMemo(() => getAllTags(highlights), [highlights]);

  const filteredHighlights = useMemo(() => {
    return highlights.filter(h => {
      if (colorFilter !== 'all' && h.color !== colorFilter) return false;
      
      // Tag filtering (AND logic)
      if (selectedTags.length > 0) {
        const highlightTagIds = h.tags?.map(t => t.id) || [];
        const hasAllSelectedTags = selectedTags.every(tagId => highlightTagIds.includes(tagId));
        if (!hasAllSelectedTags) return false;
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          h.text.toLowerCase().includes(query) ||
          h.articleTitle.toLowerCase().includes(query) ||
          h.author?.toLowerCase().includes(query) ||
          h.sourceName.toLowerCase().includes(query) ||
          h.tags?.some(t => t.label.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [highlights, searchQuery, colorFilter, selectedTags]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const handleCopyHighlight = (highlight: HighlightWithTags) => {
    const tags = highlight.tags?.map(t => `#${t.label}`).join(' ') || '';
    const citation = `"${highlight.text}"\n\n— ${highlight.author || 'Unknown'}, ${highlight.articleTitle}${tags ? `\nTags: ${tags}` : ''}`;
    navigator.clipboard.writeText(citation);
    toast.success('Copied with citation');
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    toast.success('Highlight deleted');
  };

  const handleTagClick = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearTagFilter = (tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  const generateExport = () => {
    let content = '';

    if (exportFormat === 'markdown-grouped') {
      // Group by tag
      content = '# Highlights from Omnivore\n\n';
      content += `_Exported on ${new Date().toLocaleDateString()}_\n\n`;
      
      if (exportOptions.includeTags && selectedTags.length > 0) {
        const tagLabels = selectedTags.map(id => allTags.find(t => t.id === id)?.label).filter(Boolean);
        content += `**Tags**: ${tagLabels.map(l => `#${l}`).join(', ')}\n`;
      }
      content += `**Highlights**: ${filteredHighlights.length}\n\n---\n\n`;

      // Group by first tag
      const byTag = new Map<string, HighlightWithTags[]>();
      filteredHighlights.forEach(h => {
        const primaryTag = h.tags?.[0]?.label || 'Untagged';
        if (!byTag.has(primaryTag)) byTag.set(primaryTag, []);
        byTag.get(primaryTag)!.push(h);
      });

      byTag.forEach((highlights, tagLabel) => {
        content += `## #${tagLabel} (${highlights.length} highlights)\n\n`;
        highlights.forEach(h => {
          content += `### ${h.articleTitle}\n`;
          if (exportOptions.includeCitations) {
            content += `**Author**: ${h.author || 'Unknown'}  \n`;
            content += `**Source**: ${h.sourceName}\n\n`;
          }
          content += `> "${h.text}"\n\n`;
          if (h.note && exportOptions.includeNotes) {
            content += `**Note**: ${h.note}\n\n`;
          }
          if (exportOptions.includeTags && h.tags) {
            content += `**Tags**: ${h.tags.map(t => `#${t.label}`).join(', ')}\n\n`;
          }
          if (exportOptions.includeTimestamps) {
            content += `_Highlighted ${getTimeAgo(h.createdAt)}_\n\n`;
          }
        });
        content += '---\n\n';
      });
    } else if (exportFormat === 'markdown') {
      content = '# Highlights from Omnivore\n\n';
      content += `_Exported on ${new Date().toLocaleDateString()}_\n\n---\n\n`;
      
      const grouped = filteredHighlights.reduce((acc, h) => {
        if (!acc[h.articleId]) acc[h.articleId] = { title: h.articleTitle, author: h.author, source: h.sourceName, highlights: [] };
        acc[h.articleId].highlights.push(h);
        return acc;
      }, {} as Record<string, { title: string; author?: string; source: string; highlights: HighlightWithTags[] }>);

      Object.values(grouped).forEach(group => {
        content += `## ${group.title}\n\n`;
        if (exportOptions.includeCitations) {
          content += `**Author**: ${group.author || 'Unknown'}  \n`;
          content += `**Source**: ${group.source}\n\n`;
        }
        group.highlights.forEach(h => {
          content += `> "${h.text}"\n\n`;
          if (h.note && exportOptions.includeNotes) {
            content += `**Note**: ${h.note}\n\n`;
          }
          if (exportOptions.includeTags && h.tags) {
            content += `**Tags**: ${h.tags.map(t => `#${t.label}`).join(', ')}\n\n`;
          }
          if (exportOptions.includeTimestamps) {
            content += `_Highlighted ${getTimeAgo(h.createdAt)}_\n\n`;
          }
        });
        content += '---\n\n';
      });
    } else if (exportFormat === 'json') {
      content = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          count: filteredHighlights.length,
          highlights: filteredHighlights.map(h => ({
            id: h.id,
            text: h.text,
            color: h.color,
            article: {
              title: h.articleTitle,
              author: h.author,
              source: h.sourceName,
            },
            tags: h.tags?.map(t => t.label) || [],
            note: h.note,
            createdAt: h.createdAt.toISOString(),
          })),
        },
        null,
        2
      );
    } else {
      content = 'HIGHLIGHTS FROM OMNIVORE\n';
      content += `Exported on ${new Date().toLocaleDateString()}\n`;
      content += '='.repeat(50) + '\n\n';
      
      filteredHighlights.forEach(h => {
        content += `${h.articleTitle}\n`;
        if (exportOptions.includeCitations) {
          content += `By ${h.author || 'Unknown'} (${h.sourceName})\n`;
        }
        if (exportOptions.includeTags && h.tags) {
          content += `Tags: ${h.tags.map(t => `#${t.label}`).join(', ')}\n`;
        }
        content += '\n';
        content += `"${h.text}"\n\n`;
        if (h.note && exportOptions.includeNotes) {
          content += `Note: ${h.note}\n\n`;
        }
        content += '-'.repeat(50) + '\n\n';
      });
    }

    return content;
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(generateExport());
    toast.success('Copied to clipboard');
    setShowExportModal(false);
  };

  const handleDownloadExport = () => {
    const content = generateExport();
    const extension = exportFormat === 'json' ? 'json' : exportFormat.startsWith('markdown') ? 'md' : 'txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnivore-highlights-${new Date().toISOString().split('T')[0]}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
    setShowExportModal(false);
  };

  const getHighlightBorderColor = (color: HighlightColor) => {
    const colors: Record<HighlightColor, string> = {
      yellow: 'border-l-tag-yellow',
      green: 'border-l-tag-green',
      blue: 'border-l-tag-blue',
      purple: 'border-l-tag-purple',
      red: 'border-l-tag-red',
      orange: 'border-l-tag-orange',
    };
    return colors[color];
  };

  const getHighlightBgColor = (color: HighlightColor) => {
    const colors: Record<HighlightColor, string> = {
      yellow: 'bg-tag-yellow/10',
      green: 'bg-tag-green/10',
      blue: 'bg-tag-blue/10',
      purple: 'bg-tag-purple/10',
      red: 'bg-tag-red/10',
      orange: 'bg-tag-orange/10',
    };
    return colors[color];
  };

  const getHighlightDotColor = (color: HighlightColor) => {
    const colors: Record<HighlightColor, string> = {
      yellow: 'bg-tag-yellow',
      green: 'bg-tag-green',
      blue: 'bg-tag-blue',
      purple: 'bg-tag-purple',
      red: 'bg-tag-red',
      orange: 'bg-tag-orange',
    };
    return colors[color];
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          if (section === 'library') navigate('/library');
          if (section === 'today') navigate('/today');
          setIsMobileMenuOpen(false);
        }}
        className="hidden lg:flex"
      />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={(section) => {
              setActiveSection(section);
              if (section === 'library') navigate('/library');
              if (section === 'today') navigate('/today');
              setIsMobileMenuOpen(false);
            }}
            className="w-full border-0"
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => setIsAddContentModalOpen(true)}
          onSettingsClick={() => navigate('/settings')}
          onProfileClick={() => navigate('/profile')}
          onLogoutClick={() => {
            logout();
            navigate('/login');
          }}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                  <Highlighter className="w-6 h-6 text-accent" />
                  Highlights
                </h1>
                <p className="text-muted-foreground text-caption">
                  {filteredHighlights.length} highlight{filteredHighlights.length !== 1 ? 's' : ''} across {new Set(filteredHighlights.map(h => h.articleId)).size} articles
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Color filter chips */}
                <div className="hidden md:flex items-center gap-1 mr-2">
                  {colorFilters.slice(0, 5).map(f => (
                    <button
                      key={f.value}
                      onClick={() => setColorFilter(f.value)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-all flex items-center justify-center',
                        f.dotClass || 'bg-muted',
                        colorFilter === f.value 
                          ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' 
                          : 'opacity-60 hover:opacity-100'
                      )}
                      title={f.label}
                    >
                      {f.value === 'all' && (
                        <Sparkles className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tag Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                      {selectedTags.length > 0 && (
                        <span className="bg-accent text-accent-foreground text-micro px-1.5 rounded-full">
                          {selectedTags.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allTags.map(tag => (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={() => handleTagClick(tag.id)}
                      >
                        <span className="flex items-center gap-2">
                          <TagChip tag={tag} />
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))}
                    {allTags.length === 0 && (
                      <div className="px-2 py-1.5 text-caption text-muted-foreground">No tags found</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select value={colorFilter} onValueChange={(v) => setColorFilter(v as HighlightColor | 'all')}>
                  <SelectTrigger className="w-[140px] h-9 md:hidden">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorFilters.map(f => (
                      <SelectItem key={f.value} value={f.value}>
                        <span className="flex items-center gap-2">
                          {f.dotClass && <span className={cn('w-3 h-3 rounded-full', f.dotClass)} />}
                          {f.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Active Tag Filters */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-caption text-muted-foreground">Filtered by:</span>
                {selectedTags.map(tagId => {
                  const tag = allTags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <button
                      key={tagId}
                      onClick={() => clearTagFilter(tagId)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-caption hover:bg-accent/30 transition-colors"
                    >
                      #{tag.label}
                      <span className="ml-1">×</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-caption text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Highlights List */}
            {filteredHighlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Highlighter className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-heading font-semibold text-foreground mb-2">
                  No highlights yet
                </h2>
                <p className="text-body text-muted-foreground max-w-sm mb-4">
                  Start reading and highlighting to build your knowledge base.
                </p>
                <Button onClick={() => navigate('/library')} variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Library
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredHighlights.map((highlight, index) => (
                    <motion.div
                      key={highlight.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        'group bg-card rounded-lg overflow-hidden border-l-4 transition-all hover:shadow-md',
                        getHighlightBorderColor(highlight.color)
                      )}
                    >
                      <div className={cn('p-4', getHighlightBgColor(highlight.color))}>
                        {/* Highlight text with quote styling */}
                        <div className="relative">
                          <span className="absolute -left-1 -top-2 text-4xl text-muted-foreground/20 font-serif">"</span>
                          <p className="text-foreground/90 text-body leading-relaxed pl-4">
                            {highlight.text}
                          </p>
                        </div>
                        
                        {/* Note section */}
                        {highlight.note && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <div className="flex items-start gap-2">
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-caption text-muted-foreground italic leading-relaxed">
                                {highlight.note}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-3 bg-card border-t border-border/50">
                        {/* Tags Row */}
                        {highlight.tags && highlight.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {highlight.tags.map(tag => (
                              <button
                                key={tag.id}
                                onClick={() => handleTagClick(tag.id)}
                                className="transition-transform hover:scale-105"
                              >
                                <TagChip tag={tag} />
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', getHighlightDotColor(highlight.color))} />
                            <div className="text-caption text-muted-foreground truncate">
                              <span className="text-foreground/70 font-medium">
                                {highlight.articleTitle.length > 50 
                                  ? highlight.articleTitle.slice(0, 50) + '...' 
                                  : highlight.articleTitle}
                              </span>
                              <span className="mx-2">·</span>
                              <span>{highlight.author || 'Unknown'}</span>
                              <span className="mx-2">·</span>
                              <span>{getTimeAgo(highlight.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/reader/${highlight.articleId}`)}
                              className="h-8 gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toast.info('Edit tags coming soon!')}
                              className="h-8 gap-1.5"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit Tags</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyHighlight(highlight)}
                              className="h-8 gap-1.5"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Copy</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHighlight(highlight.id)}
                              className="h-8 gap-1.5 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-accent" />
              Export Highlights
            </DialogTitle>
            <DialogDescription>
              Export {filteredHighlights.length} highlight{filteredHighlights.length !== 1 ? 's' : ''} to your preferred format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-caption text-muted-foreground mb-2 block">Format</label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as typeof exportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-micro">MD</span>
                      Markdown - Chronological
                    </span>
                  </SelectItem>
                  <SelectItem value="markdown-grouped">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-micro">MD</span>
                      Markdown - Grouped by Tag ✨
                    </span>
                  </SelectItem>
                  <SelectItem value="json">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-micro">{'{}'}</span>
                      JSON (.json)
                    </span>
                  </SelectItem>
                  <SelectItem value="text">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-micro">TXT</span>
                      Plain Text (.txt)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportFormat !== 'json' && (
              <div>
                <label className="text-caption text-muted-foreground mb-2 block">Include</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={exportOptions.includeCitations}
                      onCheckedChange={(c) => setExportOptions(o => ({ ...o, includeCitations: !!c }))}
                    />
                    <span className="text-sm">Source citations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={exportOptions.includeTags}
                      onCheckedChange={(c) => setExportOptions(o => ({ ...o, includeTags: !!c }))}
                    />
                    <span className="text-sm">Tags</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={exportOptions.includeTimestamps}
                      onCheckedChange={(c) => setExportOptions(o => ({ ...o, includeTimestamps: !!c }))}
                    />
                    <span className="text-sm">Timestamps</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={exportOptions.includeNotes}
                      onCheckedChange={(c) => setExportOptions(o => ({ ...o, includeNotes: !!c }))}
                    />
                    <span className="text-sm">Notes</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="text-caption text-muted-foreground mb-2 block">Preview</label>
              <div className="bg-muted rounded-lg p-3 max-h-48 overflow-auto">
                <pre className="text-caption text-foreground/80 whitespace-pre-wrap font-mono">
                  {generateExport().slice(0, 600)}
                  {generateExport().length > 600 && '\n...'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCopyExport}>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button onClick={handleDownloadExport}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Content Modal */}
      <AddContentModal
        open={isAddContentModalOpen}
        onOpenChange={setIsAddContentModalOpen}
      />
    </div>
  );
};

export default Highlights;