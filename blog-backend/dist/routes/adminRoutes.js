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
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const router = (0, express_1.Router)();
// Admin endpoint to fix all summaries
router.post('/fix-summaries', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find all posts with "No summary" or empty summary
        const posts = yield db_1.default.post.findMany({
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
            const updated = yield db_1.default.post.update({
                where: { id: post.id },
                data: { summary: newSummary }
            });
            updates.push({ id: post.id, title: post.title, summary: newSummary });
        }
        res.json({
            message: `Fixed ${updates.length} posts`,
            updates
        });
    }
    catch (error) {
        console.error('Fix summaries error:', error);
        res.status(500).json({ error: 'Failed to fix summaries' });
    }
}));
exports.default = router;
