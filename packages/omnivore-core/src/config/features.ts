/**
 * Feature flags configuration for Omnivore
 * Allows enabling/disabling features based on deployment profile
 */

export interface IntegrationConfig {
  pocket: boolean;
  instapaper: boolean;
  readwise: boolean;
  logseq: boolean;
  obsidian: boolean;
  notion: boolean;
}

export interface FeatureFlags {
  // Core features (always enabled)
  basicReading: true;
  highlighting: true;
  folders: true;
  labels: true;
  
  // Optional features
  aiSummaries: boolean;
  emailIngestion: boolean;
  advancedSearch: boolean;
  pdfProcessing: boolean;
  rssFeeds: boolean;
  textToSpeech: boolean;
  newsletters: boolean;
  webhooks: boolean;
  apiAccess: boolean;
  
  // Integrations
  integrations: IntegrationConfig;
  
  // Processing features
  contentFetch: {
    puppeteer: boolean;
    readability: boolean;
    thumbnails: boolean;
  };
  
  // Storage options
  storage: {
    useS3: boolean;
    useLocalStorage: boolean;
  };
  
  // Database options
  database: {
    usePostgres: boolean;
    useSqlite: boolean;
    useElasticsearch: boolean;
  };
}

export type DeploymentProfile = 'minimal' | 'standard' | 'enterprise' | 'custom';

const PROFILE_CONFIGS: Record<DeploymentProfile, Partial<FeatureFlags>> = {
  minimal: {
    aiSummaries: false,
    emailIngestion: false,
    advancedSearch: false,
    pdfProcessing: false,
    rssFeeds: false,
    textToSpeech: false,
    newsletters: false,
    webhooks: false,
    apiAccess: false,
    integrations: {
      pocket: false,
      instapaper: false,
      readwise: false,
      logseq: false,
      obsidian: false,
      notion: false,
    },
    contentFetch: {
      puppeteer: false,
      readability: true,
      thumbnails: false,
    },
    storage: {
      useS3: false,
      useLocalStorage: true,
    },
    database: {
      usePostgres: false,
      useSqlite: true,
      useElasticsearch: false,
    },
  },
  standard: {
    aiSummaries: false,
    emailIngestion: true,
    advancedSearch: false,
    pdfProcessing: true,
    rssFeeds: true,
    textToSpeech: false,
    newsletters: true,
    webhooks: true,
    apiAccess: true,
    integrations: {
      pocket: true,
      instapaper: true,
      readwise: true,
      logseq: true,
      obsidian: true,
      notion: false,
    },
    contentFetch: {
      puppeteer: true,
      readability: true,
      thumbnails: true,
    },
    storage: {
      useS3: true,
      useLocalStorage: false,
    },
    database: {
      usePostgres: true,
      useSqlite: false,
      useElasticsearch: false,
    },
  },
  enterprise: {
    aiSummaries: true,
    emailIngestion: true,
    advancedSearch: true,
    pdfProcessing: true,
    rssFeeds: true,
    textToSpeech: true,
    newsletters: true,
    webhooks: true,
    apiAccess: true,
    integrations: {
      pocket: true,
      instapaper: true,
      readwise: true,
      logseq: true,
      obsidian: true,
      notion: true,
    },
    contentFetch: {
      puppeteer: true,
      readability: true,
      thumbnails: true,
    },
    storage: {
      useS3: true,
      useLocalStorage: false,
    },
    database: {
      usePostgres: true,
      useSqlite: false,
      useElasticsearch: true,
    },
  },
  custom: {}, // Will use environment variables
};

export const loadFeatures = (profile?: DeploymentProfile): FeatureFlags => {
  const selectedProfile = profile || (process.env.DEPLOYMENT_PROFILE as DeploymentProfile) || 'standard';
  const profileConfig = PROFILE_CONFIGS[selectedProfile];
  
  // Start with core features that are always enabled
  const features: FeatureFlags = {
    basicReading: true,
    highlighting: true,
    folders: true,
    labels: true,
    
    // Apply profile defaults or use environment variables
    aiSummaries: process.env.ENABLE_AI_FEATURES === 'true' || profileConfig.aiSummaries || false,
    emailIngestion: process.env.ENABLE_EMAIL === 'true' || profileConfig.emailIngestion || false,
    advancedSearch: process.env.ENABLE_ELASTICSEARCH === 'true' || profileConfig.advancedSearch || false,
    pdfProcessing: process.env.ENABLE_PDF !== 'false' && (profileConfig.pdfProcessing !== false),
    rssFeeds: process.env.ENABLE_RSS === 'true' || profileConfig.rssFeeds || false,
    textToSpeech: process.env.ENABLE_TTS === 'true' || profileConfig.textToSpeech || false,
    newsletters: process.env.ENABLE_NEWSLETTERS === 'true' || profileConfig.newsletters || false,
    webhooks: process.env.ENABLE_WEBHOOKS === 'true' || profileConfig.webhooks || false,
    apiAccess: process.env.ENABLE_API === 'true' || profileConfig.apiAccess || false,
    
    integrations: {
      pocket: process.env.ENABLE_POCKET === 'true' || profileConfig.integrations?.pocket || false,
      instapaper: process.env.ENABLE_INSTAPAPER === 'true' || profileConfig.integrations?.instapaper || false,
      readwise: process.env.ENABLE_READWISE === 'true' || profileConfig.integrations?.readwise || false,
      logseq: process.env.ENABLE_LOGSEQ === 'true' || profileConfig.integrations?.logseq || false,
      obsidian: process.env.ENABLE_OBSIDIAN === 'true' || profileConfig.integrations?.obsidian || false,
      notion: process.env.ENABLE_NOTION === 'true' || profileConfig.integrations?.notion || false,
    },
    
    contentFetch: {
      puppeteer: process.env.ENABLE_PUPPETEER === 'true' || profileConfig.contentFetch?.puppeteer || false,
      readability: process.env.ENABLE_READABILITY !== 'false' && (profileConfig.contentFetch?.readability !== false),
      thumbnails: process.env.ENABLE_THUMBNAILS === 'true' || profileConfig.contentFetch?.thumbnails || false,
    },
    
    storage: {
      useS3: process.env.USE_S3 === 'true' || profileConfig.storage?.useS3 || false,
      useLocalStorage: process.env.USE_LOCAL_STORAGE === 'true' || profileConfig.storage?.useLocalStorage || true,
    },
    
    database: {
      usePostgres: process.env.DATABASE_TYPE === 'postgres' || profileConfig.database?.usePostgres || true,
      useSqlite: process.env.DATABASE_TYPE === 'sqlite' || profileConfig.database?.useSqlite || false,
      useElasticsearch: process.env.USE_ELASTICSEARCH === 'true' || profileConfig.database?.useElasticsearch || false,
    },
  };
  
  return features;
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof FeatureFlags | string): boolean => {
  const features = loadFeatures();
  
  if (feature.includes('.')) {
    // Handle nested features like 'integrations.pocket'
    const [parent, child] = feature.split('.');
    return (features as any)[parent]?.[child] || false;
  }
  
  return (features as any)[feature] || false;
};

// Export current features for use throughout the application
export const currentFeatures = loadFeatures();