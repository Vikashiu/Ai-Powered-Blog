"use strict";
/**
 * Agentic Blog Generation Workflow using LangGraph.js
 *
 * Architecture: Router → Research → Plan → Write
 * Powered by: Google Gemini 2.5 Flash + Tavily Search
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAgenticDraft = generateAgenticDraft;
exports.generateAgenticDraftStream = generateAgenticDraftStream;
const langgraph_1 = require("@langchain/langgraph");
const genai_1 = require("@google/genai");
const zod_1 = require("zod");
const core_1 = require("@tavily/core");
// ============================================================================
// ZOD SCHEMAS FOR STRUCTURED OUTPUT
// ============================================================================
const RouterOutputSchema = zod_1.z.object({
    needsResearch: zod_1.z.boolean().describe("Whether the topic requires online research"),
    searchQueries: zod_1.z.array(zod_1.z.string()).describe("3-4 specific search queries to gather information"),
    reasoning: zod_1.z.string().describe("Why research is or isn't needed"),
});
const PlannerOutputSchema = zod_1.z.object({
    sections: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string().describe("Section heading"),
        instructions: zod_1.z.string().describe("What to write in this section"),
    })).describe("Structured blog outline with 4-6 sections"),
});
// ============================================================================
// INITIALIZE GOOGLE GENAI CLIENT
// ============================================================================
const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    return new genai_1.GoogleGenAI({ apiKey });
};
const MODEL_NAME = "gemini-2.5-flash"; // Fast, reliable model
// ============================================================================
// NODE 1: ROUTER
// Analyzes topic and determines if research is needed
// ============================================================================
function routerNode(state) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
            const response = yield ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            needsResearch: { type: genai_1.Type.BOOLEAN },
                            searchQueries: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                            reasoning: { type: genai_1.Type.STRING },
                        },
                    },
                },
            });
            const result = JSON.parse(response.text || "{}");
            console.log(`✅ [ROUTER] Decision: ${result.needsResearch ? 'RESEARCH NEEDED' : 'NO RESEARCH NEEDED'}`);
            console.log(`📋 [ROUTER] Queries: ${((_a = result.searchQueries) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'none'}`);
            return {
                needsResearch: result.needsResearch || false,
                searchQueries: result.searchQueries || [],
            };
        }
        catch (error) {
            console.error("❌ [ROUTER] Error:", error);
            // Fallback: assume no research needed
            return {
                needsResearch: false,
                searchQueries: [],
            };
        }
    });
}
// ============================================================================
// NODE 2: RESEARCHER
// Executes Tavily searches and aggregates results
// ============================================================================
function researcherNode(state) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const tvly = (0, core_1.tavily)({ apiKey });
        const allResults = [];
        try {
            for (const query of state.searchQueries) {
                console.log(`  🔎 Searching: "${query}"`);
                const response = yield tvly.search(query, {
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
        }
        catch (error) {
            console.error("❌ [RESEARCHER] Error:", error);
            return { researchContext: "Research unavailable - proceeding with general knowledge." };
        }
    });
}
// ============================================================================
// NODE 3: PLANNER
// Generates structured blog outline
// ============================================================================
function plannerNode(state) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
            const response = yield ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            sections: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        title: { type: genai_1.Type.STRING },
                                        instructions: { type: genai_1.Type.STRING },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const result = JSON.parse(response.text || '{"sections":[]}');
            console.log(`✅ [PLANNER] Created ${((_a = result.sections) === null || _a === void 0 ? void 0 : _a.length) || 0} sections`);
            (result.sections || []).forEach((section, i) => {
                console.log(`  ${i + 1}. ${section.title}`);
            });
            return { blogPlan: result.sections || [] };
        }
        catch (error) {
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
    });
}
// ============================================================================
// NODE 4: WRITER/REDUCER
// Generates content for each section and combines them
// ============================================================================
function writerNode(state) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("✍️  [WRITER] Generating blog content...");
        const ai = getGeminiClient();
        const sections = [];
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
                const response = yield ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: prompt,
                });
                const content = response.text || "";
                sections.push(content);
            }
            catch (error) {
                console.error(`❌ [WRITER] Error writing section "${section.title}":`, error);
                sections.push(`<h2>${section.title}</h2>\n<p>Content generation failed for this section.</p>`);
            }
        }
        const finalContent = sections.join("\n\n");
        console.log(`✅ [WRITER] Generated ${finalContent.length} characters`);
        return { finalContent };
    });
}
// ============================================================================
// CONDITIONAL EDGE LOGIC
// ============================================================================
function shouldResearch(state) {
    return state.needsResearch ? "researcher" : "planner";
}
// ============================================================================
// BUILD THE GRAPH
// ============================================================================
// Define the state annotation for the graph
const GraphState = langgraph_1.Annotation.Root({
    topic: (langgraph_1.Annotation),
    needsResearch: (langgraph_1.Annotation),
    searchQueries: (langgraph_1.Annotation),
    researchContext: (langgraph_1.Annotation),
    blogPlan: (langgraph_1.Annotation),
    finalContent: (langgraph_1.Annotation),
});
const workflow = new langgraph_1.StateGraph(GraphState)
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
    .addEdge("writer", langgraph_1.END);
const blogGraph = workflow.compile();
// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================
// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================
function generateAgenticDraft(topic) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
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
            const result = yield blogGraph.invoke(initialState);
            console.log("\n✅ ====== BLOG GENERATION COMPLETE ======");
            console.log("📊 Stats:");
            console.log(`  - Research: ${result.needsResearch ? 'YES' : 'NO'}`);
            console.log(`  - Sections: ${((_a = result.blogPlan) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
            console.log(`  - Length: ${((_b = result.finalContent) === null || _b === void 0 ? void 0 : _b.length) || 0} chars`);
            console.log("=".repeat(50) + "\n");
            return result.finalContent || "";
        }
        catch (error) {
            console.error("\n❌ ====== BLOG GENERATION FAILED ======");
            console.error("Error:", error);
            console.error("=".repeat(50) + "\n");
            throw new Error(`Agentic blog generation failed: ${error.message}`);
        }
    });
}
/**
 * Generator function that streams progress logs and final content
 * Used for real-time frontend updates
 */
