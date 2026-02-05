"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
exports.createPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    content: zod_1.z.string().min(1, 'Content is required'),
    summary: zod_1.z.string().min(1, 'Summary is required'),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    coverImage: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
    scheduledAt: zod_1.z.string().datetime().optional().nullable(),
});
exports.updatePostSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    content: zod_1.z.string().min(1).optional(),
    summary: zod_1.z.string().min(1).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    coverImage: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
    scheduledAt: zod_1.z.string().datetime().optional().nullable(),
});
