"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getPosts = void 0;
const db_1 = __importDefault(require("../config/db"));
const post_schema_1 = require("../schemas/post.schema");
const getPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("getPosts reached");
        const posts = yield db_1.default.post.findMany({
            include: { author: true, comments: true },
            orderBy: { createdAt: 'desc' }
        });
        // Transform to include authorName for frontend
        const transformedPosts = posts.map((post) => (Object.assign(Object.assign({}, post), { authorName: post.author.name })));
        res.json(transformedPosts);
    }
    catch (error) {
        console.error('getPosts error:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});
exports.getPosts = getPosts;
const getPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const post = yield db_1.default.post.findUnique({
            where: { id },
            include: { author: true, comments: { include: { author: true } } }
        });
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        // Transform to include authorName
        const transformedPost = Object.assign(Object.assign({}, post), { authorName: post.author.name });
        res.json(transformedPost);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});
exports.getPost = getPost;
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("createPost reached");
        //@ts-ignore
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const result = post_schema_1.createPostSchema.safeParse(req.body);
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
        const post = yield db_1.default.post.create({
            data: Object.assign(Object.assign({ title,
                slug,
                content, summary: finalSummary, tags: tags || [], coverImage, status: status || 'DRAFT' }, (scheduledAt && { scheduledAt })), { authorId: userId }),
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
    }
    catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});
exports.createPost = createPost;
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = post_schema_1.updatePostSchema.safeParse(req.body);
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
        const post = yield db_1.default.post.update({
            where: { id },
            data: Object.assign({ title,
                content, summary: finalSummary, tags,
                coverImage,
                status }, (scheduledAt !== undefined && { scheduledAt }))
        });
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update post' });
    }
});
exports.updatePost = updatePost;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // First delete all comments associated with this post
        yield db_1.default.comment.deleteMany({ where: { postId: id } });
        // Then delete the post
        yield db_1.default.post.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});
exports.deletePost = deletePost;
