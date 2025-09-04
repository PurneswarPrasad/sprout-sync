import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'] || '',
  api_key: process.env['CLOUDINARY_API_KEY'] || '',
  api_secret: process.env['CLOUDINARY_API_SECRET'] || '',
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

export class CloudinaryService {
  /**
   * Upload an image to Cloudinary
   * @param imageBuffer - Buffer containing the image data
   * @param folder - Folder name in Cloudinary (optional)
   * @returns Promise<CloudinaryUploadResult>
   */
  static async uploadImage(
    imageBuffer: Buffer,
    folder: string = 'plant-care'
  ): Promise<CloudinaryUploadResult> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              { width: 800, height: 800, crop: 'limit' }, // Limit size
              { quality: 'auto:good' }, // Optimize quality
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({
                public_id: result.public_id!,
                secure_url: result.secure_url!,
                width: result.width!,
                height: result.height!,
                format: result.format!,
              });
            } else {
              reject(new Error('Upload failed'));
            }
          }
        );

        uploadStream.end(imageBuffer);
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Delete an image from Cloudinary
   * @param publicId - Public ID of the image to delete
   * @returns Promise<void>
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  /**
   * Get image information from Cloudinary
   * @param publicId - Public ID of the image
   * @returns Promise<any>
   */
  static async getImageInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error('Error getting image info from Cloudinary:', error);
      throw new Error('Failed to get image information from Cloudinary');
    }
  }
}
