import { Router } from 'express';
import { getTags } from '../controllers/tagsController.js';

const tagsRouter = Router();

tagsRouter.get('/tags', getTags);

export default tagsRouter;