// Frontend Cloudinary service for image uploads
// Uploads to backend, which then uploads to Cloudinary
import { api } from './api';

export interface CloudinaryUploadResult {
  public_id: string;
  original_url: string;
  optimized_url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export class CloudinaryService {
  /**
   * Upload an image via backend to Cloudinary
   * @param file - File to upload
   * @returns Promise<CloudinaryUploadResult>
   */
  static async uploadImage(file: File): Promise<CloudinaryUploadResult> {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, WebP, HEIC, and HEIF are allowed.');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Get a preview URL for a file (for immediate preview before upload)
   */
  static getPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Clean up preview URLs to prevent memory leaks
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

