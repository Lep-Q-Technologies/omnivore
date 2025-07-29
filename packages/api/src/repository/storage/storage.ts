import { env } from '../../env'
import { S3StorageClient, GcsStorageClient } from '@omnivore/utils/storage'

export const storage = env.fileUpload.useLocalStorage
  ? new S3StorageClient(
      env.fileUpload.localMinioUrl,
      env.fileUpload.internalMinioUrl
    )
  : new GcsStorageClient(env.fileUpload?.gcsUploadSAKeyFilePath ?? undefined)
