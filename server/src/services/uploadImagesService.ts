import * as uploadImagesRepo from '../repositories/uploadImagesRepository.js';

/**
 * 画像情報をDBに登録する
 */
export const registerImage = async (
  imageId: string,
  userId: string, 
  file: Express.Multer.File, 
  category: string
) => {
  return await uploadImagesRepo.createUploadImage({
    id: imageId,
    user_id: userId,
    category: category,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size_bytes: file.size,
  });
};

export const getImageById = async (id: string) => {
  return await uploadImagesRepo.findImageById(id);
}

export const getImagesByUserId = async (userId: string) => {
  return await uploadImagesRepo.findImagesByUserId(userId);
}