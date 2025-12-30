import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, Tag as TagIcon, ExternalLink, MoreHorizontal, Minus, Plus, ChevronRight, Highlighter, Copy, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { mockArticles } from '@/data/mockArticles';
import type { Article, Highlight, HighlightColor, Tag } from '@/types/article';
import TagChip from '@/components/library/TagChip';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const highlightColors: { color: HighlightColor; label: string; bgClass: string; key: string }[] = [
  { color: 'yellow', label: 'Yellow', bgClass: 'bg-tag-yellow', key: '1' },
  { color: 'green', label: 'Green', bgClass: 'bg-tag-green', key: '2' },
  { color: 'blue', label: 'Blue', bgClass: 'bg-tag-blue', key: '3' },
  { color: 'purple', label: 'Purple', bgClass: 'bg-tag-purple', key: '4' },
  { color: 'red', label: 'Red', bgClass: 'bg-tag-red', key: '5' },
  { color: 'orange', label: 'Orange', bgClass: 'bg-tag-orange', key: '6' },
];

// Mock available tags for autocomplete
const availableTags: Tag[] = [
  { id: 't1', label: 'machine-learning', color: 'purple' },
  { id: 't2', label: 'ethics', color: 'red' },
  { id: 't3', label: 'transformers', color: 'blue' },
  { id: 't4', label: 'programming', color: 'green' },
  { id: 't5', label: 'design', color: 'pink' },
  { id: 't6', label: 'productivity', color: 'yellow' },
  { id: 't7', label: 'ai', color: 'purple' },
  { id: 't8', label: 'research', color: 'blue' },
];

// Mock article content with better typography
const mockContent = `
<p class="lead">This is what the news should sound like. The biggest stories of our time, told by the best journalists in the world. Hosted by Michael Barbaro and Sabrina Tavernise. Twenty minutes a day, five days a week, ready by 6 a.m.</p>

<h2>The Rise of AI in Journalism</h2>

<p>In recent years, artificial intelligence has begun to reshape the media landscape in profound ways. From automated article generation to personalized content recommendations, AI is becoming an integral part of how news is created and consumed.</p>

<p>The implications of this shift are far-reaching. On one hand, AI tools can help journalists work more efficiently, allowing them to focus on investigative work and human-interest stories that require empathy and judgment. On the other hand, there are legitimate concerns about the potential for AI-generated misinformation and the displacement of human journalists.</p>

<h2>Key Takeaways</h2>

<ul>
<li>AI is transforming how news is produced and consumed</li>
<li>Efficiency gains allow journalists to focus on high-value work</li>
<li>Concerns about misinformation and job displacement remain</li>
<li>The future likely involves human-AI collaboration</li>
</ul>

<p>As we move forward, the challenge will be to harness the benefits of AI while mitigating its risks. This will require thoughtful regulation, industry self-governance, and a commitment to maintaining the highest standards of journalistic integrity.</p>

<blockquote>
<p>"The best journalism has always been about truth-telling and holding power accountable. AI can help us do this better, but it cannot replace the human judgment at the heart of good journalism."</p>
</blockquote>

<p>The conversation about AI in journalism is just beginning. As technology continues to evolve, so too will the ways we create and consume news. What remains constant is the fundamental mission of journalism: to inform, to illuminate, and to empower citizens in a democracy.</p>

<h2>Looking Ahead</h2>

<p>The next decade will be crucial in determining how AI shapes the future of journalism. News organizations that embrace AI thoughtfully—using it to enhance rather than replace human judgment—will likely thrive. Those that resist change entirely may find themselves left behind.</p>

<p>But perhaps the most important question is not whether AI will transform journalism, but how we ensure that transformation serves the public interest. That's a question that journalists, technologists, policymakers, and citizens must answer together.</p>
`;

