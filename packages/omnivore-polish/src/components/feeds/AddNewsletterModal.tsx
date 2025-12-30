import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateNewsletterSubscription } from '@/lib/graphql-client';

interface AddNewsletterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void; // No params needed - subscription is created in backend
}

const AddNewsletterModal = ({
  open,
  onOpenChange,
  onAdd,
}: AddNewsletterModalProps) => {
  const [newsletterName, setNewsletterName] = useState('');
  const [step, setStep] = useState<'create' | 'success'>('create');
  const [emailCopied, setEmailCopied] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');

  const { createSubscription, loading } = useCreateNewsletterSubscription();

  const handleCopyEmail = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(generatedEmail);
      setEmailCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setEmailCopied(false), 2000);
    }
  };

  const handleCreate = async () => {
    if (!newsletterName.trim()) {
      toast.error('Please enter a newsletter name');
      return;
    }

    try {
      const result = await createSubscription(newsletterName.trim());

      if (result.success && result.subscription?.newsletterEmail) {
        const email = result.subscription.newsletterEmail;

        // Set generated email for display in success screen
        setGeneratedEmail(email);

        // Copy to clipboard immediately
        try {
          await navigator.clipboard.writeText(email);
          setEmailCopied(true);

          // Show success toast with the copied email
          toast.success(`Newsletter created! Email copied to clipboard`, {
            description: email,
            duration: 5000,
          });
        } catch (clipboardError) {
          // Fallback if clipboard fails
          console.error('Clipboard copy failed:', clipboardError);
          toast.success(`Newsletter created!`, {
            description: `Email: ${email}`,
            duration: 5000,
          });
        }

        // Show success screen (stay open until user clicks Done)
        setStep('success');

        // Notify parent to refresh the list
        onAdd();
      } else {
        toast.error(result.message || 'Failed to create subscription');
        if (result.errors && result.errors.length > 0) {
          console.error('Subscription errors:', result.errors);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create subscription');
      console.error('Create subscription error:', error);
    }
  };

  const handleDone = () => {
    handleClose();
  };

  const handleClose = () => {
    setNewsletterName('');
    setGeneratedEmail('');
    setStep('create');
    setEmailCopied(false);
    onOpenChange(false);
  };

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('create');
      setNewsletterName('');
      setGeneratedEmail('');
      setEmailCopied(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'create' ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Newsletter</DialogTitle>
              <DialogDescription>
                We'll generate a secure, unique email address for this newsletter.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-caption text-muted-foreground mb-2 block">
                  Newsletter Name
                </label>
                <Input
                  placeholder="e.g. Dense Discovery"
                  value={newsletterName}
                  onChange={(e) => setNewsletterName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleCreate()}
                  className="font-medium"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-caption text-foreground/80 font-medium mb-2">How it works:</p>
                <ol className="list-decimal list-inside text-caption text-muted-foreground space-y-1">
                  <li>Enter the newsletter name above</li>
                  <li>We'll generate a secure email address</li>
                  <li>Use that email to subscribe on the newsletter website</li>
                  <li>Emails will appear in your library automatically</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newsletterName.trim() || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create & Copy'
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-state-success" />
                Newsletter Created!
              </DialogTitle>
              <DialogDescription>
                Email address created for {newsletterName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-caption text-muted-foreground mb-2 block">
                  Your Email Address
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background rounded-lg px-4 py-3 text-foreground font-mono text-sm border border-border truncate">
                    {generatedEmail}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyEmail}
                    className={cn(
                      "shrink-0",
                      emailCopied && "bg-state-success/20 border-state-success/50 text-state-success"
                    )}
                  >
                    {emailCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {emailCopied && (
                  <p className="text-caption text-state-success mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Copied to clipboard!
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-caption text-foreground/80 font-medium mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside text-caption text-muted-foreground space-y-1">
                  <li>Go to {newsletterName} website</li>
                  <li>Paste this email address when subscribing</li>
                  <li>Confirm your subscription (if required)</li>
                  <li>Emails will start appearing in your library</li>
                </ol>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-caption text-muted-foreground mb-2">Common Newsletter Sites:</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-caption" asChild>
                    <a href="https://substack.com" target="_blank" rel="noopener noreferrer">
                      Substack
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-caption" asChild>
                    <a href="https://beehiiv.com" target="_blank" rel="noopener noreferrer">
                      Beehiiv
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-caption" asChild>
                    <a href="https://convertkit.com" target="_blank" rel="noopener noreferrer">
                      ConvertKit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleDone}>
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddNewsletterModal;
