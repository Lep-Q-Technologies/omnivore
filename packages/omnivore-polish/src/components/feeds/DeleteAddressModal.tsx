import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Subscription } from '@/types/article';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteAddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newsletter: Subscription | null;
  onDelete: (newsletter: Subscription) => void;
}

const DeleteAddressModal = ({ 
  open, 
  onOpenChange, 
  newsletter,
  onDelete 
}: DeleteAddressModalProps) => {
  const handleDelete = () => {
    if (!newsletter) return;
    onDelete(newsletter);
    onOpenChange(false);
  };

  if (!newsletter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-state-warning" />
            Delete Email Address?
          </DialogTitle>
          <DialogDescription>
            <span className="text-state-warning font-medium">Warning: This is permanent</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-caption text-muted-foreground space-y-2">
            <p>This will permanently delete:</p>
            <div className="font-mono text-foreground bg-background/50 rounded-lg px-3 py-2 border border-border/50 truncate">
              {newsletter.emailAddress}
            </div>
          </div>

          <div className="text-caption text-muted-foreground space-y-2">
            <p>The address will no longer accept emails.</p>
            <p>
              Your <span className="text-foreground font-medium">{newsletter.itemCount} existing articles</span> will 
              remain.
            </p>
          </div>

          <div className="text-caption text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-2">
            <p>Use this if the address was compromised or you want to start fresh.</p>
            <p>You can create a new address if you want to resubscribe later.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
          >
            Delete Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAddressModal;
