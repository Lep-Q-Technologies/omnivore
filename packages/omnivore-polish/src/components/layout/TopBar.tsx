import { Search, Plus, Bell, Settings, User, LogOut, Menu, ChevronDown, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onSettingsClick: () => void;
  onProfileClick: () => void;
  onLogoutClick: () => void;
  onMenuClick?: () => void;
  className?: string;
}

const TopBar = ({
  searchQuery,
  onSearchChange,
  onAddClick,
  onSettingsClick,
  onProfileClick,
  onLogoutClick,
  onMenuClick,
  className,
}: TopBarProps) => {
  return (
    <header className={cn("h-16 bg-card border-b border-border flex items-center px-4 gap-4", className)}>
      {/* Left: Mobile Menu + Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo - visible on mobile when sidebar is hidden */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-brand-yellow flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Center: Search - prominently centered */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 pr-4 bg-background border-border focus:border-accent focus:ring-1 focus:ring-accent h-10 rounded-full text-body"
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Add Button */}
        <Button
          onClick={onAddClick}
          size="sm"
          className="bg-brand-yellow text-primary-foreground hover:bg-brand-yellow/90 font-medium gap-1.5 h-9 rounded-full px-4"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-muted-foreground hover:text-foreground relative rounded-full"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 pl-2 pr-2 rounded-full">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">JD</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
            <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer gap-2">
              <User className="w-4 h-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={onLogoutClick}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
