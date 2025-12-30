import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Subscription } from '@/types/article';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UnsubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newsletter: Subscription | null;
  onUnsubscribe: (newsletter: Subscription, reason?: string) => void;
}

const unsubscribeReasons = [
  { id: 'not-interested', label: 'Not interested anymore' },
  { id: 'too-many', label: 'Too many emails' },
  { id: 'quality', label: 'Content quality declined' },
  { id: 'spam', label: 'Spam or unwanted content' },
  { id: 'other', label: 'Other' },
];

const UnsubscribeModal = ({ 
  open, 
  onOpenChange, 
  newsletter,
  onUnsubscribe 
}: UnsubscribeModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState('');

  const handleUnsubscribe = () => {
    if (!newsletter) return;
    const reason = selectedReason === 'other' ? otherReason : selectedReason;
    onUnsubscribe(newsletter, reason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason('');
    setOtherReason('');
    onOpenChange(false);
  };

  if (!newsletter) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unsubscribe from {newsletter.name}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to unsubscribe?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-caption text-muted-foreground space-y-2">
            <p>We'll stop accepting emails at:</p>
            <div className="font-mono text-foreground bg-background/50 rounded-lg px-3 py-2 border border-border/50 truncate">
              {newsletter.emailAddress}
            </div>
          </div>

          <div className="text-caption text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p>
              Your <span className="text-foreground font-medium">{newsletter.itemCount} existing articles</span> will 
              remain in your library, but you won't receive new emails.
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-caption text-foreground/80 font-medium mb-3">
              Why are you unsubscribing?
            </p>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {unsubscribeReasons.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label htmlFor={reason.id} className="text-caption text-muted-foreground cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {selectedReason === 'other' && (
              <Input
                placeholder="Please specify..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleUnsubscribe}
          >
            Unsubscribe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnsubscribeModal;
