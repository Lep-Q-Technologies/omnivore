import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { toast } from 'sonner';
import {
  User, Camera, BookOpen, Clock, Highlighter, Flame, Target, Calendar,
  Sun, Moon, Monitor, Check, Globe, Bell, CreditCard, Download, Trash2, Copy, RefreshCw
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AddContentModal from '@/components/modals/AddContentModal';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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

// Mock user data
const mockUser = {
  fullName: 'Tim Wilson',
  email: 'tim@example.com',
  username: 'timwilson',
  avatarUrl: '',
  createdAt: new Date('2024-03-15'),
};

const mockStats = {
  itemsSaved: 287,
  readingTime: 42,
  highlightsCount: 156,
  currentStreak: 12,
  completionRate: 78,
};

const Profile = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // User identity state - initialize from auth store
  const [fullName, setFullName] = useState(user?.name || mockUser.fullName);
  const [email, setEmail] = useState(user?.email || mockUser.email);

  // Generate a fun, anonymous display username (cosmetic only, not persisted)
  const generateUsername = (name?: string, email?: string): string => {
    const adjectives = [
      'cosmic', 'velvet', 'silent', 'golden', 'azure', 'crimson', 'wandering',
      'curious', 'radiant', 'mystic', 'stellar', 'lunar', 'solar', 'emerald',
      'swift', 'gentle', 'bold', 'clever', 'bright', 'quiet', 'vivid', 'serene'
    ];

    const nouns = [
      'turtle', 'phoenix', 'comet', 'narwhal', 'nebula', 'quill', 'orchid',
      'falcon', 'lotus', 'raven', 'owl', 'fox', 'wolf', 'dragon', 'eagle',
      'panther', 'lynx', 'otter', 'penguin', 'dolphin', 'coral', 'ember'
    ];

    // Create a simple hash from email or name for deterministic generation
    const seed = email || name || 'anonymous';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use hash to deterministically select words
    const adjIndex = Math.abs(hash) % adjectives.length;
    const nounIndex = Math.abs(hash >> 8) % nouns.length;
    const number = Math.abs(hash >> 16) % 1000;

    return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${number}`;
  };

  const [username, setUsername] = useState(
    generateUsername(user?.name, user?.email)
  );

  // Track username regeneration (for UI demonstration - will be backend-tracked in production)
  const [regenerateCount, setRegenerateCount] = useState(0);
  const canRegenerate = regenerateCount < 3; // Allow 3 regenerations for demo

  const handleRegenerateUsername = () => {
    if (!canRegenerate) {
      toast.error('Username regeneration limit reached');
      return;
    }

    // Generate a new random username by adding a timestamp to force different hash
    const newUsername = generateUsername(
      user?.name,
      `${user?.email}_${Date.now()}`
    );
    setUsername(newUsername);
    setRegenerateCount(prev => prev + 1);
    toast.success('Username regenerated!', {
      description: `${3 - regenerateCount - 1} regenerations remaining`,
    });
  };

  // Appearance state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [fontSize, setFontSize] = useState([50]); // 0-100 maps to XS-XL
  const [libraryDensity, setLibraryDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  
  // Localization state
  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('America/New_York');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>('12');
  
  // Notifications state
  const [emailDigest, setEmailDigest] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [newsletterRecs, setNewsletterRecs] = useState(false);
  const [digestTime, setDigestTime] = useState('09:00');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietFrom, setQuietFrom] = useState('22:00');
  const [quietTo, setQuietTo] = useState('07:00');
  
  // Modal states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const getFontSizeLabel = (value: number) => {
    if (value < 20) return 'XS';
    if (value < 40) return 'S';
    if (value < 60) return 'M';
    if (value < 80) return 'L';
    return 'XL';
  };
  
  const handleSave = () => {
    toast.success('Profile saved successfully');
  };
  
  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password updated successfully');
    setIsChangePasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  const handleExportData = () => {
    toast.success('Export started. You will receive an email when ready.');
    setIsExportOpen(false);
  };
  
  const handleDeleteAccount = () => {
    if (deleteConfirmEmail !== email) {
      toast.error('Email does not match');
      return;
    }
    toast.success('Account deletion scheduled. You have 30 days to cancel.');
    setIsDeleteOpen(false);
    setDeleteConfirmEmail('');
  };
  
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  const memberSince = mockUser.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
          onProfileClick={() => {}}
          onLogoutClick={() => {
            logout();
            navigate('/login');
          }}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Profile</h1>
              <Button onClick={handleSave} className="bg-accent hover:bg-accent/90">
                Save Changes
              </Button>
            </div>
            
            {/* User Identity Section */}
            <section className="bg-card rounded-xl p-6 border border-border/50 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-accent" />
                User Identity
              </h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {initials}
                  </div>
                  <button 
                    className="absolute bottom-0 right-0 p-1.5 bg-elevated rounded-full border border-border hover:bg-muted transition-colors"
                    onClick={() => toast.info('Photo upload coming soon!')}
                  >
                    <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{fullName}</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <p className="text-xs text-muted-foreground">Member since {memberSince}</p>
                </div>
              </div>
              
              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-elevated border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-elevated border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username">Username</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerateUsername}
                      disabled={!canRegenerate}
                      className="h-auto py-1 px-2 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerate ({3 - regenerateCount} left)
                    </Button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="username"
                      value={username}
                      readOnly
                      className="pl-7 bg-elevated border-border cursor-default"
                      title="Username is auto-generated. Click 'Regenerate' to get a new one."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your username is auto-generated for privacy. You can regenerate it up to 3 times.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="password" 
                      value="••••••••••" 
                      disabled 
                      className="bg-elevated border-border flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsChangePasswordOpen(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Account Statistics Section */}
            <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Account Statistics</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                  <BookOpen className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xl font-bold text-foreground">{mockStats.itemsSaved}</p>
                    <p className="text-xs text-muted-foreground">Items Saved</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xl font-bold text-foreground">{mockStats.readingTime}h</p>
                    <p className="text-xs text-muted-foreground">Reading Time</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                  <Highlighter className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xl font-bold text-foreground">{mockStats.highlightsCount}</p>
                    <p className="text-xs text-muted-foreground">Highlights</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                  <Flame className="w-5 h-5 text-[hsl(var(--state-warning))]" />
                  <div>
                    <p className="text-xl font-bold text-[hsl(var(--state-warning))]">{mockStats.currentStreak} days</p>
                    <p className="text-xs text-muted-foreground">Current Streak</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                  <Target className="w-5 h-5 text-[hsl(var(--state-success))]" />
                  <div>
                    <p className="text-xl font-bold text-[hsl(var(--state-success))]">{mockStats.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Mar 2024</p>
                    <p className="text-xs text-muted-foreground">Reading Since</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Appearance Section */}
            <section className="bg-card rounded-xl p-6 border border-border/50 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sun className="w-5 h-5 text-accent" />
                Appearance
              </h2>
              
              {/* Theme */}
              <div className="space-y-3">
                <Label>Theme</Label>
                <RadioGroup 
                  value={theme} 
                  onValueChange={(v) => setTheme(v as typeof theme)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-1 cursor-pointer">
                      <Sun className="w-4 h-4" /> Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-1 cursor-pointer">
                      <Moon className="w-4 h-4" /> Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="flex items-center gap-1 cursor-pointer">
                      <Monitor className="w-4 h-4" /> System
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Reader Font Size</Label>
                  <span className="text-sm text-muted-foreground">{getFontSizeLabel(fontSize[0])}</span>
                </div>
                <div className="space-y-2">
                  <Slider 
                    value={fontSize} 
                    onValueChange={setFontSize}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>XS</span>
                    <span>S</span>
                    <span>M</span>
                    <span>L</span>
                    <span>XL</span>
                  </div>
                </div>
              </div>
              
              {/* Library Density */}
              <div className="space-y-3">
                <Label>Library Density</Label>
                <RadioGroup 
                  value={libraryDensity} 
                  onValueChange={(v) => setLibraryDensity(v as typeof libraryDensity)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="compact" />
                    <Label htmlFor="compact" className="cursor-pointer">Compact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comfortable" id="comfortable" />
                    <Label htmlFor="comfortable" className="cursor-pointer">Comfortable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="spacious" id="spacious" />
                    <Label htmlFor="spacious" className="cursor-pointer">Spacious</Label>
                  </div>
                </RadioGroup>
              </div>
            </section>
            
            {/* Localization Section */}
            <section className="bg-card rounded-xl p-6 border border-border/50 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                Localization
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-elevated border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                      <SelectItem value="en-GB">🇬🇧 English (UK)</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                      <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="bg-elevated border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago (CST)</SelectItem>
                      <SelectItem value="America/Denver">America/Denver (MST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="bg-elevated border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <RadioGroup 
                    value={timeFormat} 
                    onValueChange={(v) => setTimeFormat(v as typeof timeFormat)}
                    className="flex gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="12" id="12h" />
                      <Label htmlFor="12h" className="cursor-pointer">12-hour</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="24" id="24h" />
                      <Label htmlFor="24h" className="cursor-pointer">24-hour</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </section>
            
            {/* Notifications Section */}
            <section className="bg-card rounded-xl p-6 border border-border/50 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                Notifications
              </h2>
              
              {/* Email Notifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Email Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Daily digest</p>
                    <p className="text-xs text-muted-foreground">New items, highlights, and activity</p>
                  </div>
                  <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Weekly summary</p>
                    <p className="text-xs text-muted-foreground">Reading stats and insights</p>
                  </div>
                  <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Newsletter recommendations</p>
                    <p className="text-xs text-muted-foreground">AI-suggested newsletters based on reading</p>
                  </div>
                  <Switch checked={newsletterRecs} onCheckedChange={setNewsletterRecs} />
                </div>
                
                {emailDigest && (
                  <div className="space-y-2 pl-4 border-l-2 border-border">
                    <Label>Digest Schedule</Label>
                    <Select value={digestTime} onValueChange={setDigestTime}>
                      <SelectTrigger className="w-40 bg-elevated border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="06:00">6:00 AM</SelectItem>
                        <SelectItem value="07:00">7:00 AM</SelectItem>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Separator className="bg-border" />
              
              {/* Quiet Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Quiet Hours</p>
                    <p className="text-xs text-muted-foreground">No notifications during this time</p>
                  </div>
                  <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
                </div>
                
                {quietHoursEnabled && (
                  <div className="flex items-center gap-4 pl-4 border-l-2 border-border">
                    <div className="space-y-1">
                      <Label className="text-xs">From</Label>
                      <Select value={quietFrom} onValueChange={setQuietFrom}>
                        <SelectTrigger className="w-28 bg-elevated border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="21:00">9:00 PM</SelectItem>
                          <SelectItem value="22:00">10:00 PM</SelectItem>
                          <SelectItem value="23:00">11:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To</Label>
                      <Select value={quietTo} onValueChange={setQuietTo}>
                        <SelectTrigger className="w-28 bg-elevated border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="06:00">6:00 AM</SelectItem>
                          <SelectItem value="07:00">7:00 AM</SelectItem>
                          <SelectItem value="08:00">8:00 AM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </section>
            
            {/* Subscription Section */}
            <section className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent" />
                Subscription
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <span className="text-sm font-semibold text-primary">Pro Plan ($7/month)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Billing</span>
                  <span className="text-sm text-foreground">January 15, 2025</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="text-sm text-foreground">1.2 GB / 10 GB</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => toast.info('Opening billing portal...')}>
                  Manage Subscription
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.info('Viewing invoices...')}>
                  View Invoices
                </Button>
              </div>
            </section>
            
            {/* Danger Zone */}
            <section className="bg-card rounded-xl p-6 border border-destructive/30 space-y-4">
              <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
              
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Download className="w-4 h-4" /> Export All Data
                    </p>
                    <p className="text-xs text-muted-foreground">Download your library, highlights, and settings</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)}>
                    Export Data
                  </Button>
                </div>
                
                <Separator className="bg-border" />
                
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </p>
                    <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      
      {/* Add Content Modal */}
      <AddContentModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />
      
      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-elevated border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-elevated border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-elevated border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} className="bg-accent hover:bg-accent/90">
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Data Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Export Your Data</DialogTitle>
            <DialogDescription>
              We'll create a ZIP file containing all your data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-[hsl(var(--state-success))]" />
              Library items ({mockStats.itemsSaved})
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-[hsl(var(--state-success))]" />
              Highlights and notes ({mockStats.highlightsCount})
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-[hsl(var(--state-success))]" />
              Reading statistics
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-[hsl(var(--state-success))]" />
              User settings
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              This may take a few minutes. You'll receive an email when your export is ready.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
            <Button onClick={handleExportData} className="bg-accent hover:bg-accent/90">
              Start Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              ⚠️ Delete Your Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>Your library ({mockStats.itemsSaved} items)</li>
                <li>Your highlights ({mockStats.highlightsCount})</li>
                <li>Your reading history</li>
                <li>Your account settings</li>
              </ul>
              <p className="font-semibold text-destructive">This action CANNOT be undone.</p>
              <div className="space-y-2 pt-2">
                <Label>Type your email to confirm:</Label>
                <Input 
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder={email}
                  className="bg-elevated border-border"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteConfirmEmail !== email}
            >
              Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
