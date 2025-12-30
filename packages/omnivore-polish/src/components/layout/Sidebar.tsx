import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Highlighter,
  Tag,
  ChevronDown,
  ChevronRight,
  Rss,
  Mail,
  Youtube,
  Headphones,
  Plus,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

interface Subscription {
  id: string
  name: string
  icon?: string
  count: number
  color?: string
}

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  className?: string
}

const defaultRssFeeds: Subscription[] = [
  { id: 'npr', name: 'NPR Topics: Health', count: 8, color: 'bg-tag-red' },
  { id: 'daily', name: 'The Daily', count: 14, color: 'bg-tag-blue' },
  { id: 'hackernews', name: 'Hacker News', count: 30, color: 'bg-tag-orange' },
  { id: 'techcrunch', name: 'TechCrunch', count: 20, color: 'bg-tag-green' },
]

const defaultNewsletters: Subscription[] = [
  { id: 'dense', name: 'Dense Discovery', count: 3 },
  { id: 'hacker-newsletter', name: 'Hacker Newsletter', count: 0 },
  { id: 'morning-brew', name: 'Morning Brew', count: 5 },
  { id: 'daily-tech', name: 'The Daily Tech', count: 0 },
]

const defaultPodcasts: Subscription[] = [
  { id: 'lex', name: 'Lex Fridman Podcast', count: 2, color: 'bg-tag-purple' },
  { id: 'huberman', name: 'Huberman Lab', count: 4, color: 'bg-tag-blue' },
]

const defaultYoutube: Subscription[] = [
  { id: 'veritasium', name: 'Veritasium', count: 1, color: 'bg-tag-red' },
  { id: 'fireship', name: 'Fireship', count: 3, color: 'bg-tag-orange' },
]

const Sidebar = ({
  activeSection,
  onSectionChange,
  className,
}: SidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sections, setSections] = useState<Record<string, boolean>>({
    rss: true,
    newsletters: true,
    podcasts: false,
    youtube: false,
  })

  const toggleSection = (key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const mainNavItems = [
    { id: 'today', label: 'Today', icon: Sparkles, path: '/today' },
    { id: 'library', label: 'Library', icon: BookOpen, path: '/library' },
    {
      id: 'highlights',
      label: 'Highlights',
      icon: Highlighter,
      path: '/highlights',
    },
    { id: 'tags', label: 'Tags', icon: Tag, path: '/tags' },
    { id: 'feeds', label: 'Feeds', icon: Rss, path: '/feeds' },
  ]

  const contentSections = [
    { key: 'rss', label: 'RSS Feeds', icon: Rss, items: defaultRssFeeds },
    {
      key: 'newsletters',
      label: 'Newsletters',
      icon: Mail,
      items: defaultNewsletters,
    },
    {
      key: 'podcasts',
      label: 'Podcasts',
      icon: Headphones,
      items: defaultPodcasts,
    },
    { key: 'youtube', label: 'YouTube', icon: Youtube, items: defaultYoutube },
  ]

  const handleNavClick = (item: (typeof mainNavItems)[0]) => {
    onSectionChange(item.id)
    navigate(item.path)
  }

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  return (
    <aside
      className={cn(
        'w-[220px] bg-sidebar flex-shrink-0 border-r border-sidebar-border flex flex-col',
        className,
      )}
    >
      {/* Logo/Branding - aligned with TopBar height (h-16) */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-yellow flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">Omnivore</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-3">
          {/* Main Navigation */}
          <nav className="px-2 space-y-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.path)
              const isToday = item.id === 'today'
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-body transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                      : isToday
                      ? 'text-accent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isToday && !isActive && 'text-accent',
                    )}
                  />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Content Subscriptions */}
          <div className="mt-5">
            <div className="px-4 mb-2 flex items-center justify-between">
              <span className="text-micro uppercase tracking-wider text-muted-foreground font-medium">
                Feeds
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/feeds')}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {contentSections.map((section) => {
              const Icon = section.icon
              const isExpanded = sections[section.key]
              const totalCount = section.items.reduce(
                (sum, item) => sum + item.count,
                0,
              )

              return (
                <div key={section.key} className="px-2 mb-1">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-caption text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-sidebar-accent/30"
                  >
                    <span className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <Icon className="w-3.5 h-3.5" />
                      <span>{section.label}</span>
                    </span>
                    {totalCount > 0 && (
                      <span className="text-micro text-muted-foreground">
                        {totalCount}
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            onSectionChange(`${section.key}-${item.id}`)
                          }
                          className={cn(
                            'w-full flex items-center justify-between px-2 py-1 rounded text-caption transition-colors',
                            activeSection === `${section.key}-${item.id}`
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                          )}
                        >
                          <span className="flex items-center gap-2 truncate">
                            {item.color && (
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  item.color,
                                )}
                              />
                            )}
                            <span className="truncate">{item.name}</span>
                          </span>
                          {item.count > 0 && (
                            <span className="flex-shrink-0 ml-2 text-micro text-muted-foreground">
                              {item.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}

export default Sidebar
