import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { toast } from 'sonner'
import {
  Settings2,
  Columns2,
  Columns3,
  Square,
  Wand2,
  Tag,
  Brain,
  Keyboard,
  Database,
  Plug,
  Chrome,
  Download,
  Key,
  Beaker,
  Shield,
  Code,
  FileJson,
  FileText,
  Info,
  ExternalLink,
  Heart,
  Github,
  MessageCircle,
  Bug,
  Lightbulb,
  FileCheck,
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import AddContentModal from '@/components/modals/AddContentModal'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const Settings = () => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [activeSection, setActiveSection] = useState('settings')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // General - Reading Experience
  const [readerLayout, setReaderLayout] = useState<'single' | 'two' | 'three'>(
    'two',
  )
  const [contentWidth, setContentWidth] = useState([50]) // 0-100 maps to 480-880px
  const [autoScrollSpeed, setAutoScrollSpeed] = useState([25]) // 0-100 maps to very slow - fast

  // General - Tags & Organization
  const [autoTagBySource, setAutoTagBySource] = useState(true)
  const [autoTagNewsletters, setAutoTagNewsletters] = useState(true)
  const [suggestTags, setSuggestTags] = useState(false)

  // General - AI Features
  const [aiSummariesEnabled, setAiSummariesEnabled] = useState(true)
  const [aiProvider, setAiProvider] = useState('openai-gpt4')
  const [apiKey, setApiKey] = useState('sk-••••••••••••••••••••')
  const [shareUsageData, setShareUsageData] = useState(true)

  // General - Data Management
  const [autoDeleteTrash, setAutoDeleteTrash] = useState(true)
  const [autoDeleteRead, setAutoDeleteRead] = useState(false)

  // Integrations
  const [exportHighlights, setExportHighlights] = useState(true)
  const [exportNotes, setExportNotes] = useState(true)
  const [exportStats, setExportStats] = useState(false)
  const [defaultExportFormat, setDefaultExportFormat] = useState('markdown')
  const [showApiKey, setShowApiKey] = useState(false)

  // Advanced - Experimental
  const [aiRecommendations, setAiRecommendations] = useState(false)
  const [topicDetection, setTopicDetection] = useState(false)
  const [readingSpeed, setReadingSpeed] = useState(false)
  const [voiceNarration, setVoiceNarration] = useState(false)

  // Advanced - Privacy
  const [disableAnalytics, setDisableAnalytics] = useState(false)
  const [disableTelemetry, setDisableTelemetry] = useState(false)
  const [dontTrackReading, setDontTrackReading] = useState(false)

  // Advanced - Developer
  const [enableConsole, setEnableConsole] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [logApiRequests, setLogApiRequests] = useState(false)

  const getContentWidthPx = (value: number) =>
    Math.round(480 + (value / 100) * 400)

  const getScrollSpeedLabel = (value: number) => {
    if (value < 20) return 'Very Slow'
    if (value < 40) return 'Slow'
    if (value < 60) return 'Medium'
    if (value < 80) return 'Fast'
    return 'Very Fast'
  }

  const mockApiKey = 'mock_api_key_abc123def456ghi789jkl012'

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(mockApiKey)
    toast.success('API key copied to clipboard')
  }

  const handleRegenerateApiKey = () => {
    toast.success('API key regenerated. Update your integrations.')
  }

  const handleTestConnection = () => {
    toast.success('Connection successful!')
  }

  const handleClearCache = () => {
    toast.success('Cache cleared (245 MB freed)')
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
          onSettingsClick={() => {}}
          onProfileClick={() => navigate('/profile')}
          onLogoutClick={() => {
            logout()
            navigate('/login')
          }}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Page Header */}
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start bg-elevated border border-border h-auto flex-wrap gap-1 p-1">
                <TabsTrigger
                  value="general"
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="integrations"
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  Integrations
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  Advanced
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  About
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-6 space-y-6">
                {/* Reading Experience */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-6">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-accent" />
                    Reading Experience
                  </h2>

                  {/* Reader Layout */}
                  <div className="space-y-3">
                    <Label>Reader Layout</Label>
                    <RadioGroup
                      value={readerLayout}
                      onValueChange={(v) =>
                        setReaderLayout(v as typeof readerLayout)
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label
                          htmlFor="single"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Square className="w-4 h-4" /> Single
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="two" id="two" />
                        <Label
                          htmlFor="two"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Columns2 className="w-4 h-4" /> Two Columns
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="three" id="three" />
                        <Label
                          htmlFor="three"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Columns3 className="w-4 h-4" /> Three Columns
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Content Width */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Content Width</Label>
                      <span className="text-sm text-muted-foreground">
                        {getContentWidthPx(contentWidth[0])}px
                      </span>
                    </div>
                    <Slider
                      value={contentWidth}
                      onValueChange={setContentWidth}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Narrow</span>
                      <span>Medium</span>
                      <span>Wide</span>
                    </div>
                  </div>

                  {/* Auto-Scroll Speed */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Auto-Scroll Speed</Label>
                      <span className="text-sm text-muted-foreground">
                        {getScrollSpeedLabel(autoScrollSpeed[0])}
                      </span>
                    </div>
                    <Slider
                      value={autoScrollSpeed}
                      onValueChange={setAutoScrollSpeed}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </section>

                {/* Tags & Organization */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Tag className="w-5 h-5 text-accent" />
                    Tags & Organization
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Auto-tag items by source
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Adds #newsletter, #rss, #article, #pdf
                        </p>
                      </div>
                      <Switch
                        checked={autoTagBySource}
                        onCheckedChange={setAutoTagBySource}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Auto-tag newsletters by name
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Adds #dense-discovery, #morning-brew, etc.
                        </p>
                      </div>
                      <Switch
                        checked={autoTagNewsletters}
                        onCheckedChange={setAutoTagNewsletters}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Suggest tags based on content
                        </p>
                        <p className="text-xs text-muted-foreground">
                          AI suggests tags from article content
                        </p>
                      </div>
                      <Switch
                        checked={suggestTags}
                        onCheckedChange={setSuggestTags}
                      />
                    </div>
                  </div>
                </section>

                {/* AI Features */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Brain className="w-5 h-5 text-accent" />
                    AI Features
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          AI Summaries
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Show AI-generated summaries on library cards
                        </p>
                      </div>
                      <Switch
                        checked={aiSummariesEnabled}
                        onCheckedChange={setAiSummariesEnabled}
                      />
                    </div>

                    {aiSummariesEnabled && (
                      <div className="space-y-4 pl-4 border-l-2 border-border">
                        <div className="space-y-2">
                          <Label>AI Provider</Label>
                          <Select
                            value={aiProvider}
                            onValueChange={setAiProvider}
                          >
                            <SelectTrigger className="bg-elevated border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai-gpt4">
                                OpenAI (GPT-4)
                              </SelectItem>
                              <SelectItem value="openai-gpt35">
                                OpenAI (GPT-3.5-turbo)
                              </SelectItem>
                              <SelectItem value="anthropic-claude">
                                Anthropic (Claude)
                              </SelectItem>
                              <SelectItem value="local-ollama">
                                Local (Ollama)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <div className="flex gap-2">
                            <Input
                              type={showApiKey ? 'text' : 'password'}
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              className="bg-elevated border-border flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleTestConnection}
                            >
                              Test Connection
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator className="bg-border" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Share anonymous usage data
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Help improve AI recommendations
                        </p>
                      </div>
                      <Switch
                        checked={shareUsageData}
                        onCheckedChange={setShareUsageData}
                      />
                    </div>
                  </div>
                </section>

                {/* Keyboard Shortcuts */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-accent" />
                    Keyboard Shortcuts
                  </h2>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsShortcutsOpen(true)}
                    >
                      View All Shortcuts
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toast.info('Customization coming soon!')}
                    >
                      Customize Shortcuts
                    </Button>
                  </div>
                </section>

                {/* Data Management */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Database className="w-5 h-5 text-accent" />
                    Data Management
                  </h2>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Auto-Cleanup
                    </h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Delete trashed items after 30 days
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Permanently deletes items in Trash
                        </p>
                      </div>
                      <Switch
                        checked={autoDeleteTrash}
                        onCheckedChange={setAutoDeleteTrash}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Delete read items after 1 year
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Auto-delete completed items (excludes starred)
                        </p>
                      </div>
                      <Switch
                        checked={autoDeleteRead}
                        onCheckedChange={setAutoDeleteRead}
                      />
                    </div>

                    <Separator className="bg-border" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Storage
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cache Size: 245 MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCache}
                      >
                        Clear Cache
                      </Button>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="mt-6 space-y-6">
                {/* Connected Services */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Plug className="w-5 h-5 text-accent" />
                    Connected Services
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-elevated rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-lg">
                          📝
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Obsidian
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Export highlights and notes
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Configure Obsidian...')}
                      >
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-elevated rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-lg">
                          🗒
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Notion</p>
                          <p className="text-xs text-muted-foreground">
                            Sync your library to Notion
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Connect Notion...')}
                      >
                        Connect
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-elevated rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-lg">
                          🌐
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Readwise
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Export highlights to Readwise
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Connect Readwise...')}
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Browser Extension */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Chrome className="w-5 h-5 text-accent" />
                    Browser Extension
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Install the browser extension to save articles with one
                    click.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('Opening Chrome Web Store...')}
                    >
                      <Chrome className="w-4 h-4 mr-1" /> Chrome
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('Opening Firefox Add-ons...')}
                    >
                      Firefox
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('Opening Safari Extensions...')}
                    >
                      Safari
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('Opening Edge Add-ons...')}
                    >
                      Edge
                    </Button>
                  </div>
                </section>

                {/* Export Options */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Download className="w-5 h-5 text-accent" />
                    Export Options
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Include highlights in exports
                      </p>
                      <Switch
                        checked={exportHighlights}
                        onCheckedChange={setExportHighlights}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Include notes in exports
                      </p>
                      <Switch
                        checked={exportNotes}
                        onCheckedChange={setExportNotes}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Include reading statistics
                      </p>
                      <Switch
                        checked={exportStats}
                        onCheckedChange={setExportStats}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Default Export Format</Label>
                      <Select
                        value={defaultExportFormat}
                        onValueChange={setDefaultExportFormat}
                      >
                        <SelectTrigger className="w-48 bg-elevated border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="markdown">Markdown</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* API Access */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Key className="w-5 h-5 text-accent" />
                    API Access
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={
                            showApiKey ? mockApiKey : '••••••••••••••••••••'
                          }
                          readOnly
                          className="bg-elevated border-border font-mono text-sm flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? 'Hide' : 'Show'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyApiKey}
                        >
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRegenerateApiKey}
                        >
                          Regenerate
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="link"
                      className="text-accent p-0 h-auto"
                      onClick={() => toast.info('Opening API docs...')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" /> View API
                      Documentation
                    </Button>
                  </div>
                </section>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="mt-6 space-y-6">
                {/* Experimental Features */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Beaker className="w-5 h-5 text-accent" />
                    Experimental Features
                  </h2>

                  <div className="p-3 bg-[hsl(var(--state-warning))]/10 border border-[hsl(var(--state-warning))]/30 rounded-lg">
                    <p className="text-sm text-[hsl(var(--state-warning))]">
                      ⚠️ These features are experimental and may change or be
                      removed.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          AI-powered reading recommendations
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Today page shows AI-suggested content
                        </p>
                      </div>
                      <Switch
                        checked={aiRecommendations}
                        onCheckedChange={setAiRecommendations}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Automatic topic detection
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Group tags into topics automatically
                        </p>
                      </div>
                      <Switch
                        checked={topicDetection}
                        onCheckedChange={setTopicDetection}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Reading speed analysis
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Track WPM and suggest pacing
                        </p>
                      </div>
                      <Switch
                        checked={readingSpeed}
                        onCheckedChange={setReadingSpeed}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Voice narration (text-to-speech)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Listen to articles with AI voice
                        </p>
                      </div>
                      <Switch
                        checked={voiceNarration}
                        onCheckedChange={setVoiceNarration}
                      />
                    </div>
                  </div>
                </section>

                {/* Data & Privacy */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent" />
                    Data & Privacy
                  </h2>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Privacy Mode
                    </h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Disable analytics tracking
                        </p>
                        <p className="text-xs text-muted-foreground">
                          No usage analytics collected
                        </p>
                      </div>
                      <Switch
                        checked={disableAnalytics}
                        onCheckedChange={setDisableAnalytics}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Disable telemetry
                        </p>
                        <p className="text-xs text-muted-foreground">
                          No error reporting
                        </p>
                      </div>
                      <Switch
                        checked={disableTelemetry}
                        onCheckedChange={setDisableTelemetry}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Don't track reading time
                        </p>
                        <p className="text-xs text-muted-foreground">
                          No reading session recording
                        </p>
                      </div>
                      <Switch
                        checked={dontTrackReading}
                        onCheckedChange={setDontTrackReading}
                      />
                    </div>
                  </div>
                </section>

                {/* Developer Options */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Code className="w-5 h-5 text-accent" />
                    Developer Options
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Enable developer console
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Show debug logs in browser console
                        </p>
                      </div>
                      <Switch
                        checked={enableConsole}
                        onCheckedChange={setEnableConsole}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Show debug information
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Display API response times, cache hits
                        </p>
                      </div>
                      <Switch
                        checked={showDebugInfo}
                        onCheckedChange={setShowDebugInfo}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Log API requests
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Console log all requests
                        </p>
                      </div>
                      <Switch
                        checked={logApiRequests}
                        onCheckedChange={setLogApiRequests}
                      />
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => toast.info('Opening developer console...')}
                    >
                      Open Developer Console
                    </Button>
                  </div>
                </section>

                {/* Import / Export */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-accent" />
                    Import / Export
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Import Data
                      </h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => toast.info('Import from Pocket...')}
                        >
                          Import from Pocket
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() =>
                            toast.info('Import from Instapaper...')
                          }
                        >
                          Import from Instapaper
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => toast.info('Import from Readwise...')}
                        >
                          Import from Readwise
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => toast.info('Import from JSON...')}
                        >
                          Import from JSON
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Export Data
                      </h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => toast.info('Exporting library...')}
                        >
                          <FileJson className="w-4 h-4 mr-2" /> Export Full
                          Library (JSON)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => toast.info('Exporting highlights...')}
                        >
                          <FileText className="w-4 h-4 mr-2" /> Export
                          Highlights (Markdown)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => toast.info('Exporting stats...')}
                        >
                          <FileCheck className="w-4 h-4 mr-2" /> Export Reading
                          Stats (CSV)
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                {/* App Info */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <div className="text-center py-4">
                    <pre className="text-accent text-xs font-mono mb-4">
                      {`    ___                  _                
   / _ \\ _ __ ___  _ __ (_)_   _____  _ __ ___ 
  | | | | '_ \` _ \\| '_ \\| \\ \\ / / _ \\| '__/ _ \\
  | |_| | | | | | | | | | |\\ V / (_) | | |  __/
   \\___/|_| |_| |_|_| |_|_| \\_/ \\___/|_|  \\___|`}
                    </pre>
                  </div>

                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Info className="w-5 h-5 text-accent" />
                    Version Information
                  </h2>

                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span className="text-foreground font-mono">v2.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Build</span>
                      <span className="text-foreground font-mono">
                        2024.12.21
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Environment</span>
                      <span className="text-foreground">
                        Production (Cloud)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API Version</span>
                      <span className="text-foreground font-mono">v1.2.0</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast.info('You are on the latest version!')
                      }
                    >
                      Check for Updates
                    </Button>
                  </div>
                </section>

                {/* Resources */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Resources
                  </h2>

                  <div className="grid gap-3">
                    <Button
                      variant="ghost"
                      className="justify-start h-auto py-3"
                      onClick={() => toast.info('Opening docs...')}
                    >
                      <FileText className="w-5 h-5 mr-3 text-accent" />
                      <div className="text-left">
                        <p className="font-medium">Documentation</p>
                        <p className="text-xs text-muted-foreground">
                          Learn how to use all features
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-start h-auto py-3"
                      onClick={() => toast.info('Opening Discord...')}
                    >
                      <MessageCircle className="w-5 h-5 mr-3 text-accent" />
                      <div className="text-left">
                        <p className="font-medium">Community Discord</p>
                        <p className="text-xs text-muted-foreground">
                          Chat with other users
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-start h-auto py-3"
                      onClick={() => toast.info('Opening GitHub...')}
                    >
                      <Github className="w-5 h-5 mr-3 text-accent" />
                      <div className="text-left">
                        <p className="font-medium">GitHub Repository</p>
                        <p className="text-xs text-muted-foreground">
                          View source code and contribute
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-start h-auto py-3"
                      onClick={() => toast.info('Opening issue form...')}
                    >
                      <Bug className="w-5 h-5 mr-3 text-accent" />
                      <div className="text-left">
                        <p className="font-medium">Report a Bug</p>
                        <p className="text-xs text-muted-foreground">
                          Found an issue? Let us know
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-start h-auto py-3"
                      onClick={() => toast.info('Opening feedback form...')}
                    >
                      <Lightbulb className="w-5 h-5 mr-3 text-accent" />
                      <div className="text-left">
                        <p className="font-medium">Request a Feature</p>
                        <p className="text-xs text-muted-foreground">
                          Share your ideas
                        </p>
                      </div>
                    </Button>
                  </div>
                </section>

                {/* Legal */}
                <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Legal
                  </h2>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="link"
                      className="text-accent p-0 h-auto"
                      onClick={() => toast.info('Opening Privacy Policy...')}
                    >
                      Privacy Policy
                    </Button>
                    <Button
                      variant="link"
                      className="text-accent p-0 h-auto"
                      onClick={() => toast.info('Opening Terms of Service...')}
                    >
                      Terms of Service
                    </Button>
                    <Button
                      variant="link"
                      className="text-accent p-0 h-auto"
                      onClick={() => toast.info('Opening licenses...')}
                    >
                      Open Source Licenses
                    </Button>
                  </div>
                </section>

                {/* Acknowledgments */}
                <section className="bg-card rounded-xl p-6 border border-border/50 text-center space-y-4">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    Built with{' '}
                    <Heart className="w-4 h-4 text-[hsl(var(--tag-red))]" /> by
                    the Omnivore community
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Special thanks to all contributors
                  </p>
                  <Button
                    variant="link"
                    className="text-accent"
                    onClick={() => toast.info('Opening contributors page...')}
                  >
                    View All Contributors
                  </Button>
                </section>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Add Content Modal */}
      <AddContentModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen}>
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
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Navigation
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next item</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">J</kbd>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">↓</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Previous item</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">K</kbd>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open item</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">
                    Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Close item</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Actions
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Archive</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">E</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Delete</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">#</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Star/Unstar</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">S</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Read Later</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">L</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Add tag</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">T</kbd>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Reader
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toggle fullscreen</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next page</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">→</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Previous page</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">←</kbd>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Settings
