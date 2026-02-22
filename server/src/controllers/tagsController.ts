import { Request, Response } from 'express';
import { TagsService } from '../services/tagsService.js';

export class TagsController {
    constructor(
        private tagsService: TagsService
    ) { }

    getTags = async (req: Request, res: Response) => {
        try {
            const tags = await this.tagsService.getTagList();
            res.json(tags);
        } catch (error) {
            res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
        }
    }

    getTag = async (req: Request, res: Response) => {
        const slug = String(req.params.slug);
        try {
            const tag = await this.tagsService.getTag(slug)
            res.json(tag);
        } catch (error) {
            res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
        }
    }

    // 保存用メソッドを追加
    upsertTag = async (req: Request, res: Response) => {
        try {
            const { name, slug, description } = req.body;
            const result = await this.tagsService.saveTag({ name, slug, description });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'タグの保存に失敗しました' });
        }
    }
}