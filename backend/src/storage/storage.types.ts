export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

export type StorageProvider = 'local' | 'cloudinary' | 'imagekit';

export interface AvatarUploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface StoredFile {
  url: string;
  key: string;
  provider: StorageProvider;
}

export interface StorageAdapter {
  readonly provider: StorageProvider;
  uploadAvatar(file: AvatarUploadFile, userId: string): Promise<StoredFile>;
  deleteAvatar(key: string): Promise<void>;
}
