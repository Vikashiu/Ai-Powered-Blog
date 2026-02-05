# 🧠 Nexis Intelligence - AI-Powered Blogging Platform

**Nexis** is a next-generation blogging platform that integrates advanced AI agents to help creators draft, refine, and publish content autonomously. It features a modern, dark-themed UI and a powerful backend driven by **Google Gemini 1.5 Flash**.

---

## ✨ Key Features

### 🤖 **Agentic AI Writer**
- **Autonomous Drafting:** Click one button, and an AI agent (powered by **LangGraph**) plans, researches, and writes a full blog post for you.
- **Real-Time Terminal:** Watch the AI's "thought process" live in a hacker-style terminal overlay as it researches and writes.
- **Streaming Architecture:** Uses Server-Sent Events (SSE) for instant feedback.

### 🎨 **Multimodal AI Tools**
- **Magic Title:** Auto-generates SEO-friendly titles based on your content.
- **Smart Tags:** Analyzes your post to suggest relevant tags.
- **Content Refinement:** "Improve" button to rewrite sections for clarity, tone, or grammar.
- **Vision:** Upload images to analyze them or generate cover images from prompts.
- **Audio:** Transcribe audio notes or convert your blog post to speech.

### 💻 **Modern Tech Stack**
- **Frontend:** React (Vite), TailwindCSS, Framer Motion, Lucide Icons.
- **Backend:** Node.js, Express, TypeScript.
- **AI Core:** Google Gemini 1.5 Flash via Google GenAI SDK.
- **Agent Framework:** LangGraph.js + Tavily (for web research).
- **Database:** PostgreSQL (via Prisma ORM).
- **Storage:** Cloudinary (for images).
- **Authentication:** Custom JWT Auth.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Cloudinary Account
- API Keys: 
  - `GEMINI_API_KEY` (Google AI Studio)
  - `TAVILY_API_KEY` (Tavily Search)

### 1. Backend Setup

```bash
cd blog-backend
npm install
```

**Environment Variables (`blog-backend/.env`):**
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/blogdb"
JWT_SECRET="your_secret_key"
GEMINI_API_KEY="your_google_ai_key"
TAVILY_API_KEY="your_tavily_key"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

**Run Database Migrations:**
```bash
npm run prisma:generate
npm run prisma:push
```

**Start the Server:**
```bash
npm run dev
# or
npm run start
```

### 2. Frontend Setup

```bash
cd blog-frontend
npm install
```

**Run the Frontend:**
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧭 Application Structure

```
d:/blog1/
├── blog-backend/           # Express API & AI Agents
│   ├── src/
│   │   ├── agents/         # LangGraph workflows (blogGraph.ts)
│   │   ├── controllers/    # API Controllers (aiController, postController)
│   │   ├── routes/         # Express Routes
│   │   └── index.ts        # Server Entry
│   └── prisma/             # Database Schema
│
├── blog-frontend/          # React App
│   ├── src/
│   │   ├── components/     # UI Components (RichEditor, Terminal, Sidebar)
│   │   ├── pages/          # Pages (EditorPage, BlogList, Dashboard)
│   │   ├── services/       # API Services (apiService, geminiService)
│   │   └── types/          # TypeScript Interfaces
│   └── index.css           # Global Styles & Tailwind
│
└── README.md               # You are here
```

---

## 🎮 How to Use

1.  **Sign Up/Login:** Create an account to access the dashboard.
2.  **Create Post:** Click "Write" to open the Editor.
3.  **Autonomous Draft:**
    - Enter a topic/title.
    - Click **"AUTONOMOUS DRAFT"**.
    - Watch the terminal logs as the agent performs research and writing.
4.  **Edit & Polish:** Use the Rich Text Editor to finalize your content.
5.  **Publish:** Save as Draft, Schedule, or Publish immediately.

---

## 🛠️ Recent Updates
- **v2.1:** Added real-time streaming logs for AI generation.
- **v2.0:** Migrated UI to Dark Mode & added "Zen Mode" editor.
- **v1.5:** Integrated LangGraph for agentic workflows.

---

