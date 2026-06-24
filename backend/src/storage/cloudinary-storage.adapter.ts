import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import {
  AVATAR_EXTENSION_BY_MIME,
  isAllowedAvatarMimeType,
} from './avatar-upload.constants';
import {
  AvatarUploadFile,
  StoredFile,
  StorageAdapter,
} from './storage.types';

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  error?: { message?: string };
};

@Injectable()
export class CloudinaryStorageAdapter implements StorageAdapter {
  readonly provider = 'cloudinary' as const;

  constructor(private readonly config: ConfigService) {}

  async uploadAvatar(
    file: AvatarUploadFile,
    userId: string,
  ): Promise<StoredFile> {
    if (!isAllowedAvatarMimeType(file.mimetype)) {
      throw new Error('Unsupported avatar MIME type');
    }

    const credentials = this.getCredentials();
    const publicId = `${userId}-${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedParams = {
      folder: 'taskflow/avatars',
      public_id: publicId,
      timestamp,
    };
    const form = new FormData();
    const extension = AVATAR_EXTENSION_BY_MIME[file.mimetype];
    const fileBytes = new Uint8Array(file.buffer.byteLength);
    fileBytes.set(file.buffer);

    form.append(
      'file',
      new Blob([fileBytes.buffer], { type: file.mimetype }),
      `${publicId}.${extension}`,
    );
    Object.entries(signedParams).forEach(([key, value]) =>
      form.append(key, value),
    );
    form.append('api_key', credentials.apiKey);
    form.append('signature', this.sign(signedParams, credentials.apiSecret));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`,
      {
        method: 'POST',
        body: form,
      },
    );
    const result = (await response.json()) as CloudinaryUploadResponse;

    if (!response.ok || !result.public_id || !result.secure_url) {
      throw new BadGatewayException(
        result.error?.message ?? 'Cloudinary avatar upload failed',
      );
    }

    return {
      url: result.secure_url,
      key: result.public_id,
      provider: this.provider,
    };
  }

  async deleteAvatar(key: string): Promise<void> {
    const credentials = this.getCredentials();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedParams = {
      public_id: key,
      timestamp,
    };
    const form = new URLSearchParams({
      ...signedParams,
      api_key: credentials.apiKey,
      signature: this.sign(signedParams, credentials.apiSecret),
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      },
    );

    if (!response.ok) {
      throw new BadGatewayException('Cloudinary avatar deletion failed');
    }
  }

  private getCredentials() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary storage is not configured',
      );
    }

    return { cloudName, apiKey, apiSecret };
  }

  private sign(params: Record<string, string>, secret: string) {
    const value = Object.entries(params)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, paramValue]) => `${key}=${paramValue}`)
      .join('&');

    return createHash('sha1')
      .update(`${value}${secret}`)
      .digest('hex');
  }
}
