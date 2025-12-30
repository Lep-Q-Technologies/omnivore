import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCheck, Flame, Clock, Mail, ChevronDown, ChevronUp, Keyboard } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import DigestCard from '@/components/library/DigestCard';
import AddContentModal from '@/components/modals/AddContentModal';
import { mockArticles } from '@/data/mockArticles';
import type { Article } from '@/types/article';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const getGreeting = (firstName?: string): string => {
  const hour = new Date().getHours();
  const name = firstName ? `, ${firstName}` : '';
  if (hour < 12) return `Good morning${name}`;
  if (hour < 17) return `Good afternoon${name}`;
  return `Good evening${name}`;
};

const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
};

const Today = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>(mockArticles);

  // Extract first name from user
  const firstName = user?.name?.split(' ')[0];
  const [activeSection, setActiveSection] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [triagedIds, setTriagedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showTriaged, setShowTriaged] = useState(false);
  
  // Filter new items (last 24h, not archived)
  const newArticles = useMemo(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return articles
      .filter(a => 
        a.state !== 'archived' && 
        a.savedAt > oneDayAgo &&
        !triagedIds.has(a.id)
      )
      .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime()); // Most recent first
  }, [articles, triagedIds]);
  
  const triagedArticles = useMemo(() => 
    articles.filter(a => triagedIds.has(a.id)),
    [articles, triagedIds]
  );
  
  // Stats
  const totalNew = newArticles.length;
  const totalTriaged = triagedIds.size;
  const progressPercent = totalNew + totalTriaged > 0 
    ? Math.round((totalTriaged / (totalNew + totalTriaged)) * 100) 
    : 100;
  const estimatedMinutes = Math.ceil(totalNew * 0.5); // ~30s per item to triage
  const streakDays = 7; // Mock streak
  
  // Content breakdown
  const contentBreakdown = useMemo(() => {
    const newsletters = newArticles.filter(a => 
      a.flairs.some(f => f.icon === 'mail') || a.sourceName.toLowerCase().includes('newsletter') || a.sourceName.toLowerCase().includes('brew')
    ).length;
    const podcasts = newArticles.filter(a => 
      a.sourceName.toLowerCase().includes('podcast') || a.sourceName.toLowerCase().includes('lex') || a.sourceName.toLowerCase().includes('huberman')
    ).length;
    const youtube = newArticles.filter(a => 
      a.sourceName.toLowerCase().includes('youtube') || a.sourceName.toLowerCase().includes('veritasium')
    ).length;
    const rss = newArticles.filter(a => 
      a.flairs.some(f => f.icon === 'rss') && !newsletters && !podcasts && !youtube
    ).length;
    const other = totalNew - newsletters - rss - podcasts - youtube;
    return { newsletters, rss, podcasts, youtube, other };
  }, [newArticles, totalNew]);
  
  const handleRead = (id: string) => {
    navigate(`/reader/${id}`);
  };
  
  const handleReadLater = (id: string) => {
    setTriagedIds(prev => new Set([...prev, id]));
    toast.success('Added to Read Later!', {
      action: {
        label: 'Undo',
        onClick: () => setTriagedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
      },
    });
  };
  
  const handleDismiss = (id: string) => {
    setTriagedIds(prev => new Set([...prev, id]));
    toast.success('Dismissed', {
      action: {
        label: 'Undo',
        onClick: () => setTriagedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
      },
    });
  };
  
  const handleDelete = (id: string) => {
    const article = articles.find(a => a.id === id);
    setArticles(prev => prev.filter(a => a.id !== id));
    toast.success('Deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (article) setArticles(prev => [...prev, article]);
        },
      },
    });
  };
  
  const handleMarkAllTriaged = () => {
    const ids = newArticles.map(a => a.id);
    setTriagedIds(prev => new Set([...prev, ...ids]));
    toast.success(`Triaged ${ids.length} items - Inbox zero! 🎉`);
  };
  
  const focusedArticle = newArticles[focusedIndex];
  
  // Keyboard shortcut handler
  const handleKeyboardAction = useCallback((action: string) => {
    if (newArticles.length === 0) return;
    
    switch (action) {
      case 'next':
        setFocusedIndex(prev => Math.min(prev + 1, newArticles.length - 1));
        break;
      case 'prev':
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'read':
        if (focusedArticle) handleRead(focusedArticle.id);
        break;
      case 'readLater':
        if (focusedArticle) handleReadLater(focusedArticle.id);
        break;
      case 'dismiss':
        if (focusedArticle) handleDismiss(focusedArticle.id);
        break;
      case 'delete':
        if (focusedArticle) handleDelete(focusedArticle.id);
        break;
      case 'help':
        setIsHelpOpen(true);
        break;
    }
  }, [newArticles, focusedIndex, focusedArticle]);
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onAction: handleKeyboardAction,
    enabled: !isAddModalOpen && !isHelpOpen && !isMobileMenuOpen,
  });
  
  const allCaughtUp = totalNew === 0;
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        className="hidden lg:flex"
      />
      
      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={(section) => {
              setActiveSection(section);
              setIsMobileMenuOpen(false);
            }}
            className="w-full border-0"
          />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => setIsAddModalOpen(true)}
          onSettingsClick={() => navigate('/settings')}
          onProfileClick={() => navigate('/profile')}
          onLogoutClick={() => {
            logout();
            navigate('/login');
          }}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            
            {/* Hero Stats Section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-card to-elevated rounded-xl p-6 mb-6 border border-border/50"
            >
              {/* Greeting Row */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {getGreeting(firstName)}! <span className="text-2xl">☀️</span>
                </h1>
                <span className="text-caption text-muted-foreground">{getFormattedDate()}</span>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-heading font-bold text-foreground">{totalNew}</p>
                    <p className="text-micro text-muted-foreground">New Items</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-heading font-bold text-accent">~{estimatedMinutes} min</p>
                    <p className="text-micro text-muted-foreground">to triage</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-brand-yellow" />
                  <div>
                    <p className="text-heading font-bold text-brand-yellow">{streakDays} day</p>
                    <p className="text-micro text-muted-foreground">streak</p>
                  </div>
                </div>
              </div>
              
              {/* Content Breakdown */}
              <div className="flex flex-wrap items-center gap-3 text-caption text-secondary-foreground mb-4">
                {contentBreakdown.newsletters > 0 && (
                  <span className="flex items-center gap-1">📰 {contentBreakdown.newsletters} Newsletters</span>
                )}
                {contentBreakdown.rss > 0 && (
                  <span className="flex items-center gap-1">📡 {contentBreakdown.rss} RSS</span>
                )}
                {contentBreakdown.podcasts > 0 && (
                  <span className="flex items-center gap-1">🎙️ {contentBreakdown.podcasts} Podcasts</span>
                )}
                {contentBreakdown.youtube > 0 && (
                  <span className="flex items-center gap-1">📺 {contentBreakdown.youtube} Videos</span>
                )}
                {contentBreakdown.other > 0 && (
                  <span className="flex items-center gap-1">📄 {contentBreakdown.other} Articles</span>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-caption text-muted-foreground">
                  <span>Progress</span>
                  <span>{totalTriaged} triaged / {totalNew + totalTriaged} total ({progressPercent}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full progress-gradient rounded-full"
                  />
                </div>
              </div>
            </motion.div>
            
            {/* All Caught Up State */}
            {allCaughtUp ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl p-12 text-center border border-border/50"
              >
                <span className="text-5xl mb-4 block">🎉</span>
                <h2 className="text-2xl font-bold text-brand-yellow mb-2">Inbox Zero Achieved!</h2>
                <p className="text-body text-muted-foreground mb-4">
                  You triaged {totalTriaged} items today
                </p>
                <p className="text-heading font-semibold text-brand-yellow mb-6">
                  Your streak: 🔥 {streakDays} days
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/library')}
                  >
                    Browse Library
                  </Button>
                  <Button 
                    onClick={() => navigate('/library?tab=readlater')}
                    className="bg-accent hover:bg-accent/90"
                  >
                    See Read Later Queue
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Mark All Button */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground text-caption">
                    {totalNew} item{totalNew !== 1 ? 's' : ''} to review
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllTriaged}
                    className="gap-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all as triaged
                  </Button>
                </div>
                
                {/* Flat Article List (no priority grouping) */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {newArticles.map((article, index) => (
                      <DigestCard
                        key={article.id}
                        article={article}
                        onRead={handleRead}
                        onReadLater={handleReadLater}
                        onDismiss={handleDismiss}
                        onDelete={handleDelete}
                        onKeyboardFocus={index === focusedIndex}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Triaged Section */}
                {triagedArticles.length > 0 && (
                  <Collapsible 
                    open={showTriaged} 
                    onOpenChange={setShowTriaged}
                    className="mt-6"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-state-success/10 border border-state-success/30 rounded-lg hover:bg-state-success/15 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <span className="font-semibold text-state-success">Triaged</span>
                        <span className="text-caption text-muted-foreground">
                          ({triagedArticles.length} items)
                        </span>
                      </div>
                      {showTriaged ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <AnimatePresence mode="popLayout">
                        {triagedArticles.map((article) => (
                          <DigestCard
                            key={article.id}
                            article={article}
                            isTriaged
                            onRead={handleRead}
                            onReadLater={handleReadLater}
                            onDismiss={handleDismiss}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Add Content Modal */}
      <AddContentModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />
      
      {/* Keyboard Shortcuts Help */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Navigate and triage items quickly with your keyboard
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="flex items-center justify-between">
              <span className="text-body">Next item</span>
              <div className="flex gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-caption">J</kbd>
                <kbd className="px-2 py-1 bg-muted rounded text-caption">↓</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body">Previous item</span>
              <div className="flex gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-caption">K</kbd>
                <kbd className="px-2 py-1 bg-muted rounded text-caption">↑</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body">Read now</span>
              <div className="flex gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-caption">R</kbd>
                <kbd className="px-2 py-1 bg-muted rounded text-caption">Enter</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body">Read later</span>
              <kbd className="px-2 py-1 bg-muted rounded text-caption">L</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body">Dismiss</span>
              <kbd className="px-2 py-1 bg-muted rounded text-caption">D</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body">Delete</span>
              <kbd className="px-2 py-1 bg-muted rounded text-caption">⌫</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body">Show this help</span>
              <kbd className="px-2 py-1 bg-muted rounded text-caption">?</kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Today;