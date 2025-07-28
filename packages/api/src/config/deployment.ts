import { FeatureConfig, getFeatureConfig } from './features'

export interface ResourceConfig {
  maxWorkers: number
  memoryLimit: string
  cpuLimit: string
  maxConcurrentJobs: number
}

export interface StorageConfig {
  type: 'local' | 's3' | 'gcs'
  path?: string
  bucket?: string
  region?: string
}

export interface DeploymentConfig {
  profile: 'minimal' | 'standard' | 'enterprise'
  features: FeatureConfig
  resources: ResourceConfig
  storage: StorageConfig
}

const DEPLOYMENT_PROFILES: Record<string, Partial<DeploymentConfig>> = {
  minimal: {
    profile: 'minimal',
    features: {
      contentProcessing: true,
      emailIngestion: false,
      aiFeatures: false,
      advancedSearch: false,
      pdfProcessing: false,
      thumbnailGeneration: false,
      textToSpeech: false,
      rssHandling: true,
      integrations: false,
      exportHandling: true,
      importHandling: true,
      ruleProcessing: false,
    },
    resources: {
      maxWorkers: 2,
      memoryLimit: '512Mi',
      cpuLimit: '0.5',
      maxConcurrentJobs: 5,
    },
    storage: {
      type: 'local',
      path: '/app/data',
    },
  },
  standard: {
    profile: 'standard',
    features: {
      contentProcessing: true,
      emailIngestion: true,
      aiFeatures: false,
      advancedSearch: false,
      pdfProcessing: true,
      thumbnailGeneration: true,
      textToSpeech: false,
      rssHandling: true,
      integrations: true,
      exportHandling: true,
      importHandling: true,
      ruleProcessing: true,
    },
    resources: {
      maxWorkers: 4,
      memoryLimit: '1Gi',
      cpuLimit: '1',
      maxConcurrentJobs: 10,
    },
    storage: {
      type: 'local',
      path: '/app/data',
    },
  },
  enterprise: {
    profile: 'enterprise',
    features: {
      contentProcessing: true,
      emailIngestion: true,
      aiFeatures: true,
      advancedSearch: true,
      pdfProcessing: true,
      thumbnailGeneration: true,
      textToSpeech: true,
      rssHandling: true,
      integrations: true,
      exportHandling: true,
      importHandling: true,
      ruleProcessing: true,
    },
    resources: {
      maxWorkers: 8,
      memoryLimit: '2Gi',
      cpuLimit: '2',
      maxConcurrentJobs: 20,
    },
    storage: {
      type: 's3',
      bucket: process.env.S3_BUCKET || 'omnivore-storage',
      region: process.env.AWS_REGION || 'us-east-1',
    },
  },
}

export const getDeploymentConfig = (): DeploymentConfig => {
  const profile = process.env.DEPLOYMENT_PROFILE || 'standard'
  const baseConfig = DEPLOYMENT_PROFILES[profile] || DEPLOYMENT_PROFILES.standard
  
  // Override with environment-specific feature flags
  const envFeatures = getFeatureConfig()
  
  return {
    profile: baseConfig.profile as 'minimal' | 'standard' | 'enterprise',
    features: { ...baseConfig.features, ...envFeatures },
    resources: {
      ...baseConfig.resources!,
      maxWorkers: parseInt(process.env.MAX_WORKERS || baseConfig.resources!.maxWorkers.toString()),
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || baseConfig.resources!.maxConcurrentJobs.toString()),
    },
    storage: {
      ...baseConfig.storage!,
      type: (process.env.STORAGE_TYPE as 'local' | 's3' | 'gcs') || baseConfig.storage!.type,
      path: process.env.STORAGE_PATH || baseConfig.storage!.path,
      bucket: process.env.STORAGE_BUCKET || baseConfig.storage!.bucket,
      region: process.env.STORAGE_REGION || baseConfig.storage!.region,
    },
  }
}

export const isMinimalDeployment = (): boolean => {
  return getDeploymentConfig().profile === 'minimal'
}

export const isStandardDeployment = (): boolean => {
  return getDeploymentConfig().profile === 'standard'
}

export const isEnterpriseDeployment = (): boolean => {
  return getDeploymentConfig().profile === 'enterprise'
}