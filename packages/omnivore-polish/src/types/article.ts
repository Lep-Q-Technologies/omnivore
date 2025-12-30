export type TagColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray';

export interface Tag {
  id: string;
  label: string;
  color: TagColor;
}

export interface Flair {
  icon: 'star' | 'mail' | 'pin' | 'rss';
  name: string;
}

export type ArticleState = 'default' | 'processing' | 'failed' | 'archived';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type ContentType = 'newsletter' | 'rss' | 'podcast' | 'youtube' | 'article' | 'pdf' | 'epub' | 'html';

export interface Highlight {
  id: string;
  text: string;
  color: HighlightColor;
  articleId: string;
  createdAt: Date;
  note?: string;
  tags?: Tag[];
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange';

export interface Article {
  id: string;
  title: string;
  description?: string;
  content?: string; // Full article content for reader
  sourceName: string;
  sourceUrl: string;
  author?: string;
  readingTime: number;
  thumbnailUrl?: string;
  faviconUrl?: string;
  progress: number;
  tags: Tag[];
  flairs: Flair[];
  state: ArticleState;
  savedAt: Date;
  isSelected?: boolean;
  aiSummary?: string; // AI-generated summary for digest
  highlights?: Highlight[];
  contentType?: ContentType; // Content source type (newsletter, rss, podcast, youtube, article)
}

export type NewsletterStatus = 'active' | 'pending' | 'unsubscribed';

export interface Subscription {
  id: string;
  name: string;
  type: 'newsletter' | 'rss' | 'podcast' | 'youtube';
  url?: string;
  email?: string;
  emailAddress?: string; // Unique email address for this newsletter
  platform?: string;
  itemCount: number;
  readCount?: number; // Number of articles read
  lastReceived?: Date;
  unsubscribedAt?: Date;
  isActive: boolean;
  status?: NewsletterStatus;
}
