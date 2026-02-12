import { Request, Response } from 'express';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { generateAgenticDraft } from '../agents/blogGraph';

// Models - Using 2.5 versions for better performance
const TEXT_MODEL = 'gemini-2.5-pro';
const COMPLEX_TEXT_MODEL = 'gemini-2.5-pro';
const IMAGE_GEN_MODEL = 'imagen-3.0-generate-001';
const AUDIO_MODEL = 'gemini-2.5-pro';
const TTS_MODEL = 'gemini-2.5-pro';

// Initialize AI client
const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    return new GoogleGenAI({ apiKey });
};

// ============================================================================
// AGENTIC BLOG DRAFT GENERATION
// Uses LangGraph workflow: Router → Research → Plan → Write
// ============================================================================

export const generateBlogDraft = async (req: Request, res: Response) => {
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
        const content = await generateAgenticDraft(topic);

        console.log('✅ [AI CONTROLLER] Agentic generation successful');
        console.log(`📊 Generated ${content.length} characters\n`);

        res.json({ content });
    } catch (error: any) {
        console.error('❌ [AI CONTROLLER] Draft generation failed:', error);

        // Detailed error response
        res.status(500).json({
            error: 'Agentic blog generation failed',
            details: error.message,
            fallback: 'Try a simpler topic or check API keys (GEMINI_API_KEY, TAVILY_API_KEY)'
        });
    }
};

// Streamed Agentic Draft Generation
export const generateBlogDraftStream = async (req: Request, res: Response) => {
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

        const { generateAgenticDraftStream } = await import('../agents/blogGraph');
        const stream = generateAgenticDraftStream(topic);

        for await (const update of stream) {
            res.write(`data: ${JSON.stringify(update)}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

    } catch (error: any) {
        console.error('❌ [AI STREAM] Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Stream failed' });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
    }
};

// Improve Content
export const improveContent = async (req: Request, res: Response) => {
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

        const response = await ai.models.generateContent({
            model: COMPLEX_TEXT_MODEL,
            contents: prompt,
        });

        res.json({ content: response.text || content });
    } catch (error: any) {
        console.error('Improvement Error:', error);
        res.status(500).json({ error: error.message || 'Failed to improve content' });
    }
};

// Generate Title
export const generateTitle = async (req: Request, res: Response) => {
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

        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
        });

        res.json({ title: response.text?.trim() || '' });
    } catch (error: any) {
        console.error('Title Gen Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate title' });
    }
};

// Generate Metadata (Summary and Tags)
export const generateMetadata = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;

        if (!content) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }

        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: `Analyze this content and return JSON with a 'summary' (2 sentences) and 'tags' (5 keywords).\n\n${content.substring(0, 3000)}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                },
            },
        });

        const metadata = JSON.parse(response.text || '{"summary":"", "tags":[]}');
        res.json(metadata);
    } catch (error: any) {
        console.error('Metadata Error:', error);
        res.json({ summary: 'Analysis failed', tags: ['General'] });
    }
};

// Chat with Gemini
export const chatWithGemini = async (req: Request, res: Response) => {
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

        const response = await ai.models.generateContent({
            model: COMPLEX_TEXT_MODEL,
            contents: contents as any,
        });

        res.json({ response: response.text });
    } catch (error: any) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: error.message || 'Failed to chat' });
    }
};

// Analyze Image
export const analyzeImage = async (req: Request, res: Response) => {
    try {
        const { image, prompt } = req.body;

        if (!image) {
            res.status(400).json({ error: 'Image data is required' });
            return;
        }

        const ai = getAIClient();

        // Remove data URL prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const response = await ai.models.generateContent({
            model: COMPLEX_TEXT_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt || 'Describe this image in detail.' }
                ]
            }
        });

        res.json({ analysis: response.text || 'No analysis available.' });
    } catch (error: any) {
        console.error('Vision Error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze image' });
    }
};

// Generate Image
export const generateImage = async (req: Request, res: Response) => {
    try {
        const { prompt, aspectRatio = '1:1' } = req.body;

        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }

        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: IMAGE_GEN_MODEL,
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: aspectRatio as any } as any
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const imageData = `data:image/png;base64,${part.inlineData.data}`;
                res.json({ image: imageData });
                return;
            }
        }

        res.status(500).json({ error: 'No image generated' });
    } catch (error: any) {
        console.error('Image Gen Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
};

// Transcribe Audio
export const transcribeAudio = async (req: Request, res: Response) => {
    try {
        const { audio, mimeType } = req.body;

        if (!audio) {
            res.status(400).json({ error: 'Audio data is required' });
            return;
        }

        const ai = getAIClient();

        // Remove data URL prefix if present
        const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');

        const response = await ai.models.generateContent({
            model: AUDIO_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType || 'audio/wav', data: base64Data } },
                    { text: 'Transcribe this audio exactly as spoken.' }
                ]
            }
        });

        res.json({ transcription: response.text || '' });
    } catch (error: any) {
        console.error('Transcription Error:', error);
        res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
    }
};

// Generate Speech (TTS)
export const generateSpeech = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text) {
            res.status(400).json({ error: 'Text is required' });
            return;
        }

        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
            res.status(500).json({ error: 'No audio generated' });
            return;
        }

        res.json({ audio: audioData });
    } catch (error: any) {
        console.error('TTS Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate speech' });
    }
};
