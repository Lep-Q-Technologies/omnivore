import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainTopBarProps {
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

const MainTopBar = ({ onSettingsClick, onLogoutClick }: MainTopBarProps) => {
  return (
    <header className="h-12 bg-background border-b border-border flex items-center justify-end px-4 gap-2">
      <button
        onClick={onSettingsClick}
        className="flex items-center gap-2 px-3 py-1.5 text-caption text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="w-4 h-4" />
        Settings
      </button>
      <Button
        onClick={onLogoutClick}
        size="sm"
        className="bg-brand-yellow text-primary-foreground hover:bg-brand-yellow/90 font-medium"
      >
        Logout
      </Button>
    </header>
  );
};

export default MainTopBar;
