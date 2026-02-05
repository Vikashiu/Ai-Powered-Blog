// This service now acts as a proxy to the backend AI API
// All AI operations are handled securely on the server

import { apiService } from './apiService';

// --- Text & Chat ---

export const generateBlogDraft = async (title: string, instructions: string): Promise<string> => {
  try {
    const response = await apiService.client.post('/ai/generate-draft', {
      title,
      instructions
    });
    return response.data.content || '';
  } catch (error: any) {
    console.error('Draft Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate draft');
  }
};

export const improveContent = async (content: string, instruction?: string): Promise<string> => {
  try {
    const response = await apiService.client.post('/ai/improve-content', {
      content,
      instruction
    });
    return response.data.content || content;
  } catch (error: any) {
    console.error('Improvement Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to improve content');
  }
};

export const generateTitle = async (content: string): Promise<string> => {
  try {
    const response = await apiService.client.post('/ai/generate-title', {
      content
    });
    return response.data.title?.trim() || '';
  } catch (error: any) {
    console.error('Title Gen Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate title');
  }
};

export const chatWithGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string
) => {
  try {
    const response = await apiService.client.post('/ai/chat', {
      history,
      message
    });
    return response.data.response;
  } catch (error: any) {
    console.error('Chat Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to chat');
  }
};

export const generateMetadata = async (
  content: string
): Promise<{ summary: string; tags: string[] }> => {
  try {
    const response = await apiService.client.post('/ai/generate-metadata', {
      content
    });
    return response.data;
  } catch (error: any) {
    console.error('Metadata Error:', error);
    return { summary: 'Analysis failed', tags: ['General'] };
  }
};

// --- Vision ---

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const response = await apiService.client.post('/ai/analyze-image', {
      image: base64Image,
      prompt
    });
    return response.data.analysis || 'No analysis available.';
  } catch (error: any) {
    console.error('Vision Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to analyze image');
  }
};

// --- Image Generation ---

export const generateImage = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
  try {
    const response = await apiService.client.post('/ai/generate-image', {
      prompt,
      aspectRatio
    });
    return response.data.image;
  } catch (error: any) {
    console.error('Image Gen Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate image');
  }
};

// --- Audio & Speech ---

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    const response = await apiService.client.post('/ai/transcribe-audio', {
      audio: audioBase64,
      mimeType
    });
    return response.data.transcription || '';
  } catch (error: any) {
    console.error('Transcription Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to transcribe audio');
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await apiService.client.post('/ai/generate-speech', {
      text
    });

    const audioData = response.data.audio;
    if (!audioData) {
      throw new Error('No audio generated');
    }
    return audioData;
  } catch (error: any) {
    console.error('TTS Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate speech');
  }
};
