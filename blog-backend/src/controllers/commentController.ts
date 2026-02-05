import { Request, Response } from 'express';
import prisma from '../config/db';
import { createCommentSchema } from '../schemas/comment.schema';

export const getComments = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params as { postId: string };
        const comments = await prisma.comment.findMany({
            where: { postId },
            include: { author: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params as { postId: string };
        //@ts-ignore
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const result = createCommentSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({ error: result.error.issues[0].message });
            return;
        }

        const { content } = result.data;

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId: userId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        role: true,
                        createdAt: true
                    }
                }
            }
        });
        res.status(201).json(comment);
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
};
