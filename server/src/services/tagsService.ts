import { TagsRepository } from '../repositories/tagsRepository.js';

export class TagsService {
    constructor(
        private repo: TagsRepository
    ) { }

    async getTagList() {
        const tags = await this.repo.findAllTags();
        return tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            avatar_url: tag.avatar_url,
            articleCount: tag.article_tags.length,
            followCount: tag._count.tag_follows
        }));
    }

    async getTag(slug: string) {
        const tag = await this.repo.findTagBySlug(slug);
        if (!tag) return null;
        return { id: tag?.id, name: tag.name, slug: tag.slug,avatar_url: tag.avatar_url, description: tag.description, articleCount: tag._count.article_tags, followCount: tag._count.tag_follows };
    }

    async saveTag(tagData: { name: string; slug: string; description?: string }) {
        if (!tagData.name || !tagData.slug) {
            throw new Error('名前とスラグは必須入力です');
        }
        return await this.repo.upsertTag(tagData);
    }
}