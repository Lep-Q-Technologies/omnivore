import { X, Archive, Tag, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MultiSelectBarProps {
  selectedCount: number;
  onArchive?: () => void;
  onTag?: () => void;
  onDelete?: () => void;
  onClear?: () => void;
}

const MultiSelectBar = ({
  selectedCount,
  onArchive,
  onTag,
  onDelete,
  onClear,
}: MultiSelectBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-elevated/95 backdrop-blur-md border-t border-border',
            'safe-area-bottom'
          )}
        >
          <div className="container max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Selection info */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onClear}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                <span className="text-body font-medium text-foreground">
                  {selectedCount} selected
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onArchive}
                  className="text-secondary-foreground hover:text-foreground"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onTag}
                  className="text-secondary-foreground hover:text-foreground"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Tag
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-secondary-foreground hover:text-state-danger"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MultiSelectBar;
