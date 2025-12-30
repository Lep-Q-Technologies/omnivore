import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Mail, Rss, Youtube, Headphones, Plus, RefreshCw, Globe, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Subscription } from '@/types/article';
import type { NewsletterSubscription } from '@/types/api';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import NewsletterCard from '@/components/feeds/NewsletterCard';
import AddNewsletterModal from '@/components/feeds/AddNewsletterModal';
import UnsubscribeModal from '@/components/feeds/UnsubscribeModal';
import DeleteAddressModal from '@/components/feeds/DeleteAddressModal';
import AddContentModal from '@/components/modals/AddContentModal';
import { useNewsletterSubscriptions } from '@/lib/graphql-client';

/**
 * Convert backend NewsletterSubscription to UI Subscription format
 */
const mapNewsletterToSubscription = (newsletter: NewsletterSubscription): Subscription => {
  // Determine status based on backend fields
  let status: 'active' | 'pending' | 'unsubscribed' = 'active';
  if (!newsletter.active) {
    status = 'unsubscribed';
  } else if (newsletter.senderEmail.startsWith('pending:')) {
    status = 'pending';
  }

  return {
    id: newsletter.id,
    name: newsletter.title || 'Untitled Newsletter',
    type: 'newsletter',
    emailAddress: newsletter.newsletterEmail || `${newsletter.emailAlias}@inbox.omnivore.app`,
    itemCount: newsletter.itemCount,
    readCount: newsletter.itemCount - (newsletter.unreadCount || 0),
    lastReceived: newsletter.lastReceivedAt ? new Date(newsletter.lastReceivedAt) : undefined,
    isActive: newsletter.active,
    status,
    platform: newsletter.senderEmail && !newsletter.senderEmail.startsWith('pending:')
      ? newsletter.senderEmail.split('@')[1]
      : undefined,
  };
};

// Mock data - updated with email addresses and read counts
const mockNewsletters: Subscription[] = [
  {
    id: 'n1',
    name: 'Dense Discovery',
    type: 'newsletter',
    platform: 'Substack',
    itemCount: 12,
    readCount: 10,
    lastReceived: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isActive: true,
    status: 'active',
    emailAddress: 'tim-dense-discovery-xyz123@omnivore.app',
  },
  {
    id: 'n2',
    name: 'Morning Brew',
    type: 'newsletter',
    platform: 'Mailchimp',
    itemCount: 30,
    readCount: 5,
    lastReceived: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isActive: true,
    status: 'active',
    emailAddress: 'tim-morning-brew-abc456@omnivore.app',
  },
  {
    id: 'n3',
    name: 'Hacker Newsletter',
    type: 'newsletter',
    platform: 'Generic',
    itemCount: 8,
    readCount: 8,
    lastReceived: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isActive: true,
    status: 'active',
    emailAddress: 'tim-hacker-newsletter-def789@omnivore.app',
  },
  {
    id: 'n4',
    name: 'Substack Digest',
    type: 'newsletter',
    itemCount: 0,
    isActive: true,
    status: 'pending',
    emailAddress: 'tim-substack-digest-ghi012@omnivore.app',
  },
  {
    id: 'n5',
    name: 'TechCrunch Daily',
    type: 'newsletter',
    itemCount: 45,
    readCount: 3,
    lastReceived: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isActive: false,
    status: 'unsubscribed',
    unsubscribedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    emailAddress: 'tim-techcrunch-daily-jkl345@omnivore.app',
  },
];

const mockRssFeeds: Subscription[] = [
  {
    id: 'r1',
    name: 'Hacker News',
    type: 'rss',
    url: 'https://hnrss.org/frontpage',
    itemCount: 72,
    lastReceived: new Date(Date.now() - 30 * 60 * 1000),
    isActive: true,
  },
  {
    id: 'r2',
    name: 'Veritasium',
    type: 'youtube',
    url: 'youtube.com/feeds/videos.xml?channel_id=UCHnyfMqiRRG1u-2MsSQLbXA',
    itemCount: 4,
    lastReceived: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: 'r3',
    name: 'The Daily',
    type: 'podcast',
    url: 'feeds.nytimes.com/thedaily',
    itemCount: 6,
    lastReceived: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: 'r4',
    name: 'Fireship',
    type: 'youtube',
    url: 'youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA',
    itemCount: 3,
    lastReceived: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isActive: true,
  },
];

