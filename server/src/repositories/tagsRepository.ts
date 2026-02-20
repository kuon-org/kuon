import prisma from '../prisma/client.js';

export const findAllTags = async () => {
    return prisma.tags.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        article_tags: {
          select: {
            article_id: true
          }
        }
      }
    });
}