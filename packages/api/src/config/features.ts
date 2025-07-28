export interface FeatureConfig {
  contentProcessing: boolean
  emailIngestion: boolean
  aiFeatures: boolean
  advancedSearch: boolean
  pdfProcessing: boolean
  thumbnailGeneration: boolean
  textToSpeech: boolean
  rssHandling: boolean
  integrations: boolean
  exportHandling: boolean
  importHandling: boolean
  ruleProcessing: boolean
}

export const getFeatureConfig = (): FeatureConfig => ({
  contentProcessing: process.env.ENABLE_CONTENT_PROCESSING !== 'false',
  emailIngestion: process.env.ENABLE_EMAIL_INGESTION === 'true',
  aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
  advancedSearch: process.env.ENABLE_ELASTICSEARCH === 'true',
  pdfProcessing: process.env.ENABLE_PDF_PROCESSING !== 'false',
  thumbnailGeneration: process.env.ENABLE_THUMBNAIL_GENERATION !== 'false',
  textToSpeech: process.env.ENABLE_TEXT_TO_SPEECH === 'true',
  rssHandling: process.env.ENABLE_RSS_HANDLING !== 'false',
  integrations: process.env.ENABLE_INTEGRATIONS === 'true',
  exportHandling: process.env.ENABLE_EXPORT_HANDLING !== 'false',
  importHandling: process.env.ENABLE_IMPORT_HANDLING !== 'false',
  ruleProcessing: process.env.ENABLE_RULE_PROCESSING !== 'false',
})

export const isFeatureEnabled = (feature: keyof FeatureConfig): boolean => {
  return getFeatureConfig()[feature]
}

// Helper function to check multiple features
export const areAllFeaturesEnabled = (...features: (keyof FeatureConfig)[]): boolean => {
  const config = getFeatureConfig()
  return features.every(feature => config[feature])
}

// Helper function to check if any feature is enabled
export const isAnyFeatureEnabled = (...features: (keyof FeatureConfig)[]): boolean => {
  const config = getFeatureConfig()
  return features.some(feature => config[feature])
}