const Reader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [showHighlightsSidebar, setShowHighlightsSidebar] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  
  // Highlight form state
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');
  const [highlightTags, setHighlightTags] = useState<Tag[]>([]);
  const [highlightNote, setHighlightNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showExpandedPopup, setShowExpandedPopup] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const found = mockArticles.find(a => a.id === id);
    if (found) {
      setArticle({ ...found, content: mockContent });
      setProgress(found.progress);
    }
  }, [id]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollPercentage = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
      setProgress(Math.min(100, Math.round(scrollPercentage)));
    };

    const scrollArea = document.querySelector('[data-reader-scroll]');
    scrollArea?.addEventListener('scroll', handleScroll);
    return () => scrollArea?.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Font size shortcuts
      if (e.key === '-' || e.key === '_') {
        setFontSize(s => Math.max(14, s - 2));
      } else if (e.key === '+' || e.key === '=') {
        setFontSize(s => Math.min(24, s + 2));
      }
      
      // Highlight shortcuts when text is selected
      if (showHighlightPopup && selectedText && !showExpandedPopup) {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 6) {
          const color = highlightColors[keyNum - 1];
          if (color) handleQuickHighlight(color.color);
        }
      }
      
      // Escape to close popup
      if (e.key === 'Escape') {
        setShowHighlightPopup(false);
        window.getSelection()?.removeAllRanges();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHighlightPopup, selectedText]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString());
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setShowHighlightPopup(true);
      // Reset form state for new highlight
      setSelectedColor('yellow');
      setHighlightTags([]);
      setHighlightNote('');
      setTagInput('');
      setShowExpandedPopup(false);
    } else {
      setShowHighlightPopup(false);
    }
  };

  // Quick highlight (just color, no tags/note)
  const handleQuickHighlight = useCallback((color: HighlightColor) => {
    if (selectedText && article) {
      const newHighlight: Highlight = {
        id: `h-${Date.now()}`,
        text: selectedText,
        color,
        articleId: article.id,
        createdAt: new Date(),
      };
      setHighlights(prev => [...prev, newHighlight]);
      setShowHighlightPopup(false);
      setShowExpandedPopup(false);
      window.getSelection()?.removeAllRanges();
      toast.success('Highlight saved', {
        description: `Press ${highlightColors.findIndex(h => h.color === color) + 1} to quickly highlight in ${color}`,
      });
    }
  }, [selectedText, article]);

  // Full highlight with tags and note
  const handleSaveHighlight = useCallback(() => {
    if (selectedText && article) {
      const newHighlight: Highlight = {
        id: `h-${Date.now()}`,
        text: selectedText,
        color: selectedColor,
        articleId: article.id,
        createdAt: new Date(),
        note: highlightNote || undefined,
        tags: highlightTags.length > 0 ? highlightTags : undefined,
      };
      setHighlights(prev => [...prev, newHighlight]);
      setShowHighlightPopup(false);
      setShowExpandedPopup(false);
      window.getSelection()?.removeAllRanges();
      
      const tagCount = highlightTags.length;
      toast.success(tagCount > 0 ? `Highlight saved with ${tagCount} tag${tagCount > 1 ? 's' : ''}! 💡` : 'Highlight saved! 💡');
    }
  }, [selectedText, article, selectedColor, highlightNote, highlightTags]);

  // Tag autocomplete
  const filteredTags = availableTags.filter(
    tag => tag.label.toLowerCase().includes(tagInput.toLowerCase()) &&
    !highlightTags.some(t => t.id === tag.id)
  );

  const handleAddTag = (tag: Tag) => {
    setHighlightTags(prev => [...prev, tag]);
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setHighlightTags(prev => prev.filter(t => t.id !== tagId));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredTags.length > 0) {
      e.preventDefault();
      handleAddTag(filteredTags[0]);
    }
  };

  const handleCopyHighlight = (highlight: Highlight) => {
    const citation = `"${highlight.text}"\n\n— ${article?.author || 'Unknown'}, ${article?.title}`;
    navigator.clipboard.writeText(citation);
    toast.success('Copied with citation');
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    toast.success('Highlight removed');
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Article not found</p>
      </div>
    );
  }

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 flex-shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showHighlightsSidebar ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowHighlightsSidebar(!showHighlightsSidebar)}
                  className="gap-2"
                >
                  <Highlighter className="w-4 h-4" />
                  <span className="hidden sm:inline">Highlights</span>
                  {highlights.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-accent/20 text-accent text-micro rounded-full">
                      {highlights.length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle highlights sidebar</TooltipContent>
            </Tooltip>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Archive coming soon')}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Tagging coming soon')}
            >
              <TagIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(article.sourceUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.info('Share coming soon')}>
                  Share article
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Copy link coming soon')}>
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Delete coming soon')} className="text-destructive">
                  Delete article
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Reader Content */}
          <ScrollArea className="flex-1" data-reader-scroll>
            <div className="max-w-[680px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
              {/* Article Header */}
              <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                  {article.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground mb-4">
                  {article.author && (
                    <span className="text-foreground/80 font-medium">{article.author}</span>
                  )}
                  <span className="text-caption">{article.sourceName}</span>
                  <span className="text-caption">·</span>
                  <span className="text-caption">{getTimeAgo(article.savedAt)}</span>
                  <span className="text-caption">·</span>
                  <span className="text-caption">{article.readingTime} min read</span>
                </div>

                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map(tag => (
                      <TagChip key={tag.id} tag={tag} />
                    ))}
                  </div>
                )}
              </header>

              {/* Thumbnail */}
              {article.thumbnailUrl && (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <img
                    src={article.thumbnailUrl}
                    alt=""
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Article Content */}
              <article
                className="prose prose-invert prose-lg max-w-none 
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                  prose-p:text-foreground/85 prose-p:leading-[1.8]
                  prose-li:text-foreground/85
                  prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-blockquote:text-foreground/90
                  prose-strong:text-foreground
                  prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  [&_.lead]:text-lg [&_.lead]:text-foreground/90 [&_.lead]:leading-relaxed [&_.lead]:mb-6"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.75, fontFamily: 'Georgia, serif' }}
                onMouseUp={handleTextSelection}
                dangerouslySetInnerHTML={{ __html: article.content || '' }}
              />
            </div>
          </ScrollArea>

          {/* Highlights Sidebar */}
          <AnimatePresence>
            {showHighlightsSidebar && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l border-border bg-card overflow-hidden flex-shrink-0"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Highlighter className="w-4 h-4 text-accent" />
                    Highlights
                    <span className="text-caption text-muted-foreground">({highlights.length})</span>
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHighlightsSidebar(false)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-14rem)]">
                  <div className="p-4 space-y-3">
                    {highlights.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <Highlighter className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-caption mb-2">
                          No highlights yet
                        </p>
                        <p className="text-micro text-muted-foreground">
                          Select text to create highlights
                        </p>
                      </div>
                    ) : (
                      highlights.map(h => (
                        <div
                          key={h.id}
                          className={cn(
                            'group p-3 rounded-lg border-l-4 transition-colors hover:bg-muted/30',
                            getHighlightBorderColor(h.color),
                            getHighlightBgColor(h.color)
                          )}
                        >
                          <p className="text-sm text-foreground/90 line-clamp-4 mb-2">"{h.text}"</p>
                          {/* Tags */}
                          {h.tags && h.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {h.tags.map(tag => (
                                <span
                                  key={tag.id}
                                  className="px-1.5 py-0.5 bg-accent/20 text-accent rounded text-micro"
                                >
                                  #{tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Note */}
                          {h.note && (
                            <p className="text-micro text-muted-foreground italic mb-2 line-clamp-2">
                              Note: {h.note}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-micro text-muted-foreground">
                              {h.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopyHighlight(h)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteHighlight(h.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Highlight Popup */}
        <AnimatePresence>
          {showHighlightPopup && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className={cn(
                "fixed z-50 bg-popover border border-border rounded-xl shadow-lg",
                showExpandedPopup ? "p-4 w-80" : "p-2"
              )}
              style={{
                left: Math.min(Math.max(popupPosition.x, 160), window.innerWidth - 160),
                top: popupPosition.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              {!showExpandedPopup ? (
                // Compact popup with highlight, copy, cancel
                <>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setShowExpandedPopup(true)}
                          className="h-7 px-2.5 rounded-md transition-colors bg-primary/10 hover:bg-primary/20 flex items-center justify-center gap-1.5"
                        >
                          <TagIcon className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">Highlight</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Add highlight with tags</TooltipContent>
                    </Tooltip>
                    <div className="w-px h-5 bg-border mx-1" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedText);
                            setShowHighlightPopup(false);
                            window.getSelection()?.removeAllRanges();
                            toast.success('Copied to clipboard');
                          }}
                          className="w-7 h-7 rounded-full transition-colors hover:bg-muted flex items-center justify-center"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Copy</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setShowHighlightPopup(false);
                            window.getSelection()?.removeAllRanges();
                          }}
                          className="w-7 h-7 rounded-full transition-colors hover:bg-muted flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Cancel</TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-popover border-r border-b border-border rotate-45" />
                </>
              ) : (
                // Expanded form with tags and note
                <div className="space-y-3">
                  {/* Color picker row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {highlightColors.map(({ color, bgClass }) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            'w-6 h-6 rounded-full transition-all flex items-center justify-center',
                            bgClass,
                            selectedColor === color 
                              ? 'ring-2 ring-foreground ring-offset-2 ring-offset-popover scale-110' 
                              : 'hover:scale-105'
                          )}
                        >
                          {selectedColor === color && (
                            <Check className="w-3 h-3 text-foreground/70" />
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowHighlightPopup(false);
                        setShowExpandedPopup(false);
                        window.getSelection()?.removeAllRanges();
                      }}
                      className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Tags input */}
                  <div className="space-y-1.5">
                    <label className="text-micro text-muted-foreground font-medium">
                      Add tags (optional)
                    </label>
                    <div className="relative">
                      {highlightTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {highlightTags.map(tag => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent rounded-full text-micro"
                            >
                              #{tag.label}
                              <button
                                onClick={() => handleRemoveTag(tag.id)}
                                className="hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <Input
                        ref={tagInputRef}
                        value={tagInput}
                        onChange={(e) => {
                          setTagInput(e.target.value);
                          setShowTagSuggestions(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                        onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="#machine-learning #ethics"
                        className="h-8 text-sm"
                      />
                      {/* Tag suggestions dropdown */}
                      <AnimatePresence>
                        {showTagSuggestions && filteredTags.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                          >
                            {filteredTags.slice(0, 5).map(tag => (
                              <button
                                key={tag.id}
                                onClick={() => handleAddTag(tag)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                              >
                                <span className="text-accent">#{tag.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Note input */}
                  <div className="space-y-1.5">
                    <label className="text-micro text-muted-foreground font-medium">
                      Note (optional)
                    </label>
                    <Textarea
                      value={highlightNote}
                      onChange={(e) => setHighlightNote(e.target.value)}
                      placeholder="Important point about..."
                      className="min-h-[60px] text-sm resize-none"
                    />
                  </div>

                  {/* Save button */}
                  <Button
                    onClick={handleSaveHighlight}
                    className="w-full"
                    size="sm"
                  >
                    Save Highlight
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Progress Bar */}
        <footer className="h-14 border-t border-border flex items-center px-4 gap-4 bg-background/95 backdrop-blur-sm">
          {/* Font size controls */}
          <div className="flex items-center gap-1 border-r border-border pr-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize(s => Math.max(14, s - 2))}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Decrease font size (-)</TooltipContent>
            </Tooltip>
            <span className="text-caption text-muted-foreground w-10 text-center font-mono">{fontSize}px</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize(s => Math.min(24, s + 2))}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Increase font size (+)</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full progress-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-caption text-muted-foreground w-12 text-right font-mono">
              {progress}%
            </span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default Reader;
