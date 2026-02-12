import { Request, Response } from 'express';
import prisma from '../config/db';
import { createPostSchema, updatePostSchema } from '../schemas/post.schema';


export const getPosts = async (req: Request, res: Response) => {
    try {
        console.log("getPosts reached");
        const posts = await prisma.post.findMany({
            include: { author: true, comments: true },
            orderBy: { createdAt: 'desc' }
        });

        // Transform to include authorName for frontend
        const transformedPosts = posts.map((post: any) => ({
            ...post,
            authorName: post.author.name
        }));

        res.json(transformedPosts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};

export const getPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const post = await prisma.post.findUnique({
            where: { id },
            include: { author: true, comments: { include: { author: true } } }
        });
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        // Transform to include authorName
        const transformedPost = {
            ...post,
            authorName: post.author.name
        };

        res.json(transformedPost);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch post' });
    }
};

export const createPost = async (req: Request, res: Response) => {
    try {
        console.log("createPost reached");
        //@ts-ignore
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const result = createPostSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({ error: result.error.issues[0].message });
            return;
        }

        const { title, content, summary, tags, coverImage, status, scheduledAt } = result.data;

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

        // Auto-generate summary from content if not provided or if it's placeholder text
        let finalSummary = summary;
        if (!summary || summary === 'No summary' || summary.trim() === '') {
            // Strip HTML tags and get first 150 characters
            const plainText = content.replace(/<[^>]*>/g, '').trim();
            finalSummary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
        }

        const post = await prisma.post.create({
            data: {
                title,
                slug,
                content,
                summary: finalSummary,
                tags: tags || [],
                coverImage,
                status: status || 'DRAFT',
                // @ts-ignore - scheduledAt will be available after prisma generate
                ...(scheduledAt && { scheduledAt }),
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
        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

export const updatePost = async (req: Request, res: Response) => {
    try {

        const { id } = req.params as { id: string };
        const result = updatePostSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({ error: result.error.issues[0].message });
            return;
        }

        const { title, content, summary, tags, coverImage, status, scheduledAt } = result.data;

        // Auto-generate summary from content if not provided or if it's placeholder text
        let finalSummary = summary;
        if (content && (!summary || summary === 'No summary' || summary.trim() === '')) {
            // Strip HTML tags and get first 150 characters
            const plainText = content.replace(/<[^>]*>/g, '').trim();
            finalSummary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
        }

        const post = await prisma.post.update({
            where: { id },
            data: {
                title,
                content,
                summary: finalSummary,
                tags,
                coverImage,
                status,
                // @ts-ignore - scheduledAt will be available after prisma generate
                ...(scheduledAt !== undefined && { scheduledAt })
            }
        });
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update post' });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };

        // First delete all comments associated with this post
        await prisma.comment.deleteMany({ where: { postId: id } });

        // Then delete the post
        await prisma.post.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
};
