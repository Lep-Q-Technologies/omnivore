import { useEffect, useCallback } from 'react';

type KeyboardAction = 'next' | 'prev' | 'read' | 'readLater' | 'dismiss' | 'delete' | 'help';

interface UseKeyboardShortcutsOptions {
  onAction: (action: KeyboardAction) => void;
  enabled?: boolean;
}

/**
 * Custom hook for keyboard navigation in digest/triage views
 * 
 * Shortcuts:
 * - j/↓: Next item
 * - k/↑: Previous item
 * - r/Enter: Read current item
 * - l: Add to Read Later
 * - d: Dismiss current item
 * - Backspace/Delete: Delete current item
 * - ?: Show help
 */
export const useKeyboardShortcuts = ({ 
  onAction, 
  enabled = true 
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable
    ) {
      return;
    }
    
    // Ignore if modifier keys are pressed (except for ?)
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }
    
    switch (e.key.toLowerCase()) {
      case 'j':
      case 'arrowdown':
        e.preventDefault();
        onAction('next');
        break;
      case 'k':
      case 'arrowup':
        e.preventDefault();
        onAction('prev');
        break;
      case 'r':
      case 'enter':
        e.preventDefault();
        onAction('read');
        break;
      case 'l':
        e.preventDefault();
        onAction('readLater');
        break;
      case 'd':
        e.preventDefault();
        onAction('dismiss');
        break;
      case 'backspace':
      case 'delete':
        e.preventDefault();
        onAction('delete');
        break;
      case '?':
        e.preventDefault();
        onAction('help');
        break;
    }
  }, [onAction]);
  
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
};

export default useKeyboardShortcuts;
