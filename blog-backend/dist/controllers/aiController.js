"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpeech = exports.transcribeAudio = exports.generateImage = exports.analyzeImage = exports.chatWithGemini = exports.generateMetadata = exports.generateTitle = exports.improveContent = exports.generateBlogDraftStream = exports.generateBlogDraft = void 0;
const genai_1 = require("@google/genai");
const blogGraph_1 = require("../agents/blogGraph");
// Models - Using 2.5 versions for better performance
const TEXT_MODEL = 'gemini-2.5-flash';
const COMPLEX_TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_GEN_MODEL = 'imagen-3.0-generate-001';
const AUDIO_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash';
// Initialize AI client
const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    return new genai_1.GoogleGenAI({ apiKey });
};
// ============================================================================
// AGENTIC BLOG DRAFT GENERATION
// Uses LangGraph workflow: Router → Research → Plan → Write
// ============================================================================
const generateBlogDraft = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, instructions } = req.body;
        if (!title) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }
        console.log('\n🚀 [AI CONTROLLER] Initiating agentic blog generation');
        console.log(`📌 Title: "${title}"`);
        console.log(`📝 Instructions: "${instructions || 'Default generation'}"`);
        // Construct topic from title and instructions
        const topic = instructions
            ? `${title}. ${instructions}`
            : title;
        // Use agentic workflow
        const content = yield (0, blogGraph_1.generateAgenticDraft)(topic);
        console.log('✅ [AI CONTROLLER] Agentic generation successful');
        console.log(`📊 Generated ${content.length} characters\n`);
        res.json({ content });
    }
    catch (error) {
        console.error('❌ [AI CONTROLLER] Draft generation failed:', error);
        // Detailed error response
        res.status(500).json({
            error: 'Agentic blog generation failed',
            details: error.message,
            fallback: 'Try a simpler topic or check API keys (GEMINI_API_KEY, TAVILY_API_KEY)'
        });
    }
});
exports.generateBlogDraft = generateBlogDraft;
// Streamed Agentic Draft Generation
const generateBlogDraftStream = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        const { title, instructions } = req.body;
        if (!title) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }
        console.log(`\n🚀 [AI STREAM] Starting streaming generation for: "${title}"`);
        // Set headers for SSE/streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const topic = instructions ? `${title}. ${instructions}` : title;
        const { generateAgenticDraftStream } = yield Promise.resolve().then(() => __importStar(require('../agents/blogGraph')));
        const stream = generateAgenticDraftStream(topic);
        try {
            for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                _c = stream_1_1.value;
                _d = false;
                const update = _c;
                res.write(`data: ${JSON.stringify(update)}\n\n`);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error('❌ [AI STREAM] Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Stream failed' });
        }
        else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
    }
});
exports.generateBlogDraftStream = generateBlogDraftStream;
// Improve Content
const improveContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, instruction } = req.body;
        if (!content) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }
        const ai = getAIClient();
        const prompt = `
      Act as a professional editor. 
      Task: ${instruction || 'Improve grammar, clarity, and flow.'}
      Content: ${content}
      Output: Return ONLY the updated HTML content.
    `;
        const response = yield ai.models.generateContent({
            model: COMPLEX_TEXT_MODEL,
            contents: prompt,
        });
        res.json({ content: response.text || content });
    }
    catch (error) {
        console.error('Improvement Error:', error);
        res.status(500).json({ error: error.message || 'Failed to improve content' });
    }
});
exports.improveContent = improveContent;
// Generate Title
const generateTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { content } = req.body;
        if (!content) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }
        const ai = getAIClient();
        const prompt = `
      Read the following blog post content and generate a single, catchy, SEO-optimized title for it. 
      Return ONLY the title text, no quotes.
      
      Content Snippet:
      ${content.substring(0, 2000)}
    `;
        const response = yield ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
        });
        res.json({ title: ((_a = response.text) === null || _a === void 0 ? void 0 : _a.trim()) || '' });
    }
    catch (error) {
        console.error('Title Gen Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate title' });
    }
});
exports.generateTitle = generateTitle;
// Generate Metadata (Summary and Tags)
const generateMetadata = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        if (!content) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }
        const ai = getAIClient();
        const response = yield ai.models.generateContent({
            model: TEXT_MODEL,
            contents: `Analyze this content and return JSON with a 'summary' (2 sentences) and 'tags' (5 keywords).\n\n${content.substring(0, 3000)}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        summary: { type: genai_1.Type.STRING },
                        tags: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                    },
                },
            },
        });
        const metadata = JSON.parse(response.text || '{"summary":"", "tags":[]}');
        res.json(metadata);
    }
    catch (error) {
        console.error('Metadata Error:', error);
        res.json({ summary: 'Analysis failed', tags: ['General'] });
    }
});
exports.generateMetadata = generateMetadata;
// Chat with Gemini
const chatWithGemini = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { history, message } = req.body;
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        const ai = getAIClient();
        // Construct the full conversation history
        const contents = [
            ...(history || []),
            { role: 'user', parts: [{ text: message }] }
        ];
        const response = yield ai.models.generateContent({
            model: COMPLEX_TEXT_MODEL,
            contents: contents,
        });
        res.json({ response: response.text });
    }
    catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: error.message || 'Failed to chat' });
    }
});
exports.chatWithGemini = chatWithGemini;
// Analyze Image
const analyzeImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { image, prompt } = req.body;
        if (!image) {
            res.status(400).json({ error: 'Image data is required' });
            return;
        }
        const ai = getAIClient();
        // Remove data URL prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const response = yield ai.models.generateContent({
            model: COMPLEX_TEXT_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt || 'Describe this image in detail.' }
                ]
            }
        });
        res.json({ analysis: response.text || 'No analysis available.' });
    }
    catch (error) {
        console.error('Vision Error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze image' });
    }
});
exports.analyzeImage = analyzeImage;
// Generate Image
const generateImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { prompt, aspectRatio = '1:1' } = req.body;
        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }
        const ai = getAIClient();
        const response = yield ai.models.generateContent({
            model: IMAGE_GEN_MODEL,
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: aspectRatio }
            }
        });
        for (const part of ((_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) || []) {
            if (part.inlineData) {
                const imageData = `data:image/png;base64,${part.inlineData.data}`;
                res.json({ image: imageData });
                return;
            }
        }
        res.status(500).json({ error: 'No image generated' });
    }
    catch (error) {
        console.error('Image Gen Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
});
exports.generateImage = generateImage;
// Transcribe Audio
const transcribeAudio = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { audio, mimeType } = req.body;
        if (!audio) {
            res.status(400).json({ error: 'Audio data is required' });
            return;
        }
        const ai = getAIClient();
        // Remove data URL prefix if present
        const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
        const response = yield ai.models.generateContent({
            model: AUDIO_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType || 'audio/wav', data: base64Data } },
                    { text: 'Transcribe this audio exactly as spoken.' }
                ]
            }
        });
        res.json({ transcription: response.text || '' });
    }
    catch (error) {
        console.error('Transcription Error:', error);
        res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
    }
});
exports.transcribeAudio = transcribeAudio;
// Generate Speech (TTS)
const generateSpeech = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { text } = req.body;
        if (!text) {
            res.status(400).json({ error: 'Text is required' });
            return;
        }
        const ai = getAIClient();
        const response = yield ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [genai_1.Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        const audioData = (_f = (_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.inlineData) === null || _f === void 0 ? void 0 : _f.data;
        if (!audioData) {
            res.status(500).json({ error: 'No audio generated' });
            return;
        }
        res.json({ audio: audioData });
    }
    catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate speech' });
    }
});
exports.generateSpeech = generateSpeech;
