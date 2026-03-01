export class UploadImagesService {
    constructor(uploadImagesRepo) {
        this.uploadImagesRepo = uploadImagesRepo;
    }
    async registerImage(imageId, userId, file, category) {
        return await this.uploadImagesRepo.createUploadImage({
            id: imageId,
            user_id: userId,
            category: category,
            original_name: file.originalname,
            mime_type: file.mimetype,
            size_bytes: file.size,
        });
    }
    async getImageById(id) {
        return await this.uploadImagesRepo.findImageById(id);
    }
    async getImagesByUserId(userId) {
        return await this.uploadImagesRepo.findImagesByUserId(userId);
    }
}
