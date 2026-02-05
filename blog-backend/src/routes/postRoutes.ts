import { Router } from 'express';
import { getPosts, getPost, createPost, updatePost, deletePost } from '../controllers/postController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getPosts);
router.get('/:id', getPost);

// Protected routes
router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

export default router;
