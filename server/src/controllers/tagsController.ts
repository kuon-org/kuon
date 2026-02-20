import { Request, Response } from 'express';
import * as tagsService from '../services/tagsService.js';

export const getTags = async ( req: Request, res: Response ) => {
    try {
        const tags = await tagsService.getTagList();
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
    }
}