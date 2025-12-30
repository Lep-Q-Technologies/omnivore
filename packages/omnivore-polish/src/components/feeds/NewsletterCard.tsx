import { useState } from 'react';
import { Mail, Copy, Check, MoreHorizontal, Clock, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Subscription } from '@/types/article';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NewsletterCardProps {
  newsletter: Subscription;
  onUnsubscribe: (newsletter: Subscription) => void;
  onDelete?: (newsletter: Subscription) => void;
  onResubscribe?: (newsletter: Subscription) => void;
  index?: number;
}

const NewsletterCard = ({ newsletter, onUnsubscribe, onDelete, onResubscribe, index = 0 }: NewsletterCardProps) => {
  const [emailCopied, setEmailCopied] = useState(false);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const handleCopyEmail = () => {
    if (newsletter.emailAddress) {
      navigator.clipboard.writeText(newsletter.emailAddress);
      setEmailCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setEmailCopied(false), 2000);
    }
  };

  const readRate = newsletter.readCount !== undefined && newsletter.itemCount > 0
    ? Math.round((newsletter.readCount / newsletter.itemCount) * 100)
    : null;

  const getReadRateColor = (rate: number) => {
    if (rate >= 80) return 'text-[hsl(var(--read-rate-excellent))]';
    if (rate >= 50) return 'text-[hsl(var(--read-rate-good))]';
    if (rate >= 20) return 'text-[hsl(var(--read-rate-low))]';
    return 'text-[hsl(var(--read-rate-poor))]';
  };

  const getReadRateBg = (rate: number) => {
    if (rate >= 80) return 'bg-[hsl(var(--read-rate-excellent)/0.1)]';
    if (rate >= 50) return 'bg-[hsl(var(--read-rate-good)/0.1)]';
    if (rate >= 20) return 'bg-[hsl(var(--read-rate-low)/0.1)]';
    return 'bg-[hsl(var(--read-rate-poor)/0.1)]';
  };

  const isPending = newsletter.status === 'pending';
  const isUnsubscribed = newsletter.status === 'unsubscribed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group bg-card rounded-xl p-4 border border-border/50 hover:border-border transition-all",
        isPending && "opacity-70",
        isUnsubscribed && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isPending ? "bg-muted" : "bg-accent/20"
          )}>
            <Mail className={cn(
              "w-5 h-5",
              isPending ? "text-muted-foreground" : "text-accent"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-foreground font-semibold flex items-center gap-2",
              isUnsubscribed && "line-through opacity-70"
            )}>
              {newsletter.name}
              {isPending && (
                <span className="text-micro bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              )}
              {isUnsubscribed && (
                <span className="text-micro bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                  Unsubscribed
                </span>
              )}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            {!isUnsubscribed && (
              <DropdownMenuItem onClick={() => onUnsubscribe(newsletter)}>
                Unsubscribe
              </DropdownMenuItem>
            )}
            {isUnsubscribed && onResubscribe && (
              <DropdownMenuItem onClick={() => onResubscribe(newsletter)}>
                Resubscribe
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(newsletter)}
                className="text-destructive focus:text-destructive"
              >
                Delete Address
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Row */}
      <div className="text-caption text-muted-foreground mb-2">
        {isPending ? (
          <span>0 articles · Waiting for first email...</span>
        ) : isUnsubscribed ? (
          <span>
            {newsletter.itemCount} articles · Unsubscribed {newsletter.unsubscribedAt ? getTimeAgo(newsletter.unsubscribedAt) : ''}
          </span>
        ) : (
          <>
            <span>{newsletter.itemCount} articles</span>
            {newsletter.lastReceived && (
              <span> · Last received: {getTimeAgo(newsletter.lastReceived)}</span>
            )}
          </>
        )}
      </div>

      {/* Read Rate */}
      {readRate !== null && !isPending && !isUnsubscribed && (
        <div className={cn(
          "text-caption mb-2 flex items-center gap-1.5",
          getReadRateColor(readRate)
        )}>
          Read rate: {readRate}% ({newsletter.readCount}/{newsletter.itemCount} read)
          {readRate >= 80 && <Sparkles className="w-3.5 h-3.5" />}
          {readRate < 20 && <AlertTriangle className="w-3.5 h-3.5" />}
        </div>
      )}

      {/* Low Read Rate Suggestion */}
      {readRate !== null && readRate < 20 && !isPending && !isUnsubscribed && (
        <div className={cn(
          "text-caption px-3 py-2 rounded-lg mb-3 flex items-center gap-2",
          getReadRateBg(readRate)
        )}>
          <span className="text-lg">💡</span>
          <span className="text-muted-foreground">Low read rate. Consider unsubscribing?</span>
        </div>
      )}

      {/* Email Address */}
      {newsletter.emailAddress && (
        <div className="font-mono text-caption text-muted-foreground bg-background/50 rounded-lg px-3 py-2 mb-3 truncate border border-border/50">
          {newsletter.emailAddress}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {newsletter.emailAddress && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyEmail}
            className={cn(
              "gap-1.5 text-caption",
              emailCopied && "bg-state-success/20 border-state-success/50 text-state-success"
            )}
          >
            {emailCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Email
              </>
            )}
          </Button>
        )}
        
        {!isUnsubscribed && !isPending && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnsubscribe(newsletter)}
            className="text-caption text-muted-foreground hover:text-destructive"
          >
            Unsubscribe
          </Button>
        )}
        
        {isUnsubscribed && onResubscribe && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResubscribe(newsletter)}
            className="text-caption"
          >
            Resubscribe
          </Button>
        )}
        
        {isPending && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(newsletter)}
            className="text-caption text-muted-foreground hover:text-destructive"
          >
            Delete Address
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default NewsletterCard;
