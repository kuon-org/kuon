import { Router } from 'express';
import { TagsController } from '../controllers/tagsController.js';
import { TagsRepository } from '../repositories/tagsRepository.js';
import { TagsService } from '../services/tagsService.js';

const tagsRouter = Router();

const tagsRepo = new TagsRepository();
const tagsService = new TagsService(tagsRepo);
const tagsController = new TagsController(tagsService);

// タグ一覧取得
tagsRouter.get('/tags', tagsController.getTags);

tagsRouter.get('/tags/:slug', tagsController.getTag);

// タグの保存・更新（POST /api/tags）
tagsRouter.post('/tags', tagsController.upsertTag);



export default tagsRouter;