import prisma from "../prisma/client.js";
export class UploadImagesRepository {
    constructor() {
        this.db = prisma;
    }
    async createUploadImage(data) {
        return this.db.upload_images.create({ data });
    }
    async findImageById(id) {
        return this.db.upload_images.findUnique({ where: { id } });
    }
    async findImagesByUserId(userId) {
        return this.db.upload_images.findMany({ where: { user_id: userId } });
    }
}
