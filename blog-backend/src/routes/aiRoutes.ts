import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// Text Generation
router.post('/generate-draft', aiController.generateBlogDraft);
router.post('/generate-draft-stream', aiController.generateBlogDraftStream);
router.post('/improve-content', aiController.improveContent);
router.post('/generate-title', aiController.generateTitle);
router.post('/generate-metadata', aiController.generateMetadata);

// Chat
router.post('/chat', aiController.chatWithGemini);

// Vision
router.post('/analyze-image', aiController.analyzeImage);
router.post('/generate-image', aiController.generateImage);

// Audio
router.post('/transcribe-audio', aiController.transcribeAudio);
router.post('/generate-speech', aiController.generateSpeech);

export default router;
