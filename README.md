# 🚀 Nexis - Agentic AI Powered Blog Platform

Nexis is a cutting-edge, full-stack blogging platform that redefines content creation. It merges a **Notion-style rich text editor** with a **sophisticated Agentic AI workflow**, allowing users to research, plan, and write high-quality blog posts autonomously.

## 🌟 Key Highlights

-   **🤖 Agentic AI Writer**: A LangGraph-based multi-agent system that acts as a researcher, planner, and writer.
-   **📝 Advanced Rich Editor**: A block-based editor (like Notion) with drag-and-drop, slash commands, and bubble menus.
-   **🎨 Modern UI/UX**: Built with React, TailwindCSS, and Framer Motion for a smooth, premium experience.
-   **🔐 Secure Foundation**: Robust authentication and database architecture using PostgreSQL and Prisma.

---

## 🛠️ Feature Deep Dive

### 🤖 1. The Agentic AI Workflow
Unlike simple AI wrappers, Nexis uses a structured **Graph Neural Network** approach to content generation:
1.  **Router Agent**: Analyzes your topic to determine if live web research is required.
2.  **Researcher Agent** (Tavily API): If needed, browses the web to gather real-time facts, statistics, and recent developments.
3.  **Planner Agent**: Synthesizes research into a structured blog outline with chapters and key points.
4.  **Writer Agent**: systematically writes each section, ensuring coherence and depth, then compiles the final HTML.

### ✍️ 2. The Rich Text Editor
A "What You See Is What You Get" (WYSIWYG) editor built for power users:
-   **Slash Commands (`/`)**: Quickly insert headings, lists, quotes, code blocks, dividers, and media.
-   **Bubble Menu**: Highlight text to access quick formatting (Bold, Italic, Link, AI Improve).
-   **Drag & Drop**: Reorder any block (paragraph, image, heading) by dragging the handle on the left.
-   **Media Embeds**:
    -   **Images**: Drag & drop upload (powered by Cloudinary) or generate via AI.
    -   **Video**: Embed YouTube videos directly.
    -   **Galleries**: Create grid layouts for multiple images.
-   **Zen Mode**: Toggle a distraction-free full-screen writing interface.

### 🧠 3. AI-Assisted Tools
Beyond full drafts, the editor offers granular AI assistance:
-   **Magic Title**: Generates SEO-optimized titles based on your content.
-   **Auto-Tagging**: Analyzes your post to suggest relevant tags.
-   **Text Improvement**: Highlight any text and ask AI to "Fix grammar", "Make it punchy", or "Expand this".
-   **Image Generation**: Generate custom cover images or inline visuals using Google's Imagen model.

### 📊 4. Dashboard & Analytics
-   **Command Center**: View all your drafts, scheduled, and published posts in a sortable list.
-   **Status Tracking**: Visual badges for Draft, Scheduled, and Published states.
-   **Analytics UI**: A visual dashboard showing views, engagement rates, and reader trends (UI implementation).

### ⚙️ 5. Backend & Infrastructure
-   **REST API**: Robust Node.js/Express API with typed routes.
-   **Database**: PostgreSQL managed via Prisma ORM for type-safe database queries.
-   **Authentication**: JWT-based stateless authentication with secure cookie handling.
-   **Storage**: Cloudinary integration for optimized image hosting and delivery.

---

## 🏗️ Technical Architecture

### Frontend Stack
-   **Framework**: React (Vite)
-   **Language**: TypeScript
-   **Styling**: TailwindCSS, Autoprefixer
-   **Animations**: Framer Motion
-   **State Management**: Zustand
-   **Routing**: React Router v6
-   **Icons**: Lucide React
-   **HTTP Client**: Axios

### Backend Stack
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **AI Engines**:
    -   **LangChain / LangGraph**: Agent orchestration.
    -   **Google Gemini (2.5 Flash)**: LLM for reasoning and writing.
    -   **Tavily**: Search API for web research.
-   **Image Storage**: Cloudinary SDK

---

## 📋 Prerequisites

Before running the project, ensure you have:
1.  **Node.js** (v18+)
2.  **PostgreSQL** (Local or hosted like Supabase/Neon)
3.  **API Keys**:
    -   [Google AI Studio](https://aistudio.google.com/) (Gemini API)
    -   [Tavily](https://tavily.com/) (Search API)
    -   [Cloudinary](https://cloudinary.com/) (Image Storage)

---

## 🚀 Installation Guide

### 1. Clone & Install
```bash
git clone <repository-url>
cd blog1
```

### 2. Backend Setup
```bash
cd blog-backend
npm install
```
Create a `.env` file in `blog-backend/` with the following:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/blog_db?schema=public"

# Auth
JWT_SECRET=your_complex_secret_string

# AI Services
GEMINI_API_KEY=your_gemini_key
TAVILY_API_KEY=your_tavily_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```
Initialize the database:
```bash
npx prisma db push
npm run build # Generates Prisma Client
npm run dev
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd blog-frontend
npm install
npm run dev
```
Access the app at `http://localhost:5173`.

---

## 🎮 How to Use

1.  **Sign Up**: Create an account on the login page.
2.  **Create Post**: Click "Initialize New Draft" on the dashboard.
3.  **Agentic Draft**:
    -   Open the sidebar.
    -   Enter a topic (e.g., "Impact of Quantum Computing on Cryptography").
    -   Click "Autonomous Draft".
    -   Watch the terminal output as the agent researches and writes.
4.  **Manual Editing**: Use `/` to insert blocks or drag blocks to rearrange.
5.  **Publish**: Click "Save" -> "Publish" or schedule it for a later date.

---

## 📄 License
This project is licensed under the ISC License.
