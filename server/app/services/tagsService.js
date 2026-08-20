export class TagsService {
    constructor(repo) {
        this.repo = repo;
    }
    async getTagList() {
        const tags = await this.repo.findAllTags();
        return tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            avatar_url: tag.avatar_url,
            articleCount: tag.article_tags.length,
            followCount: tag._count.tag_follows,
        }));
    }
    async getTag(slug) {
        const tag = await this.repo.findTagBySlug(slug);
        if (!tag)
            return null;
        return {
            id: tag?.id,
            name: tag.name,
            slug: tag.slug,
            avatar_url: tag.avatar_url,
            description: tag.description,
            articleCount: tag._count.article_tags,
            followCount: tag._count.tag_follows,
        };
    }
    async saveTag(tagData) {
        if (!tagData.name || !tagData.slug) {
            throw new Error("名前とスラグは必須入力です");
        }
        return await this.repo.upsertTag(tagData);
    }
    async getFollowingTags(userId, page, limit) {
        const { tags: rawTags, ...pagination } = await this.repo.followingTags(userId, page, limit);
        return {
            tags: rawTags.map((r) => r.tags),
            ...pagination,
        };
    }
    async getIsFollowing(userId, slug) {
        const isLike = await this.repo.isFollowing(userId, slug);
        return !!isLike;
    }
    async toggleFollowing(userId, slug) {
        const existing = await this.repo.isFollowing(userId, slug);
        if (existing) {
            await this.repo.removeFollowing(userId, slug);
            return { isFollowing: false, message: "フォロー解除しました" };
        }
        else {
            await this.repo.addFollowing(userId, slug);
            return { isFollowing: true, message: "フォローしました" };
        }
    }
}
