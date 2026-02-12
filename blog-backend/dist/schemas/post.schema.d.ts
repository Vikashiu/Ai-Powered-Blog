import { z } from 'zod';
export declare const createPostSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    summary: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    coverImage: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        SCHEDULED: "SCHEDULED";
        ARCHIVED: "ARCHIVED";
    }>>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const updatePostSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    coverImage: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        SCHEDULED: "SCHEDULED";
        ARCHIVED: "ARCHIVED";
    }>>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
