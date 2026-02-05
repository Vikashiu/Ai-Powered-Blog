import { Router, Request, Response } from 'express';
import prisma from '../config/db';

const router = Router();

// Admin endpoint to fix all summaries
router.post('/fix-summaries', async (req: Request, res: Response) => {
    try {
        // Find all posts with "No summary" or empty summary
        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { summary: { contains: 'No summary' } },
                    { summary: '' }
                ]
            }
        });

        const updates = [];
        for (const post of posts) {
            // Generate summary from content
            const plainText = post.content.replace(/<[^>]*>/g, '').trim();
            const newSummary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');

            const updated = await prisma.post.update({
                where: { id: post.id },
                data: { summary: newSummary }
            });

            updates.push({ id: post.id, title: post.title, summary: newSummary });
        }

        res.json({
            message: `Fixed ${updates.length} posts`,
            updates
        });
    } catch (error) {
        console.error('Fix summaries error:', error);
        res.status(500).json({ error: 'Failed to fix summaries' });
    }
});

export default router;
