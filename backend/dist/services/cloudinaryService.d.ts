export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
}
export declare class CloudinaryService {
    static uploadImage(imageBuffer: Buffer, folder?: string): Promise<CloudinaryUploadResult>;
    static deleteImage(publicId: string): Promise<void>;
    static getImageInfo(publicId: string): Promise<any>;
}
//# sourceMappingURL=cloudinaryService.d.ts.map