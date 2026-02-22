import { PrismaClient } from "@prisma/client";
import prisma from "../prisma/client.js";

export class UploadImagesRepository {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  async createUploadImage(data: {
    id: string;
    user_id: string;
    category: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
  }) {
    return this.db.upload_images.create({ data });
  }

  async findImageById(id: string) {
    return this.db.upload_images.findUnique({ where: { id } });
  }

  async findImagesByUserId(userId: string) {
    return this.db.upload_images.findMany({ where: { user_id: userId } });
  }
}