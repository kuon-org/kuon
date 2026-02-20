import * as tagsRepo from '../repositories/tagsRepository.js';

export const getTagList = async () => {
    const tags = await tagsRepo.findAllTags();
    return tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        articleCount: tag.article_tags.length
    }))
}