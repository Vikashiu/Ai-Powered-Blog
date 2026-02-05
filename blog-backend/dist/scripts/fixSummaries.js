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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function fixSummaries() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔄 Fixing posts with "No summary"...');
            // Find all posts with "No summary" or empty summary
            const posts = yield prisma.post.findMany({
                where: {
                    OR: [
                        { summary: 'No summary' },
                        { summary: '' },
                        { summary: null }
                    ]
                }
            });
            console.log(`📊 Found ${posts.length} posts to fix`);
            for (const post of posts) {
                // Generate summary from content
                const plainText = post.content.replace(/<[^>]*>/g, '').trim();
                const newSummary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
                yield prisma.post.update({
                    where: { id: post.id },
                    data: { summary: newSummary }
                });
                console.log(`✅ Updated: ${post.title}`);
            }
            console.log('🎉 All summaries fixed!');
        }
        catch (error) {
            console.error('❌ Error:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
fixSummaries();
