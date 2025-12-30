import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, X, Search, Folder, ChevronDown, ChevronUp, Highlighter, BookOpen } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AddContentModal from '@/components/modals/AddContentModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Tag, TagColor } from '@/types/article';

// Types
interface Topic {
  id: string;
  name: string;
  description?: string;
  tagIds: string[];
  highlightCount: number;
  articleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock tags data
const initialTags: Tag[] = [
  { id: 't1', label: 'AI', color: 'purple' },
  { id: 't2', label: 'Programming', color: 'blue' },
  { id: 't3', label: 'Design', color: 'pink' },
  { id: 't4', label: 'React', color: 'blue' },
  { id: 't5', label: 'TypeScript', color: 'blue' },
  { id: 't6', label: 'News', color: 'red' },
  { id: 't7', label: 'Productivity', color: 'yellow' },
  { id: 't8', label: 'Finance', color: 'green' },
  { id: 't9', label: 'Health', color: 'green' },
  { id: 't10', label: 'Philosophy', color: 'gray' },
  { id: 't11', label: 'Science', color: 'purple' },
  { id: 't12', label: 'Technology', color: 'orange' },
  { id: 't13', label: 'machine-learning', color: 'purple' },
  { id: 't14', label: 'bias', color: 'red' },
  { id: 't15', label: 'fairness', color: 'green' },
  { id: 't16', label: 'regulation', color: 'orange' },
  { id: 't17', label: 'transparency', color: 'blue' },
];

// Mock topics
const initialTopics: Topic[] = [
  {
    id: 'topic1',
    name: 'AI Ethics Research',
    description: 'Research on ethical implications of AI systems, bias detection, and regulatory frameworks.',
    tagIds: ['t13', 't14', 't15', 't16', 't17'],
    highlightCount: 47,
    articleCount: 12,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'topic2',
    name: 'React Performance',
    description: 'Best practices for optimizing React applications.',
    tagIds: ['t4', 't2'],
    highlightCount: 23,
    articleCount: 8,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'topic3',
    name: 'Design Systems',
    description: 'Building and maintaining design systems at scale.',
    tagIds: ['t3'],
    highlightCount: 31,
    articleCount: 15,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

const colorOptions: { value: TagColor; label: string; class: string }[] = [
  { value: 'red', label: 'Red', class: 'bg-tag-red' },
  { value: 'orange', label: 'Orange', class: 'bg-tag-orange' },
  { value: 'yellow', label: 'Yellow', class: 'bg-tag-yellow' },
  { value: 'green', label: 'Green', class: 'bg-tag-green' },
  { value: 'blue', label: 'Blue', class: 'bg-tag-blue' },
  { value: 'purple', label: 'Purple', class: 'bg-tag-purple' },
  { value: 'pink', label: 'Pink', class: 'bg-tag-pink' },
  { value: 'gray', label: 'Gray', class: 'bg-tag-gray' },
];

// Mock article counts per tag
const tagArticleCounts: Record<string, number> = {
  't1': 15, 't2': 23, 't3': 8, 't4': 12, 't5': 9, 't6': 5, 't7': 7, 't8': 3,
  't9': 4, 't10': 2, 't11': 6, 't12': 11, 't13': 12, 't14': 8, 't15': 15,
  't16': 6, 't17': 6,
};

// Mock highlight counts per tag
const tagHighlightCounts: Record<string, number> = {
  't1': 25, 't2': 35, 't3': 12, 't4': 18, 't5': 14, 't6': 8, 't7': 10, 't8': 5,
  't9': 6, 't10': 3, 't11': 9, 't12': 16, 't13': 22, 't14': 15, 't15': 28,
  't16': 10, 't17': 12,
};

const Tags = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [activeSection, setActiveSection] = useState('tags');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<Tag | null>(null);
  const [deleteConfirmTopic, setDeleteConfirmTopic] = useState<Topic | null>(null);
  const [isTopicsSectionOpen, setIsTopicsSectionOpen] = useState(true);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  
  // Tag form state
  const [formLabel, setFormLabel] = useState('');
  const [formColor, setFormColor] = useState<TagColor>('blue');
  
  // Topic form state
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [topicTagSearch, setTopicTagSearch] = useState('');
  
  // Filter tags
  const filteredTags = useMemo(() => {
    if (!tagSearch) return tags;
    return tags.filter(tag => 
      tag.label.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [tags, tagSearch]);
  
  // Sort by article count
  const sortedTags = useMemo(() => {
    return [...filteredTags].sort((a, b) => 
      (tagArticleCounts[b.id] || 0) - (tagArticleCounts[a.id] || 0)
    );
  }, [filteredTags]);
  
  // Filter tags for topic modal
  const filteredTagsForTopic = useMemo(() => {
    if (!topicTagSearch) return tags;
    return tags.filter(tag => 
      tag.label.toLowerCase().includes(topicTagSearch.toLowerCase())
    );
  }, [tags, topicTagSearch]);
  
  // Calculate total highlights for selected tags in topic modal
  const selectedTagsHighlightCount = useMemo(() => {
    return selectedTagIds.reduce((sum, id) => sum + (tagHighlightCounts[id] || 0), 0);
  }, [selectedTagIds]);
  
  const selectedTagsArticleCount = useMemo(() => {
    return selectedTagIds.reduce((sum, id) => sum + (tagArticleCounts[id] || 0), 0);
  }, [selectedTagIds]);
  
  const openCreateTagModal = () => {
    setFormLabel('');
    setFormColor('blue');
    setIsCreateTagModalOpen(true);
  };
  
  const openEditTagModal = (tag: Tag) => {
    setFormLabel(tag.label);
    setFormColor(tag.color);
    setEditingTag(tag);
  };
  
  const openCreateTopicModal = () => {
    setTopicName('');
    setTopicDescription('');
    setSelectedTagIds([]);
    setTopicTagSearch('');
    setIsCreateTopicModalOpen(true);
  };
  
  const openEditTopicModal = (topic: Topic) => {
    setTopicName(topic.name);
    setTopicDescription(topic.description || '');
    setSelectedTagIds(topic.tagIds);
    setTopicTagSearch('');
    setEditingTopic(topic);
  };
  
  const handleCreateTag = () => {
    if (!formLabel.trim()) {
      toast.error('Tag name is required');
      return;
    }
    
    const newTag: Tag = {
      id: `t${Date.now()}`,
      label: formLabel.trim(),
      color: formColor,
    };
    
    setTags(prev => [...prev, newTag]);
    setIsCreateTagModalOpen(false);
    toast.success(`Created tag "${newTag.label}"`);
  };
  
  const handleUpdateTag = () => {
    if (!editingTag || !formLabel.trim()) return;
    
    setTags(prev => prev.map(tag => 
      tag.id === editingTag.id 
        ? { ...tag, label: formLabel.trim(), color: formColor }
        : tag
    ));
    setEditingTag(null);
    toast.success('Tag updated');
  };
  
  const handleDeleteTag = () => {
    if (!deleteConfirmTag) return;
    
    setTags(prev => prev.filter(tag => tag.id !== deleteConfirmTag.id));
    // Remove from topics
    setTopics(prev => prev.map(topic => ({
      ...topic,
      tagIds: topic.tagIds.filter(id => id !== deleteConfirmTag.id),
    })));
    setDeleteConfirmTag(null);
    toast.success(`Deleted tag "${deleteConfirmTag.label}"`);
  };
  
  const handleCreateTopic = () => {
    if (!topicName.trim()) {
      toast.error('Topic name is required');
      return;
    }
    if (selectedTagIds.length === 0) {
      toast.error('Select at least one tag');
      return;
    }
    
    const newTopic: Topic = {
      id: `topic${Date.now()}`,
      name: topicName.trim(),
      description: topicDescription.trim() || undefined,
      tagIds: selectedTagIds,
      highlightCount: selectedTagsHighlightCount,
      articleCount: selectedTagsArticleCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setTopics(prev => [...prev, newTopic]);
    setIsCreateTopicModalOpen(false);
    toast.success(`Created topic "${newTopic.name}"`);
  };
  
  const handleUpdateTopic = () => {
    if (!editingTopic || !topicName.trim()) return;
    
    setTopics(prev => prev.map(topic => 
      topic.id === editingTopic.id 
        ? {
            ...topic,
            name: topicName.trim(),
            description: topicDescription.trim() || undefined,
            tagIds: selectedTagIds,
            highlightCount: selectedTagsHighlightCount,
            articleCount: selectedTagsArticleCount,
            updatedAt: new Date(),
          }
        : topic
    ));
    setEditingTopic(null);
    toast.success('Topic updated');
  };
  
  const handleDeleteTopic = () => {
    if (!deleteConfirmTopic) return;
    
    setTopics(prev => prev.filter(topic => topic.id !== deleteConfirmTopic.id));
    setDeleteConfirmTopic(null);
    toast.success(`Deleted topic "${deleteConfirmTopic.name}"`);
  };
  
  const handleTagClick = (tag: Tag) => {
    navigate(`/library?tag=${encodeURIComponent(tag.label)}`);
  };
  
  const handleTopicClick = (topic: Topic) => {
    // Navigate to highlights filtered by topic's tags
    const tagLabels = topic.tagIds
      .map(id => tags.find(t => t.id === id)?.label)
      .filter(Boolean)
      .join(',');
    navigate(`/highlights?topic=${encodeURIComponent(topic.name)}&tags=${encodeURIComponent(tagLabels)}`);
  };
  
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
  
  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };
  
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Tags</h1>
                <p className="text-body text-muted-foreground">
                  🏷️ {tags.length} tags · 📚 {topics.length} topics
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={openCreateTopicModal} variant="outline" className="gap-2">
                  <Folder className="w-4 h-4" />
                  New Topic
                </Button>
                <Button onClick={openCreateTagModal} className="gap-2 bg-accent hover:bg-accent/90">
                  <Plus className="w-4 h-4" />
                  New Tag
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="pl-10 bg-muted border-border"
              />
            </div>
            
            {/* Topics Section */}
            {topics.length > 0 && (
              <Collapsible open={isTopicsSectionOpen} onOpenChange={setIsTopicsSectionOpen} className="mb-6">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-card border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-foreground">Topics</span>
                    <span className="text-caption text-muted-foreground">
                      ({topics.length})
                    </span>
                  </div>
                  {isTopicsSectionOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  {topics.map((topic) => {
                    const topicTags = topic.tagIds
                      .map(id => tags.find(t => t.id === id))
                      .filter(Boolean) as Tag[];
                    
                    return (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group bg-card rounded-lg border border-border/50 hover:border-border p-4 transition-all cursor-pointer"
                        onClick={() => handleTopicClick(topic)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-accent" />
                            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                              {topic.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTopicModal(topic);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmTopic(topic);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-caption text-muted-foreground mb-3">
                          {topic.tagIds.length} tags · {topic.highlightCount} highlights · {topic.articleCount} articles
                        </p>
                        
                        {/* Tags preview */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {topicTags.slice(0, 5).map(tag => {
                            const colorClass = colorOptions.find(c => c.value === tag.color)?.class || 'bg-tag-gray';
                            return (
                              <span
                                key={tag.id}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-micro',
                                  colorClass,
                                  'text-white'
                                )}
                              >
                                #{tag.label}
                              </span>
                            );
                          })}
                          {topicTags.length > 5 && (
                            <span className="text-micro text-muted-foreground">
                              +{topicTags.length - 5} more
                            </span>
                          )}
                        </div>
                        
                        <p className="text-micro text-muted-foreground">
                          Last updated: {getTimeAgo(topic.updatedAt)}
                        </p>
                      </motion.div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* All Tags Section */}
            <div>
              <h2 className="text-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                All Tags
                <span className="text-caption text-muted-foreground font-normal">
                  ({sortedTags.length})
                </span>
              </h2>
              
              {sortedTags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <span className="text-2xl">🏷️</span>
                  </div>
                  <h2 className="text-heading font-semibold text-foreground mb-2">
                    {tagSearch ? 'No tags found' : 'No tags yet'}
                  </h2>
                  <p className="text-body text-muted-foreground max-w-sm mb-4">
                    {tagSearch 
                      ? 'Try a different search term'
                      : 'Create your first tag to start organizing content'
                    }
                  </p>
                  {!tagSearch && (
                    <Button onClick={openCreateTagModal} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Tag
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence mode="popLayout">
                    {sortedTags.map((tag) => {
                      const count = tagArticleCounts[tag.id] || 0;
                      const highlightCount = tagHighlightCounts[tag.id] || 0;
                      const colorClass = colorOptions.find(c => c.value === tag.color)?.class || 'bg-tag-gray';
                      
                      return (
                        <motion.div
                          key={tag.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group bg-card rounded-lg border border-border/50 hover:border-border p-4 transition-all cursor-pointer card-lift"
                          onClick={() => handleTagClick(tag)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn('w-4 h-4 rounded-full', colorClass)} />
                              <div>
                                <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                                  {tag.label}
                                </h3>
                                <p className="text-caption text-muted-foreground">
                                  {count} article{count !== 1 ? 's' : ''} · {highlightCount} highlight{highlightCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTagModal(tag);
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmTag(tag);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Create/Edit Tag Modal */}
      <Dialog 
        open={isCreateTagModalOpen || !!editingTag} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateTagModalOpen(false);
            setEditingTag(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogDescription>
              {editingTag ? 'Update your tag name and color' : 'Add a new tag to organize your content'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-caption font-medium text-foreground">Name</label>
              <Input
                placeholder="e.g. Machine Learning"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                className="bg-muted border-border"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-caption font-medium text-foreground">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormColor(color.value)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all flex items-center justify-center',
                      color.class,
                      formColor === color.value 
                        ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110' 
                        : 'hover:scale-105'
                    )}
                    title={color.label}
                  >
                    {formColor === color.value && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-caption font-medium text-foreground">Preview</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  colorOptions.find(c => c.value === formColor)?.class
                )} />
                <span className="text-body text-foreground">
                  {formLabel || 'Tag name'}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateTagModalOpen(false);
                setEditingTag(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingTag ? handleUpdateTag : handleCreateTag}
              className="bg-accent hover:bg-accent/90"
            >
              {editingTag ? 'Save Changes' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create/Edit Topic Modal */}
      <Dialog 
        open={isCreateTopicModalOpen || !!editingTopic} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateTopicModalOpen(false);
            setEditingTopic(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
            <DialogDescription>
              Group related tags together to synthesize knowledge across sources
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-caption font-medium text-foreground">Topic Name</label>
              <Input
                placeholder="e.g. AI Ethics Research"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="bg-muted border-border"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-caption font-medium text-foreground">Description (optional)</label>
              <Textarea
                placeholder="Research on ethical implications of AI systems..."
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                className="bg-muted border-border resize-none"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-caption font-medium text-foreground">Select Tags to Include</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={topicTagSearch}
                  onChange={(e) => setTopicTagSearch(e.target.value)}
                  className="pl-10 bg-muted border-border"
                />
              </div>
              
              <ScrollArea className="h-[200px] border border-border rounded-lg p-2">
                <div className="space-y-1">
                  {filteredTagsForTopic.map(tag => {
                    const colorClass = colorOptions.find(c => c.value === tag.color)?.class || 'bg-tag-gray';
                    const isSelected = selectedTagIds.includes(tag.id);
                    const highlightCount = tagHighlightCounts[tag.id] || 0;
                    
                    return (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleTagSelection(tag.id)}
                        />
                        <span className={cn('w-2 h-2 rounded-full', colorClass)} />
                        <span className="flex-1 text-body">{tag.label}</span>
                        <span className="text-micro text-muted-foreground">
                          {highlightCount} highlights
                        </span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
            
            {selectedTagIds.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-caption text-muted-foreground">
                  This topic will include <span className="text-foreground font-medium">{selectedTagsHighlightCount}</span> highlights 
                  across <span className="text-foreground font-medium">{selectedTagsArticleCount}</span> articles.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateTopicModalOpen(false);
                setEditingTopic(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingTopic ? handleUpdateTopic : handleCreateTopic}
              className="bg-accent hover:bg-accent/90"
            >
              {editingTopic ? 'Save Changes' : 'Create Topic'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Tag Confirmation */}
      <AlertDialog open={!!deleteConfirmTag} onOpenChange={() => setDeleteConfirmTag(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteConfirmTag?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the tag from all articles and topics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Topic Confirmation */}
      <AlertDialog open={!!deleteConfirmTopic} onOpenChange={() => setDeleteConfirmTopic(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete topic "{deleteConfirmTopic?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the topic. The tags within it will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Content Modal */}
      <AddContentModal
        open={isAddContentModalOpen}
        onOpenChange={setIsAddContentModalOpen}
      />
    </div>
  );
};

export default Tags;
