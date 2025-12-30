import { Trash2, Sparkles, Clock, Check, Eye, Timer, X, Rss, Mail, Headphones, Youtube, FileText, BookOpen, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Article, ContentType } from '@/types/article';
import TagChip from './TagChip';

interface DigestCardProps {
  article: Article;
  onRead: (id: string) => void;
  onReadLater?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete: (id: string) => void;
  isTriaged?: boolean;
  isSelected?: boolean;
  onKeyboardFocus?: boolean;
}

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

// Generate mock AI summary based on article
const generateMockSummary = (article: Article): string => {
  const summaries: Record<string, string> = {
    '1': 'This podcast episode examines how AI is transforming journalism. Key points: automated content generation, personalized recommendations, and the balance between efficiency and maintaining journalistic integrity.',
    '2': 'Practical deep-dive into TypeScript generics with real-world examples. Covers type inference, constraints, and common patterns used in production codebases.',
    '3': 'Analysis of the aesthetic-usability effect in UX design. Research shows users perceive beautiful designs as 25% more usable, even when functionality is identical.',
    '4': 'Comprehensive guide to modern CSS layout techniques. Covers Grid, Flexbox, container queries, and responsive design strategies for 2024.',
    '5': 'Introduction to Deno runtime as a Node.js alternative. Highlights: built-in TypeScript, secure by default, and simplified dependency management.',
    '6': 'Research findings on design perception. Users rate aesthetically pleasing interfaces as easier to use, impacting conversion rates and satisfaction scores.',
    '7': 'Three emerging design trends: glassmorphism 2.0, AI-generated interfaces, and hyper-personalization. Practical examples and implementation tips included.',
    '8': 'Breaking: Apple announces major AI features for iOS 18. Includes on-device processing, Siri improvements, and developer APIs for AI integration.',
    '9': 'Cal Newport argues for "slow productivity" over hustle culture. Key insight: focused, meaningful work produces better results than constant busyness.',
    '10': 'A personal reflection on creative burnout and recovery. Discusses sustainable creative practices and the importance of intentional rest.',
    '11': 'This article explores how LLMs are transforming software development. Key points: cost reduction by 10x, new interaction paradigms, and emerging risks to consider.',
    '12': 'A comprehensive guide to React Server Components explaining how they enable server-side rendering with zero JavaScript sent to the client for static content.',
    '13': 'Research shows users perceive aesthetically pleasing designs as 25% more usable. The study recommends investing in visual design to improve conversion rates.',
  };
  return summaries[article.id] || `${article.description?.slice(0, 150) || article.title}...`;
};

// Content type configuration
const contentTypeConfig: Record<ContentType, { label: string; icon: React.ElementType; className: string }> = {
  newsletter: { label: 'NEWSLETTER', icon: Mail, className: 'bg-tag-blue/20 text-tag-blue' },
  rss: { label: 'RSS', icon: Rss, className: 'bg-tag-orange/20 text-tag-orange' },
  podcast: { label: 'PODCAST', icon: Headphones, className: 'bg-tag-purple/20 text-tag-purple' },
  youtube: { label: 'YOUTUBE', icon: Youtube, className: 'bg-tag-red/20 text-tag-red' },
  article: { label: 'ARTICLE', icon: FileText, className: 'bg-tag-green/20 text-tag-green' },
  pdf: { label: 'PDF', icon: FileText, className: 'bg-tag-red/20 text-tag-red' },
  epub: { label: 'EPUB', icon: BookOpen, className: 'bg-tag-pink/20 text-tag-pink' },
  html: { label: 'HTML', icon: Code, className: 'bg-tag-gray/20 text-tag-gray' },
};

// Infer content type from article data
const inferContentType = (article: Article): ContentType => {
  if (article.contentType) return article.contentType;
  
  const source = article.sourceName.toLowerCase();
  if (article.flairs.some(f => f.icon === 'mail') || source.includes('newsletter') || source.includes('brew')) {
    return 'newsletter';
  }
  if (source.includes('podcast') || source.includes('lex fridman') || source.includes('huberman')) {
    return 'podcast';
  }
  if (source.includes('youtube') || source.includes('veritasium') || source.includes('3blue1brown')) {
    return 'youtube';
  }
  if (article.flairs.some(f => f.icon === 'rss') || source.includes('hacker news') || source.includes('techcrunch')) {
    return 'rss';
  }
  return 'article';
};

const DigestCard = ({ 
  article, 
  onRead, 
  onReadLater,
  onDismiss,
  onArchive,
  onDelete, 
  isTriaged = false,
  isSelected = false,
  onKeyboardFocus = false
}: DigestCardProps) => {
  const summary = article.aiSummary || generateMockSummary(article);
  const contentType = inferContentType(article);
  const typeConfig = contentTypeConfig[contentType];
  const TypeIcon = typeConfig.icon;
  
  const handleArchiveOrDismiss = () => {
    if (onDismiss) {
      onDismiss(article.id);
    } else if (onArchive) {
      onArchive(article.id);
    }
  };
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isTriaged ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group bg-card rounded-lg border transition-all duration-200',
        isTriaged 
          ? 'border-border/30 opacity-60' 
          : 'border-border/50 hover:border-border',
        onKeyboardFocus && 'ring-2 ring-accent ring-offset-2 ring-offset-background',
        isSelected && 'border-accent bg-accent/5'
      )}
    >
      <div className="p-4">
        {/* Header: Content Type Badge + Source + Triaged badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Content Type Badge */}
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
              typeConfig.className
            )}>
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
            
            {/* Podcast/Video indicator */}
            {(contentType === 'podcast' || contentType === 'youtube') && (
              <span className="text-micro text-muted-foreground">
                {contentType === 'podcast' ? '🎙️ Transcript Available' : '📺 Transcript Available'}
              </span>
            )}
          </div>
          {isTriaged && (
            <span className="text-micro font-medium text-state-success flex items-center gap-1 bg-state-success/10 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" />
              Triaged
            </span>
          )}
        </div>
        
        {/* Title */}
        <h3 className="text-heading font-semibold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
        
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-caption mb-3">
          {article.author && (
            <>
              <span className="text-foreground/70">{article.author}</span>
              <span>·</span>
            </>
          )}
          <span>{article.sourceName}</span>
          <span>·</span>
          <span>{getTimeAgo(article.savedAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readingTime} min
          </span>
        </div>
        
        {/* AI Summary Box */}
        <div className="relative bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-lg p-4 mb-4 overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-1.5 text-accent text-caption font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Summary</span>
            </div>
            <p className="text-foreground/85 text-body leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
        
        {/* Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onRead(article.id)}
              className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Eye className="w-3.5 h-3.5" />
              Read Now
            </Button>
            {onReadLater && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReadLater(article.id)}
                className="gap-1.5"
              >
                <Timer className="w-3.5 h-3.5" />
                Read Later
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchiveOrDismiss}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
              Dismiss
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(article.id)}
              className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              {article.tags.slice(0, 2).map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
              {article.tags.length > 2 && (
                <span className="text-micro text-muted-foreground">+{article.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Keyboard shortcut hints (shown on hover) */}
      <div className="hidden group-hover:flex items-center justify-center gap-4 px-4 py-2 bg-muted/30 border-t border-border/30 text-micro text-muted-foreground">
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70">R</kbd> Read</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70">L</kbd> Later</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70">D</kbd> Dismiss</span>
      </div>
    </motion.article>
  );
};

export default DigestCard;