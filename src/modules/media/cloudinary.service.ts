import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  constructor(private readonly config: ConfigService) {}

  private options() {
    const cloud_name = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const api_key = this.config.get<string>('CLOUDINARY_API_KEY');
    const api_secret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloud_name || !api_key || !api_secret) throw new ServiceUnavailableException();
    return { cloud_name, api_key, api_secret, secure: true };
  }

  async uploadImage(dataUrl: string, publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.upload(dataUrl, {
        ...this.options(),
        public_id: publicId,
        resource_type: 'image',
        type: 'authenticated',
        overwrite: false,
        allowed_formats: ['jpg'],
        timeout: 30000,
      });
      if (result.public_id !== publicId || result.type !== 'authenticated') throw new Error();
    } catch {
      this.logger.warn('Photo upload failed.');
      throw new ServiceUnavailableException();
    }
  }

  imageUrl(publicId: string): { url: string; expiresAt: string } {
    const expires = Math.floor(Date.now() / 1000) + 300;
    return {
      url: cloudinary.utils.private_download_url(publicId, 'jpg', {
        ...this.options(),
        resource_type: 'image',
        type: 'authenticated',
        expires_at: expires,
        attachment: false,
      }),
      expiresAt: new Date(expires * 1000).toISOString(),
    };
  }

  async deleteImage(publicId: string): Promise<void> {
    const options = {
      ...this.options(),
      resource_type: 'image',
      type: 'authenticated',
      invalidate: true,
      timeout: 30000,
    } as const;
    const result = await cloudinary.uploader.destroy(publicId, options);
    if (!['ok', 'not found'].includes(result.result)) throw new Error('Photo cleanup failed.');
  }
}