function generateAgenticDraftStream(topic) {
    return __asyncGenerator(this, arguments, function* generateAgenticDraftStream_1() {
        var _a, e_1, _b, _c;
        const initialState = {
            topic,
            needsResearch: false,
            searchQueries: [],
            researchContext: "",
            blogPlan: [],
            finalContent: "",
        };
        yield yield __await({ type: 'log', message: `🚀 Initializing Agentic Workflow for: "${topic}"` });
        let finalContent = "";
        try {
            const stream = yield __await(blogGraph.stream(initialState));
            try {
                for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield __await(stream_1.next()), _a = stream_1_1.done, !_a; _d = true) {
                    _c = stream_1_1.value;
                    _d = false;
                    const chunk = _c;
                    const nodeName = Object.keys(chunk)[0];
                    const state = chunk[nodeName];
                    if (nodeName === 'router') {
                        yield yield __await({ type: 'log', message: `🔀 [ROUTER] Analyzed topic. Research needed: ${state.needsResearch ? 'YES' : 'NO'}` });
                        if (state.needsResearch) {
                            yield yield __await({ type: 'log', message: `📋 [ROUTER] Generated search queries: ${state.searchQueries.join(', ')}` });
                        }
                    }
                    else if (nodeName === 'researcher') {
                        if (state.researchContext) {
                            yield yield __await({ type: 'log', message: `🔍 [RESEARCHER] Gathered research data.` });
                        }
                        else {
                            yield yield __await({ type: 'log', message: `⏭️ [RESEARCHER] Skipped research phase.` });
                        }
                    }
                    else if (nodeName === 'planner') {
                        yield yield __await({ type: 'log', message: `📝 [PLANNER] Created valid blog outline with ${state.blogPlan.length} sections.` });
                        const sections = state.blogPlan || [];
                        for (let i = 0; i < sections.length; i++) {
                            yield yield __await({ type: 'log', message: `  - Section ${i + 1}: ${sections[i].title}` });
                        }
                    }
                    else if (nodeName === 'writer') {
                        // Determine if this is the final output
                        // In LangGraph, the writer output should contain the finalContent
                        if (state.finalContent) {
                            finalContent = state.finalContent;
                            yield yield __await({ type: 'log', message: `✍️ [WRITER] Draft generation complete. Length: ${finalContent.length} chars.` });
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = stream_1.return)) yield __await(_b.call(stream_1));
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (finalContent) {
                yield yield __await({ type: 'result', content: finalContent });
            }
            else {
                yield yield __await({ type: 'error', message: "Failed to generate content (empty output)" });
            }
        }
        catch (error) {
            yield yield __await({ type: 'error', message: `❌ Error: ${error.message}` });
            throw error;
        }
    });
}
