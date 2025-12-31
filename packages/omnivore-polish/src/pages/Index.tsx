import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import FilterBar from '@/components/layout/FilterBar'
import SectionTabs, { SectionTab } from '@/components/layout/SectionTabs'
import LibraryCard from '@/components/library/LibraryCard'
import MultiSelectBar from '@/components/library/MultiSelectBar'
import AddContentModal from '@/components/modals/AddContentModal'
import { mockArticles } from '@/data/mockArticles'
import type { Article, DensityMode } from '@/types/article'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'

type SortOption =
  | 'recent'
  | 'oldest'
  | 'updated'
  | 'reading-time'
  | 'reading-time-desc'
  | 'title'
  | 'author'
  | 'published'
type ViewMode = 'grid' | 'list'

const Index = () => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [articles, setArticles] = useState<Article[]>(mockArticles)
  const [activeSection, setActiveSection] = useState('library')
  const [activeTab, setActiveTab] = useState<SectionTab>('all')
  const [density, setDensity] = useState<DensityMode>('comfortable')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [readLaterIds, setReadLaterIds] = useState<Set<string>>(
    new Set(['1', '3', '5']),
  )

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    const filtered = articles.filter((article) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          article.title.toLowerCase().includes(query) ||
          article.sourceName.toLowerCase().includes(query) ||
          article.author?.toLowerCase().includes(query) ||
          article.tags.some((t) => t.label.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Tab filter
      switch (activeTab) {
        case 'all':
          return article.state !== 'archived'
        case 'inprogress':
          return (
            article.progress > 0 &&
            article.progress < 100 &&
            article.state !== 'archived'
          )
        case 'readlater':
          return (
            readLaterIds.has(article.id) &&
            article.progress === 0 &&
            article.state !== 'archived'
          )
        case 'starred':
          return (
            article.flairs.some((f) => f.icon === 'star') &&
            article.state !== 'archived'
          )
        case 'trash':
          return article.state === 'archived'
        default:
          return true
      }
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.savedAt.getTime() - a.savedAt.getTime()
        case 'oldest':
          return a.savedAt.getTime() - b.savedAt.getTime()
        case 'updated':
          return b.savedAt.getTime() - a.savedAt.getTime() // Would use updatedAt in real app
        case 'reading-time':
          return a.readingTime - b.readingTime
        case 'reading-time-desc':
          return b.readingTime - a.readingTime
        case 'title':
          return a.title.localeCompare(b.title)
        case 'author':
          return (a.author || '').localeCompare(b.author || '')
        case 'published':
          return b.savedAt.getTime() - a.savedAt.getTime() // Would use publishedAt in real app
        default:
          return 0
      }
    })

    return filtered
  }, [articles, activeTab, sortBy, searchQuery, readLaterIds])

  const selectedArticles = articles.filter((a) => a.isSelected)
  const selectedCount = selectedArticles.length

  // Calculate counts
  const counts = useMemo(() => {
    return {
      all: articles.filter((a) => a.state !== 'archived').length,
      inprogress: articles.filter(
        (a) => a.progress > 0 && a.progress < 100 && a.state !== 'archived',
      ).length,
      readlater: articles.filter(
        (a) =>
          readLaterIds.has(a.id) && a.progress === 0 && a.state !== 'archived',
      ).length,
      starred: articles.filter(
        (a) =>
          a.flairs.some((f) => f.icon === 'star') && a.state !== 'archived',
      ).length,
      trash: articles.filter((a) => a.state === 'archived').length,
    }
  }, [articles, readLaterIds])

  const handleSelect = (id: string) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id
          ? { ...article, isSelected: !article.isSelected }
          : article,
      ),
    )
  }

  const handleClearSelection = () => {
    setArticles((prev) =>
      prev.map((article) => ({ ...article, isSelected: false })),
    )
    setIsSelectMode(false)
  }

  const handleRead = (id: string) => {
    navigate(`/reader/${id}`)
  }

  const handleReadLater = (id: string) => {
    setReadLaterIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast.success('Removed from Read Later')
      } else {
        next.add(id)
        toast.success('Added to Read Later')
      }
      return next
    })
  }

  const handleMarkAsRead = (id: string) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id ? { ...article, progress: 100 } : article,
      ),
    )
    toast.success('Marked as read')
  }

  const handleArchive = (id?: string) => {
    if (id) {
      setArticles((prev) =>
        prev.map((article) =>
          article.id === id ? { ...article, state: 'archived' } : article,
        ),
      )
      toast.success('Moved to Trash', {
        action: {
          label: 'Undo',
          onClick: () => {
            setArticles((prev) =>
              prev.map((article) =>
                article.id === id ? { ...article, state: 'default' } : article,
              ),
            )
          },
        },
      })
    } else {
      const ids = selectedArticles.map((a) => a.id)
      setArticles((prev) =>
        prev.map((article) =>
          ids.includes(article.id)
            ? { ...article, state: 'archived', isSelected: false }
            : article,
        ),
      )
      setIsSelectMode(false)
      toast.success(`Moved ${ids.length} articles to Trash`, {
        action: {
          label: 'Undo',
          onClick: () => {
            setArticles((prev) =>
              prev.map((article) =>
                ids.includes(article.id)
                  ? { ...article, state: 'default' }
                  : article,
              ),
            )
          },
        },
      })
    }
  }

  const handleStar = (id: string) => {
    setArticles((prev) =>
      prev.map((article) => {
        if (article.id !== id) return article
        const hasStarFlair = article.flairs.some((f) => f.icon === 'star')
        if (hasStarFlair) {
          return {
            ...article,
            flairs: article.flairs.filter((f) => f.icon !== 'star'),
          }
        } else {
          return {
            ...article,
            flairs: [
              ...article.flairs,
              { icon: 'star' as const, name: 'Starred' },
            ],
          }
        }
      }),
    )
  }

  const handleDelete = (id?: string) => {
    if (id) {
      const article = articles.find((a) => a.id === id)
      setArticles((prev) => prev.filter((a) => a.id !== id))
      toast.success('Article deleted permanently', {
        action: {
          label: 'Undo',
          onClick: () => {
            if (article) {
              setArticles((prev) => [...prev, article])
            }
          },
        },
      })
    } else {
      const toDelete = selectedArticles
      setArticles((prev) => prev.filter((a) => !a.isSelected))
      setIsSelectMode(false)
      toast.success(`Deleted ${toDelete.length} articles permanently`, {
        action: {
          label: 'Undo',
          onClick: () => {
            setArticles((prev) => [
              ...prev,
              ...toDelete.map((a) => ({ ...a, isSelected: false })),
            ])
          },
        },
      })
    }
  }

  const handleRetry = (id: string) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id ? { ...article, state: 'processing' } : article,
      ),
    )

    setTimeout(() => {
      setArticles((prev) =>
        prev.map((article) =>
          article.id === id
            ? { ...article, state: 'default', readingTime: 5 }
            : article,
        ),
      )
      toast.success('Article processed successfully!')
    }, 2000)
  }

  // Grid columns based on density
  const gridClass = cn(
    'grid gap-4 auto-rows-fr',
    viewMode === 'list'
      ? 'grid-cols-1'
      : density === 'compact'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : density === 'spacious'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  )

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'all':
        return 'No articles yet. Click +Add to save your first article.'
      case 'inprogress':
        return 'No articles in progress. Start reading to see them here.'
      case 'readlater':
        return 'Your reading queue is empty. Add items from Today to read later.'
      case 'starred':
        return 'No starred articles yet. Star items to save your favorites.'
      case 'trash':
        return 'Trash is empty.'
      default:
        return 'No articles found.'
    }
  }

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
              setActiveSection(section)
              setIsMobileMenuOpen(false)
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
            logout()
            navigate('/login')
          }}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Section Tabs with Select toggle */}
            <SectionTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={counts}
              isSelectMode={isSelectMode}
              onSelectModeToggle={() => {
                if (isSelectMode) {
                  handleClearSelection()
                } else {
                  setIsSelectMode(true)
                }
              }}
            />

            {/* Filter Bar */}
            <FilterBar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              density={density}
              onDensityChange={setDensity}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onLabelsClick={() => navigate('/tags')}
            />

            {/* Article Grid */}
            {filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <h2 className="text-heading font-semibold text-foreground mb-2">
                  {activeTab === 'trash'
                    ? 'Trash is empty'
                    : 'No articles here'}
                </h2>
                <p className="text-body text-muted-foreground max-w-sm">
                  {getEmptyStateMessage()}
                </p>
              </div>
            ) : (
              <div className={gridClass}>
                <AnimatePresence mode="popLayout">
                  {filteredArticles.map((article) => (
                    <LibraryCard
                      key={article.id}
                      article={article}
                      density={density}
                      isSelectMode={isSelectMode}
                      isInReadLater={readLaterIds.has(article.id)}
                      onSelect={handleSelect}
                      onRead={handleRead}
                      onReadLater={() => handleReadLater(article.id)}
                      onMarkAsRead={() => handleMarkAsRead(article.id)}
                      onStar={() => handleStar(article.id)}
                      onArchive={handleArchive}
                      onTag={() => toast.info('Add tags coming soon!')}
                      onDelete={handleDelete}
                      onRetry={handleRetry}
                      onEnterSelectMode={() => setIsSelectMode(true)}
                      onTagClick={(tag) =>
                        navigate(
                          `/library?tag=${encodeURIComponent(tag.label)}`,
                        )
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>

      <MultiSelectBar
        selectedCount={selectedCount}
        onArchive={() => handleArchive()}
        onTag={() => toast.info('Batch tagging coming soon!')}
        onDelete={() => handleDelete()}
        onClear={handleClearSelection}
      />

      {selectedCount > 0 && <div className="h-20" />}

      {/* Add Content Modal */}
      <AddContentModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </div>
  )
}

export default Index
