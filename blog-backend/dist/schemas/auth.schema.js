"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.email('Invalid email address'),
    name: zod_1.z.string().min(1, 'Name is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