const Feeds = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [newsletters, setNewsletters] = useState(mockNewsletters);
  const [rssFeeds, setRssFeeds] = useState(mockRssFeeds);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [activeSection, setActiveSection] = useState('feeds');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [addNewsletterOpen, setAddNewsletterOpen] = useState(false);
  const [unsubscribeTarget, setUnsubscribeTarget] = useState<Subscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);

  // Fetch newsletter subscriptions from backend
  const { data: newsletterData, loading: newslettersLoading, fetchNewsletterSubscriptions } = useNewsletterSubscriptions(true);

  // Fetch newsletters on mount
  useEffect(() => {
    fetchNewsletterSubscriptions().catch((error) => {
      console.error('Failed to fetch newsletter subscriptions:', error);
      toast.error('Failed to load newsletter subscriptions');
    });
  }, [fetchNewsletterSubscriptions]);

  // Update newsletters state when data is fetched
  useEffect(() => {
    if (newsletterData && newsletterData.length > 0) {
      const mappedNewsletters = newsletterData.map(mapNewsletterToSubscription);
      setNewsletters(mappedNewsletters);
    }
  }, [newsletterData]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const handleAddFeed = () => {
    if (!newFeedUrl.trim()) return;

    let type: 'rss' | 'youtube' | 'podcast' = 'rss';
    let name = 'New Feed';

    if (newFeedUrl.includes('youtube.com') || newFeedUrl.includes('youtu.be')) {
      type = 'youtube';
      name = 'YouTube Channel';
    } else if (newFeedUrl.includes('podcast') || newFeedUrl.includes('anchor.fm') || newFeedUrl.includes('spotify')) {
      type = 'podcast';
      name = 'New Podcast';
    }

    const newFeed: Subscription = {
      id: `r-${Date.now()}`,
      name,
      type,
      url: newFeedUrl,
      itemCount: 0,
      isActive: true,
    };

    setRssFeeds(prev => [...prev, newFeed]);
    setNewFeedUrl('');
    toast.success('Feed added! Fetching articles...', {
      description: 'New items will appear in your Library shortly.',
    });
  };

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    toast.info('Refreshing all feeds...');
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('All feeds refreshed!', {
        description: '12 new items added to your Library.',
      });
    }, 2000);
  };

  const handleAddNewsletter = async () => {
    // Subscription is already created in backend via the modal
    // Refetch the newsletters list to show the new subscription
    try {
      await fetchNewsletterSubscriptions();
      toast.success('Newsletter subscription created! Check your Feeds.');
    } catch (error) {
      console.error('Failed to refresh newsletter subscriptions:', error);
      // Still show success since the subscription was created
      toast.success('Newsletter subscription created!');
    }
  };

  const handleUnsubscribe = (newsletter: Subscription, reason?: string) => {
    setNewsletters(prev => prev.map(n => 
      n.id === newsletter.id 
        ? { ...n, status: 'unsubscribed' as const, isActive: false, unsubscribedAt: new Date() }
        : n
    ));
    toast.success(`Unsubscribed from ${newsletter.name}. Email address disabled.`);
  };

  const handleResubscribe = (newsletter: Subscription) => {
    setNewsletters(prev => prev.map(n => 
      n.id === newsletter.id 
        ? { ...n, status: 'active' as const, isActive: true, unsubscribedAt: undefined }
        : n
    ));
    toast.success(`Resubscribed to ${newsletter.name}`);
  };

  const handleDeleteAddress = (newsletter: Subscription) => {
    setNewsletters(prev => prev.filter(n => n.id !== newsletter.id));
    toast.success(`Email address for ${newsletter.name} deleted permanently.`);
  };

  const handleUnsubscribeFeed = (feed: Subscription) => {
    setRssFeeds(prev => prev.filter(f => f.id !== feed.id));
    toast.success(`Unsubscribed from ${feed.name}`);
  };

  const getTypeIcon = (type: Subscription['type']) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-tag-red" />;
      case 'podcast':
        return <Headphones className="w-4 h-4 text-tag-purple" />;
      default:
        return <Rss className="w-4 h-4 text-tag-orange" />;
    }
  };

  const getTypeBadge = (type: Subscription['type']) => {
    switch (type) {
      case 'youtube':
        return (
          <span className="text-micro bg-tag-red/20 text-tag-red px-1.5 py-0.5 rounded font-medium">
            YouTube
          </span>
        );
      case 'podcast':
        return (
          <span className="text-micro bg-tag-purple/20 text-tag-purple px-1.5 py-0.5 rounded font-medium">
            Podcast
          </span>
        );
      default:
        return null;
    }
  };

  const activeNewsletters = newsletters.filter(n => n.status === 'active');
  const pendingNewsletters = newsletters.filter(n => n.status === 'pending');
  const unsubscribedNewsletters = newsletters.filter(n => n.status === 'unsubscribed');

  const totalFeeds = newsletters.length + rssFeeds.length;
  const totalItems = [...newsletters, ...rssFeeds].reduce((sum, f) => sum + f.itemCount, 0);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          if (section === 'library') navigate('/');
          if (section === 'highlights') navigate('/highlights');
          if (section === 'digest') navigate('/?tab=digest');
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
              if (section === 'library') navigate('/');
              if (section === 'highlights') navigate('/highlights');
              if (section === 'digest') navigate('/?tab=digest');
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
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Globe className="w-6 h-6 text-accent" />
                  Feeds
                </h1>
                <p className="text-muted-foreground text-caption mt-1">
                  {totalFeeds} sources · {totalItems} unread items
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                Refresh All
              </Button>
            </div>

            {/* Newsletters Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Newsletters ({newsletters.length})
                  </h2>
                </div>
                <Button 
                  onClick={() => setAddNewsletterOpen(true)} 
                  size="sm"
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Newsletter
                </Button>
              </div>

              {/* Active Newsletters */}
              {activeNewsletters.length > 0 && (
                <div className="space-y-3 mb-4">
                  <AnimatePresence>
                    {activeNewsletters.map((newsletter, index) => (
                      <NewsletterCard
                        key={newsletter.id}
                        newsletter={newsletter}
                        index={index}
                        onUnsubscribe={setUnsubscribeTarget}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pending Newsletters */}
              {pendingNewsletters.length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-caption text-muted-foreground">
                    Pending ({pendingNewsletters.length})
                  </p>
                  <AnimatePresence>
                    {pendingNewsletters.map((newsletter, index) => (
                      <NewsletterCard
                        key={newsletter.id}
                        newsletter={newsletter}
                        index={index}
                        onUnsubscribe={setUnsubscribeTarget}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Unsubscribed Newsletters */}
              {unsubscribedNewsletters.length > 0 && (
                <div className="space-y-3">
                  <p className="text-caption text-muted-foreground">
                    Unsubscribed ({unsubscribedNewsletters.length})
                  </p>
                  <AnimatePresence>
                    {unsubscribedNewsletters.map((newsletter, index) => (
                      <NewsletterCard
                        key={newsletter.id}
                        newsletter={newsletter}
                        index={index}
                        onUnsubscribe={setUnsubscribeTarget}
                        onDelete={setDeleteTarget}
                        onResubscribe={handleResubscribe}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* RSS Feeds Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Rss className="w-5 h-5 text-tag-orange" />
                <h2 className="text-lg font-semibold text-foreground">RSS Feeds</h2>
              </div>

              {/* Add Feed Input */}
              <div className="bg-card rounded-lg p-4 border border-border mb-4">
                <label className="text-caption text-muted-foreground mb-2 block">
                  Add RSS Feed
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://example.com/feed.xml"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFeed()}
                  />
                  <Button onClick={handleAddFeed} className="shrink-0 gap-2">
                    <Plus className="w-4 h-4" />
                    Subscribe
                  </Button>
                </div>
                <p className="text-caption text-muted-foreground mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-lg">💡</span>
                  <span>
                    <strong>Pro tip:</strong> YouTube channels and Podcasts have RSS feeds too! 
                    Just paste the channel URL or podcast feed.
                  </span>
                </p>
              </div>

              {/* Active Feeds */}
              <div className="space-y-2">
                <p className="text-caption text-muted-foreground mb-2">
                  Active Feeds ({rssFeeds.length})
                </p>
                <AnimatePresence>
                  {rssFeeds.map((feed, index) => (
                    <motion.div
                      key={feed.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-card rounded-lg p-4 flex items-center justify-between border border-transparent hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {getTypeIcon(feed.type)}
                        </div>
                        <div>
                          <p className="text-foreground font-medium flex items-center gap-2">
                            {feed.name}
                            {getTypeBadge(feed.type)}
                          </p>
                          <p className="text-caption text-muted-foreground">
                            {feed.itemCount > 0 ? (
                              <span className="text-accent">{feed.itemCount} items</span>
                            ) : (
                              'No new items'
                            )}
                            {feed.lastReceived && (
                              <span> · Updated: {getTimeAgo(feed.lastReceived)}</span>
                            )}
                          </p>
                          {feed.url && (
                            <p className="text-micro text-muted-foreground truncate max-w-[300px] flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {feed.url}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnsubscribeFeed(feed)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Unsubscribe
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddNewsletterModal
        open={addNewsletterOpen}
        onOpenChange={setAddNewsletterOpen}
        onAdd={handleAddNewsletter}
      />

      <UnsubscribeModal
        open={!!unsubscribeTarget}
        onOpenChange={() => setUnsubscribeTarget(null)}
        newsletter={unsubscribeTarget}
        onUnsubscribe={handleUnsubscribe}
      />

      <DeleteAddressModal
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        newsletter={deleteTarget}
        onDelete={handleDeleteAddress}
      />

      {/* Add Content Modal */}
      <AddContentModal
        open={isAddContentModalOpen}
        onOpenChange={setIsAddContentModalOpen}
        onNewsletterModalOpen={() => setAddNewsletterOpen(true)}
      />
    </div>
  );
};

export default Feeds;
