import { S3StorageClient, GcsStorageClient } from '@omnivore/utils/storage'
import { RedisDataSource } from '@omnivore/utils'
import { v4 as uuid } from 'uuid'
import { EmailJobType, queueEmailJob } from './job'

const storage =
  process.env.GCS_USE_LOCAL_HOST === 'true'
    ? new S3StorageClient(
        process.env.LOCAL_MINIO_URL,
        process.env.AWS_S3_ENDPOINT_URL
      )
    : new GcsStorageClient(process.env.GCS_UPLOAD_SA_KEY_FILE_PATH)
const bucketName = process.env.GCS_UPLOAD_BUCKET || 'omnivore-files'

export interface Attachment {
  contentType: string
  data: Buffer
  filename: string | undefined
}

export const isAttachment = (contentType: string, data: Buffer): boolean => {
  return (
    (contentType === 'application/pdf' ||
      contentType === 'application/epub+zip') &&
    data.length > 0
  )
}

export const uploadToBucket = async (
  fileName: string,
  data: Buffer,
  options?: { contentType?: string; public?: boolean }
) => {
  const uploadFileId = uuid()

  await storage.upload(
    bucketName,
    `u/${uploadFileId}/${fileName}`,
    data,
    { ...options, timeout: 30000 }
  )

  return uploadFileId
}

export const handleAttachments = async (
  redisDataSource: RedisDataSource,
  from: string,
  to: string,
  subject: string,
  attachments: Attachment[]
): Promise<void> => {
  for await (const attachment of attachments) {
    const { contentType, data } = attachment
    const filename =
      attachment.filename || contentType === 'application/pdf'
        ? 'attachment.pdf'
        : 'attachment.epub'

    const uploadFileId = await uploadToBucket(filename, data, {
      contentType,
      public: false,
    })

    await queueEmailJob(redisDataSource, EmailJobType.SaveAttachment, {
      from,
      to,
      uploadFile: {
        fileName: filename,
        contentType,
        id: uploadFileId,
      },
      subject,
    })
  }
}
