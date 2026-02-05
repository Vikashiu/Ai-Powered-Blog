import { Router } from 'express';
import { getComments, createComment } from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = Router({ mergeParams: true }); // Important for accessing :postId from parent route

router.get('/', getComments);
router.post('/', authenticateToken, createComment);

export default router;
