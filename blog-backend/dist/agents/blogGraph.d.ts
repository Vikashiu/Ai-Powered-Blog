/**
 * Agentic Blog Generation Workflow using LangGraph.js
 *
 * Architecture: Router → Research → Plan → Write
 * Powered by: Google Gemini 2.5 Flash + Tavily Search
 */
export interface BlogState {
    topic: string;
    needsResearch: boolean;
    searchQueries: string[];
    researchContext: string;
    blogPlan: Array<{
        title: string;
        instructions: string;
    }>;
    finalContent: string;
}
export declare function generateAgenticDraft(topic: string): Promise<string>;
/**
 * Generator function that streams progress logs and final content
 * Used for real-time frontend updates
 */
export declare function generateAgenticDraftStream(topic: string): AsyncGenerator<{
    type: string;
    message: string;
    content?: undefined;
} | {
    type: string;
    content: string;
    message?: undefined;
}, void, unknown>;
