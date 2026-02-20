import prisma from "../prisma/client.js";

/**
 * アップロードされた画像のメタデータを保存する
 */
export const createUploadImage = async (data: {
    id: string;
    user_id: string;
    category: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
}) => {
    return prisma.upload_images.create({
        data: {
            id: data.id,
            user_id: data.user_id,
            category: data.category,
            original_name: data.original_name,
            mime_type: data.mime_type,
            size_bytes: data.size_bytes,
        },
    });
};
export const findImageById = async (id: string) => {
    return prisma.upload_images.findUnique({
        where: { id },
    });
};

export const findImagesByUserId = async (userId: string) => {
    return prisma.upload_images.findMany({
        where: { user_id: userId },
    })
}