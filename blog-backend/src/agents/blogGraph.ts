/**
 * Agentic Blog Generation Workflow using LangGraph.js
 * 
 * Architecture: Router → Research → Plan → Write
 * Powered by: Google Gemini 2.5 Flash + Tavily Search
 */

import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { tavily } from "@tavily/core";

// ============================================================================
// STATE SCHEMA
// ============================================================================

export interface BlogState {
    topic: string;
    needsResearch: boolean;
    searchQueries: string[];
    researchContext: string;
    blogPlan: Array<{ title: string; instructions: string }>;
    finalContent: string;
}

// ============================================================================
// ZOD SCHEMAS FOR STRUCTURED OUTPUT
// ============================================================================

const RouterOutputSchema = z.object({
    needsResearch: z.boolean().describe("Whether the topic requires online research"),
    searchQueries: z.array(z.string()).describe("3-4 specific search queries to gather information"),
    reasoning: z.string().describe("Why research is or isn't needed"),
});

const PlannerOutputSchema = z.object({
    sections: z.array(
        z.object({
            title: z.string().describe("Section heading"),
            instructions: z.string().describe("What to write in this section"),
        })
    ).describe("Structured blog outline with 4-6 sections"),
});

// ============================================================================
// INITIALIZE GOOGLE GENAI CLIENT
// ============================================================================

const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

const MODEL_NAME = "gemini-2.5-flash"; // Fast, reliable model

// ============================================================================
// NODE 1: ROUTER
// Analyzes topic and determines if research is needed
// ============================================================================

async function routerNode(state: BlogState): Promise<Partial<BlogState>> {
    console.log("🔀 [ROUTER] Analyzing topic:", state.topic);

    const ai = getGeminiClient();

    const prompt = `You are a blog strategy expert. Analyze this topic and determine if it requires online research.

Topic: "${state.topic}"

Consider:
- Does this need current data, statistics, or recent events?
- Is this a technical topic that benefits from multiple sources?
- Or is this a personal/creative topic that doesn't need research?

If research IS needed, generate 3-4 specific, diverse search queries to gather comprehensive information.
If research is NOT needed, set searchQueries to an empty array.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        needsResearch: { type: Type.BOOLEAN },
                        searchQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
                        reasoning: { type: Type.STRING },
                    },
                },
            },
        });

        const result = JSON.parse(response.text || "{}");

        console.log(`✅ [ROUTER] Decision: ${result.needsResearch ? 'RESEARCH NEEDED' : 'NO RESEARCH NEEDED'}`);
        console.log(`📋 [ROUTER] Queries: ${result.searchQueries?.join(', ') || 'none'}`);

        return {
            needsResearch: result.needsResearch || false,
            searchQueries: result.searchQueries || [],
        };
    } catch (error) {
        console.error("❌ [ROUTER] Error:", error);
        // Fallback: assume no research needed
        return {
            needsResearch: false,
            searchQueries: [],
        };
    }
}

// ============================================================================
// NODE 2: RESEARCHER
// Executes Tavily searches and aggregates results
// ============================================================================

async function researcherNode(state: BlogState): Promise<Partial<BlogState>> {
    console.log("🔍 [RESEARCHER] Starting research...");

    if (!state.needsResearch || state.searchQueries.length === 0) {
        console.log("⏭️  [RESEARCHER] Skipping research (not needed)");
        return { researchContext: "" };
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.error("❌ [RESEARCHER] TAVILY_API_KEY not set");
        return { researchContext: "" };
    }

    const tvly = tavily({ apiKey });
    const allResults: string[] = [];

    try {
        for (const query of state.searchQueries) {
            console.log(`  🔎 Searching: "${query}"`);

            const response = await tvly.search(query, {
                maxResults: 3,
                includeAnswer: true,
            });

            // Extract answer and key content
            if (response.answer) {
                allResults.push(`\n### Research: ${query}\n${response.answer}`);
            }

            // Add top results
            response.results.slice(0, 2).forEach((result) => {
                allResults.push(`\n**Source:** ${result.title}\n${result.content}`);
            });
        }

        const researchContext = allResults.join("\n\n---\n");
        console.log(`✅ [RESEARCHER] Gathered ${allResults.length} research snippets`);

        return { researchContext };
    } catch (error) {
        console.error("❌ [RESEARCHER] Error:", error);
        return { researchContext: "Research unavailable - proceeding with general knowledge." };
    }
}

