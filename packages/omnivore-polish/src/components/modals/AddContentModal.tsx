import { useState } from 'react';
import { Link2, FileText, Rss, Copy, Check, AlertCircle, Mail, Inbox, Clock, Archive, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabType = 'article' | 'document' | 'subscribe';

const folderOptions = [
  { value: 'inbox', label: 'Inbox', icon: Inbox },
  { value: 'later', label: 'Read Later', icon: Clock },
  { value: 'archive', label: 'Archive', icon: Archive },
];

interface AddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewsletterModalOpen?: () => void;
}

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'article', label: 'Article', icon: Link2 },
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'subscribe', label: 'Subscribe', icon: Rss },
];

const AddContentModal = ({ open, onOpenChange, onNewsletterModalOpen }: AddContentModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('article');
  const [url, setUrl] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [saveToFolder, setSaveToFolder] = useState('inbox');

  const handleAddArticle = () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    toast.success('Article added! Processing...');
    setUrl('');
    onOpenChange(false);
  };

  const handleUploadDocument = () => {
    toast.info('Document upload coming soon!');
  };

  const handleSubscribe = () => {
    if (!feedUrl.trim()) {
      toast.error('Please enter a feed URL');
      return;
    }
    toast.success('Subscribed! Fetching articles...');
    setFeedUrl('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setUrl('');
    setFeedUrl('');
    setActiveTab('article');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'article' && 'Add Article'}
            {activeTab === 'document' && 'Upload Document'}
            {activeTab === 'subscribe' && 'Subscribe to Feed'}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-body transition-colors relative',
                  isActive
                    ? 'text-accent font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="pt-4">
          {activeTab === 'article' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="article-url">URL</Label>
                <Input
                  id="article-url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddArticle()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="save-to">Save to</Label>
                <Select value={saveToFolder} onValueChange={setSaveToFolder}>
                  <SelectTrigger id="save-to">
                    <SelectValue>
                      {(() => {
                        const selected = folderOptions.find(f => f.value === saveToFolder);
                        if (selected) {
                          const Icon = selected.icon;
                          return (
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {selected.label}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {folderOptions.map((folder) => {
                      const Icon = folder.icon;
                      return (
                        <SelectItem key={folder.value} value={folder.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {folder.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleAddArticle}>
                  Add Article
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'document' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
                onClick={handleUploadDocument}
              >
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-caption text-muted-foreground">
                  PDF, EPUB, or HTML files (max 50MB)
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleUploadDocument}>
                  Upload
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'subscribe' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feed-url">RSS Feed URL</Label>
                <Input
                  id="feed-url"
                  placeholder="https://example.com/feed.xml"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                />
                <p className="text-caption text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  YouTube channels and Podcasts have RSS feeds too!
                </p>
              </div>

              {/* Newsletter redirect section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-caption text-foreground font-medium mb-1">
                      For Newsletters
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Manage newsletter subscriptions in the{' '}
                      <button
                        onClick={() => {
                          if (onNewsletterModalOpen) {
                            handleClose();
                            onNewsletterModalOpen();
                          } else {
                            handleClose();
                            window.location.href = '/feeds';
                          }
                        }}
                        className="text-accent hover:underline font-medium"
                      >
                        Feeds page
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubscribe}>
                  Subscribe
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddContentModal;
