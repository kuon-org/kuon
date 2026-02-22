import { UploadImagesRepository } from "../repositories/uploadImagesRepository.js";

export class UploadImagesService {
  constructor(private uploadImagesRepo: UploadImagesRepository) {}

  async registerImage(imageId: string, userId: string, file: any, category: string) {
    return await this.uploadImagesRepo.createUploadImage({
      id: imageId,
      user_id: userId,
      category: category,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
    });
  }

  async getImageById(id: string) {
    return await this.uploadImagesRepo.findImageById(id);
  }

  async getImagesByUserId(userId: string) {
    return await this.uploadImagesRepo.findImagesByUserId(userId);
  }
}