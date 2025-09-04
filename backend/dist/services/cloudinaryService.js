"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env['CLOUDINARY_CLOUD_NAME'] || '',
    api_key: process.env['CLOUDINARY_API_KEY'] || '',
    api_secret: process.env['CLOUDINARY_API_SECRET'] || '',
});
class CloudinaryService {
    static async uploadImage(imageBuffer, folder = 'plant-care') {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder,
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 800, crop: 'limit' },
                        { quality: 'auto:good' },
                    ],
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else if (result) {
                        resolve({
                            public_id: result.public_id,
                            secure_url: result.secure_url,
                            width: result.width,
                            height: result.height,
                            format: result.format,
                        });
                    }
                    else {
                        reject(new Error('Upload failed'));
                    }
                });
                uploadStream.end(imageBuffer);
            });
        }
        catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error('Failed to upload image to Cloudinary');
        }
    }
    static async deleteImage(publicId) {
        try {
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
        catch (error) {
            console.error('Error deleting from Cloudinary:', error);
            throw new Error('Failed to delete image from Cloudinary');
        }
    }
    static async getImageInfo(publicId) {
        try {
            const result = await cloudinary_1.v2.api.resource(publicId);
            return result;
        }
        catch (error) {
            console.error('Error getting image info from Cloudinary:', error);
            throw new Error('Failed to get image information from Cloudinary');
        }
    }
}
exports.CloudinaryService = CloudinaryService;
//# sourceMappingURL=cloudinaryService.js.map