import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UPLOAD_URL_TTL_SECONDS = 5 * 60;

export const isExternalUrl = (key: string) => /^https?:\/\//i.test(key);

// Cloudflare R2 via its S3-compatible API.
// Files never pass through this server: clients upload straight to R2
// with a short-lived presigned URL, which keeps memory use low on the
// 256 MB container.
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly publicUrl: string | undefined;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = config.get<string>('R2_BUCKET');
    this.publicUrl = config.get<string>('R2_PUBLIC_URL')?.replace(/\/+$/, '');

    this.client =
      accountId && accessKeyId && secretAccessKey && this.bucket
        ? new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;

    if (!this.client) {
      this.logger.warn('R2 is not configured — file uploads are disabled');
    }
  }

  // ── Presigned upload ──────────────────────────────────────────────────────

  // Content type and size are part of the signature, so the client must
  // upload exactly what it declared.
  async createUploadUrl(key: string, contentType: string, size: number) {
    const client = this.requireClient();

    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );

    return {
      uploadUrl,
      key,
      url: this.getPublicUrl(key),
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    };
  }

  // ── Public URL for a stored key ───────────────────────────────────────────

  getPublicUrl(key: string): string {
    // already a full URL (e.g. seeded demo images hosted elsewhere)
    if (isExternalUrl(key)) return key;
    return this.publicUrl ? `${this.publicUrl}/${key}` : key;
  }

  // Reverse of getPublicUrl, for URLs this service produced
  keyFromPublicUrl(url: string): string | null {
    const prefix = this.publicUrl ? `${this.publicUrl}/` : '';
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  // ── Delete (best effort — a leftover file is cheaper than a failed request)

  async deleteMany(allKeys: string[]) {
    // external URLs aren't ours to delete
    const keys = allKeys.filter((key) => !isExternalUrl(key));
    if (!this.client || keys.length === 0) return;

    try {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete ${keys.length} object(s) from R2`,
        error as Error,
      );
    }
  }

  private requireClient(): S3Client {
    if (!this.client) {
      throw new ServiceUnavailableException('File uploads are not configured');
    }
    return this.client;
  }
}
