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
exports.createComment = exports.getComments = void 0;
const db_1 = __importDefault(require("../config/db"));
const comment_schema_1 = require("../schemas/comment.schema");
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const comments = yield db_1.default.comment.findMany({
            where: { postId },
            include: { author: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});
exports.getComments = getComments;
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        //@ts-ignore
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const result = comment_schema_1.createCommentSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error.issues[0].message });
            return;
        }
        const { content } = result.data;
        const comment = yield db_1.default.comment.create({
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
    }
    catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});
exports.createComment = createComment;