// ============================================================================
// NODE 3: PLANNER
// Generates structured blog outline
// ============================================================================

async function plannerNode(state: BlogState): Promise<Partial<BlogState>> {
    console.log("📝 [PLANNER] Creating blog outline...");

    const ai = getGeminiClient();

    const prompt = `You are an expert blog editor. Create a comprehensive, structured outline for a blog post.

Topic: "${state.topic}"

${state.researchContext ? `Research Context:\n${state.researchContext.substring(0, 3000)}` : 'No specific research available - use general knowledge.'}

Create an outline with 4-6 well-structured sections. Each section should have:
- A compelling title  
- Detailed instructions on what to cover

Make it engaging, informative, and reader-friendly.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sections: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    instructions: { type: Type.STRING },
                                },
                            },
                        },
                    },
                },
            },
        });

        const result = JSON.parse(response.text || '{"sections":[]}');

        console.log(`✅ [PLANNER] Created ${result.sections?.length || 0} sections`);
        (result.sections || []).forEach((section: any, i: number) => {
            console.log(`  ${i + 1}. ${section.title}`);
        });

        return { blogPlan: result.sections || [] };
    } catch (error) {
        console.error("❌ [PLANNER] Error:", error);
        // Fallback plan
        return {
            blogPlan: [
                { title: "Introduction", instructions: `Introduce ${state.topic}` },
                { title: "Main Content", instructions: `Discuss ${state.topic} in detail` },
                { title: "Conclusion", instructions: `Summarize key points about ${state.topic}` },
            ],
        };
    }
}

// ============================================================================
// NODE 4: WRITER/REDUCER
// Generates content for each section and combines them
// ============================================================================

async function writerNode(state: BlogState): Promise<Partial<BlogState>> {
    console.log("✍️  [WRITER] Generating blog content...");

    const ai = getGeminiClient();
    const sections: string[] = [];

    for (let i = 0; i < state.blogPlan.length; i++) {
        const section = state.blogPlan[i];
        console.log(`  Writing: ${section.title} (${i + 1}/${state.blogPlan.length})`);

        const prompt = `You are a professional blog writer. Write engaging, well-formatted content for this section.

Blog Topic: "${state.topic}"

Section: ${section.title}
Instructions: ${section.instructions}

${state.researchContext ? `Research Context:\n${state.researchContext.substring(0, 2000)}` : ''}

Write 2-4 paragraphs in HTML format. Use proper tags: <h2>, <p>, <ul>, <li>, <strong>, <em>.
Be informative, engaging, and professional. Include specific details and examples.`;

        try {
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
            });

            const content = response.text || "";
            sections.push(content);
        } catch (error) {
            console.error(`❌ [WRITER] Error writing section "${section.title}":`, error);
            sections.push(`<h2>${section.title}</h2>\n<p>Content generation failed for this section.</p>`);
        }
    }

    const finalContent = sections.join("\n\n");
    console.log(`✅ [WRITER] Generated ${finalContent.length} characters`);

    return { finalContent };
}

// ============================================================================
// CONDITIONAL EDGE LOGIC
// ============================================================================

function shouldResearch(state: BlogState): string {
    return state.needsResearch ? "researcher" : "planner";
}

// ============================================================================
// BUILD THE GRAPH
// ============================================================================

// Define the state annotation for the graph
const GraphState = Annotation.Root({
    topic: Annotation<string>,
    needsResearch: Annotation<boolean>,
    searchQueries: Annotation<string[]>,
    researchContext: Annotation<string>,
    blogPlan: Annotation<Array<{ title: string; instructions: string }>>,
    finalContent: Annotation<string>,
});

const workflow = new StateGraph(GraphState)
    // Add nodes
    .addNode("router", routerNode)
    .addNode("researcher", researcherNode)
    .addNode("planner", plannerNode)
    .addNode("writer", writerNode)

    // Define the flow
    .addEdge("__start__", "router")
    .addConditionalEdges("router", shouldResearch, {
        researcher: "researcher",
        planner: "planner",
    })
    .addEdge("researcher", "planner")
    .addEdge("planner", "writer")
    .addEdge("writer", END);

const blogGraph = workflow.compile();

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export async function generateAgenticDraft(topic: string): Promise<string> {
    console.log("\n🚀 ====== STARTING AGENTIC BLOG GENERATION ======");
    console.log("📌 Topic:", topic);
    console.log("=".repeat(50) + "\n");

    const initialState = {
        topic,
        needsResearch: false,
        searchQueries: [],
        researchContext: "",
        blogPlan: [],
        finalContent: "",
    };

    try {
        const result = await blogGraph.invoke(initialState);

        console.log("\n✅ ====== BLOG GENERATION COMPLETE ======");
        console.log("📊 Stats:");
        console.log(`  - Research: ${result.needsResearch ? 'YES' : 'NO'}`);
        console.log(`  - Sections: ${result.blogPlan?.length || 0}`);
        console.log(`  - Length: ${result.finalContent?.length || 0} chars`);
        console.log("=".repeat(50) + "\n");

        return result.finalContent || "";
    } catch (error) {
        console.error("\n❌ ====== BLOG GENERATION FAILED ======");
        console.error("Error:", error);
        console.error("=".repeat(50) + "\n");
        throw new Error(`Agentic blog generation failed: ${(error as Error).message}`);
    }
}

/**
 * Generator function that streams progress logs and final content
 * Used for real-time frontend updates
 */
export async function* generateAgenticDraftStream(topic: string) {
    const initialState = {
        topic,
        needsResearch: false,
        searchQueries: [],
        researchContext: "",
        blogPlan: [],
        finalContent: "",
    };

    yield { type: 'log', message: `🚀 Initializing Agentic Workflow for: "${topic}"` };

    let finalContent = "";

    try {
        const stream = await blogGraph.stream(initialState);

        for await (const chunk of stream) {
            const nodeName = Object.keys(chunk)[0];
            const state = (chunk as any)[nodeName];

            if (nodeName === 'router') {
                yield { type: 'log', message: `🔀 [ROUTER] Analyzed topic. Research needed: ${state.needsResearch ? 'YES' : 'NO'}` };
                if (state.needsResearch) {
                    yield { type: 'log', message: `📋 [ROUTER] Generated search queries: ${state.searchQueries.join(', ')}` };
                }
            } else if (nodeName === 'researcher') {
                if (state.researchContext) {
                    yield { type: 'log', message: `🔍 [RESEARCHER] Gathered research data.` };
                } else {
                    yield { type: 'log', message: `⏭️ [RESEARCHER] Skipped research phase.` };
                }
            } else if (nodeName === 'planner') {
                yield { type: 'log', message: `📝 [PLANNER] Created valid blog outline with ${state.blogPlan.length} sections.` };
                const sections = state.blogPlan || [];
                for (let i = 0; i < sections.length; i++) {
                    yield { type: 'log', message: `  - Section ${i + 1}: ${sections[i].title}` };
                }
            } else if (nodeName === 'writer') {
                // Determine if this is the final output
                // In LangGraph, the writer output should contain the finalContent
                if (state.finalContent) {
                    finalContent = state.finalContent;
                    yield { type: 'log', message: `✍️ [WRITER] Draft generation complete. Length: ${finalContent.length} chars.` };
                }
            }
        }

        if (finalContent) {
            yield { type: 'result', content: finalContent };
        } else {
            yield { type: 'error', message: "Failed to generate content (empty output)" };
        }

    } catch (error) {
        yield { type: 'error', message: `❌ Error: ${(error as Error).message}` };
        throw error;
    }
}
