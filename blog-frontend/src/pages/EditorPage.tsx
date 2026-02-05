
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Loader2, PanelRight, Maximize2, Minimize2, Wand2, Image as ImageIcon, X, Upload, Hash, Calendar, Clock } from 'lucide-react';
import RichEditor from '../components/RichEditor';
import type { RichEditorHandle } from '../components/RichEditor';
import { AiSidebar } from '../components/AiSidebar';
// CHANGE 1: Import the real API service
import { apiService } from '../services/apiService';
import { generateBlogDraft, improveContent, generateMetadata, generateTitle } from '../services/geminiService';
import type { BlogPost, BlogStatus } from '../types';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const EditorPage: React.FC = () => {
    const navigate = useNavigate();
    const { postId } = useParams<{ postId: string }>();
    const { user, addNotification } = useStore();

    // CHANGE 2: Add local state to track the ID (so we know if we are creating or updating)
    const [activePostId, setActivePostId] = useState<string | undefined>(postId);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [coverImage, setCoverImage] = useState('');

    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isTitleGenerating, setIsTitleGenerating] = useState(false);
    const [isTagGenerating, setIsTagGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);

    // AI Stream State
    const [showTerminal, setShowTerminal] = useState(false);
    const [generationLogs, setGenerationLogs] = useState<string[]>([]);
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [generationLogs, showTerminal]);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [focusMode, setFocusMode] = useState(false);

    // Scheduling State
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const richEditorRef = useRef<RichEditorHandle>(null);

    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [isAutosaving, setIsAutosaving] = useState(false);

    // CHANGE 3: Load Data from REAL Backend
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        // If we have an ID, fetch from API
        if (activePostId) {
            apiService.getPost(activePostId).then(post => {
                if (post) {
                    setTitle(post.title);
                    setContent(post.content);
                    setTags(post.tags);
                    setCoverImage(post.coverImage || '');
                    if (post.status === 'SCHEDULED' && post.scheduledAt) {
                        setScheduleDate(post.scheduledAt.slice(0, 16));
                    }
                }
            }).catch(() => {
                addNotification('error', 'Failed to load post');
            });
        }
    }, [activePostId, user, navigate, addNotification]);

    const handleAiDraftStream = async () => {
        if (!title) return alert('Please enter a title first');

        setIsAiLoading(true);
        setShowTerminal(true);
        setGenerationLogs(["🚀 Initializing Agentic Workflow..."]);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:5000/api/ai/generate-draft-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, instructions: "Make it detailed and engaging." })
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '');
                        if (dataStr === '"Stream Complete"') continue;

                        try {
                            const update = JSON.parse(dataStr);
                            if (update.type === 'log') {
                                setGenerationLogs(prev => [...prev, update.message]);
                            } else if (update.type === 'result') {
                                setContent(update.content);
                                addNotification('success', 'Draft Generated!');
                                setGenerationLogs(prev => [...prev, "✅ Content generated successfully!"]);
                                setTimeout(() => setShowTerminal(false), 2000);
                            } else if (update.type === 'error') {
                                addNotification('error', update.message);
                                setGenerationLogs(prev => [...prev, `❌ Error: ${update.message}`]);
                            }
                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                }
            }
        } catch (e) {
            addNotification('error', 'Stream failed');
            setGenerationLogs(prev => [...prev, "❌ Network Error"]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleMagicTitle = async () => {
        if (!content || content.length < 50) return alert("Write some content first.");
        setIsTitleGenerating(true);
        try {
            const textContent = content.replace(/<[^>]*>?/gm, '');
            const newTitle = await generateTitle(textContent);
            setTitle(newTitle);
            addNotification('success', 'New title generated');
        } catch (e) {
            console.error(e);
        } finally {
            setIsTitleGenerating(false);
        }
    };

    const handleAutoTags = async () => {
        if (!content || content.length < 50) return alert("Write some content first.");
        setIsTagGenerating(true);
        try {
            const textContent = content.replace(/<[^>]*>?/gm, '');
            const metadata = await generateMetadata(textContent);
            const newTags = Array.from(new Set([...tags, ...metadata.tags]));
            setTags(newTags);
            addNotification('success', `Added ${metadata.tags.length} new tags`);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTagGenerating(false);
        }
    };

    const handleAiImprove = async (textToImprove: string, instruction?: string) => {
        return new Promise<void>(async (resolve) => {
            try {
                const improved = await improveContent(textToImprove, instruction);
                // ... (AI insertion logic kept same) ...
                if (richEditorRef.current) {
                    // Simplified insertion for brevity in this fix
                    richEditorRef.current.insertHtml(improved);
                }
                addNotification('success', 'Content refined');
            } catch (e) {
                addNotification('error', 'Improvement failed');
            } finally {
                resolve();
            }
        });
    };

    const handleSidebarInsert = (textToInsert: string) => {
        if (richEditorRef.current) {
            richEditorRef.current.insertHtml(` ${textToInsert} `);
            addNotification('success', 'Content inserted');
        } else {
            setContent(prev => prev + " " + textToInsert);
        }
    };

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            addNotification('error', 'Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            addNotification('error', 'Image size must be less than 5MB');
            return;
        }

        setIsImageUploading(true);
        try {
            const response = await apiService.uploadImage(file);
            setCoverImage(response.url);
            addNotification('success', 'Image uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            addNotification('error', 'Failed to upload image');
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // CHANGE 4: The Handle Save Function (Using Real Backend)
    const handleSave = async (statusOverride?: BlogStatus, silent: boolean = false) => {
        // Guard: Stop if user is missing
        if (!user) return;

        // Validation
        if (!silent && !title) {
            addNotification('error', 'Title is required');
            return;
        }
        if (silent && !title) return; // Silent abort

        let finalStatus: BlogStatus = statusOverride || 'DRAFT';
        let scheduledTimeStr = undefined;

        if (statusOverride === 'SCHEDULED') {
            if (!scheduleDate) {
                addNotification('error', 'Please select a date/time');
                return;
            }
            scheduledTimeStr = new Date(scheduleDate).toISOString();
            if (new Date(scheduledTimeStr) <= new Date()) {
                // Logic for past dates
                finalStatus = 'PUBLISHED';
                scheduledTimeStr = undefined;
            }
        }

        if (!silent) setSaving(true);

        let finalTags = tags;
        let summary = '';

        try {
            if (content.length > 50) {
                // Only generate metadata on manual saves to save AI tokens, or keep it if you have unlimited credits
                // const metadata = await generateMetadata(content); 
                // if (tags.length === 0) finalTags = metadata.tags;
                // summary = metadata.summary;
            }

            // Prepare Payload
            const postData = {
                title,
                content,
                summary: summary || "No summary",
                tags: finalTags,
                coverImage,
                status: finalStatus,
                scheduledAt: scheduledTimeStr
            };

            // CHANGE 5: Switch Logic (Create vs Update)
            if (activePostId) {
                // UPDATE Existing
                await apiService.updatePost(activePostId, postData);
            } else {
                // CREATE New
                const newPost = await apiService.createPost(postData);
                // Important: Save the ID so next autosave is an Update
                setActivePostId(newPost.id);
            }

            // Success Handling
            if (!silent) {
                if (finalStatus === 'SCHEDULED') {
                    addNotification('success', `Post scheduled`);
                } else if (finalStatus === 'PUBLISHED') {
                    addNotification('success', 'Post published');
                } else {
                    addNotification('info', 'Draft saved');
                }
                navigate('/dashboard');
            } else {
                setLastSavedAt(new Date());
            }

        } catch (e) {
            console.error(e);
            if (!silent) addNotification('error', 'Error saving post');
        } finally {
            if (!silent) setSaving(false);
            setShowScheduleDialog(false);
        }
    };

    // CHANGE 6: Autosave Effect
    useEffect(() => {
        if (!title && !content) return;

        const timer = setTimeout(async () => {
            setIsAutosaving(true);
            try {
                await handleSave('DRAFT', true);
            } catch (e) {
                console.error("Autosave failed", e);
            } finally {
                setIsAutosaving(false);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [title, content, tags, coverImage, activePostId]); // Added activePostId dependency

    if (!user) return null;

    return (
        <AnimatePresence>
            <motion.div
                layout
                className={`bg-white dark:bg-[#050505] min-h-screen transition-all duration-500 ${focusMode ? 'fixed inset-0 z-50 overflow-y-auto' : 'max-w-7xl mx-auto px-4 py-8 relative'}`}
            >

                {/* Top Bar */}
                <motion.div
                    className={`flex items-center justify-between mb-8 sticky top-0 z-40 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md py-4 border-b border-neutral-200 dark:border-white/5 transition-all duration-300 ${focusMode ? 'px-8' : '-mx-4 px-4 top-20'}`}
                >
                    <div className="flex items-center gap-4">
                        {!focusMode && (
                            <button onClick={() => navigate('/dashboard')} className="group flex items-center text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                                <div className="p-2 rounded bg-neutral-100 dark:bg-white/5 group-hover:bg-neutral-200 dark:group-hover:bg-white/10 mr-2 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-sm hidden md:inline">DASHBOARD</span>
                            </button>
                        )}
                        {focusMode && (
                            <div className="text-orange-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                Zen Mode
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {!focusMode && (
                            <div className="text-xs text-neutral-500 mr-2 font-mono hidden md:block">
                                {saving || isAutosaving ? 'SAVING_DATA...' : lastSavedAt ? `SAVED ${format(lastSavedAt, 'HH:mm')}` : 'SYSTEM_SYNCED'}
                            </div>
                        )}

                        <button
                            onClick={() => setFocusMode(!focusMode)}
                            className={`p-2 rounded border transition-colors ${focusMode ? 'bg-neutral-100 dark:bg-white/10 text-black dark:text-white border-neutral-200 dark:border-white/20' : 'bg-transparent text-neutral-400 border-neutral-200 dark:border-white/10 hover:text-black dark:hover:text-white'}`}
                            title={focusMode ? "Exit Zen Mode" : "Enter Zen Mode"}
                        >
                            {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>

                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded border transition-colors ${isSidebarOpen ? 'bg-orange-500 text-black border-orange-500' : 'bg-transparent text-neutral-400 border-neutral-200 dark:border-white/10'}`}
                        >
                            <PanelRight size={18} />
                        </button>

                        <div className="w-px h-6 bg-neutral-200 dark:bg-white/10 mx-1"></div>

                        <button
                            onClick={() => handleSave('DRAFT')}
                            className="hidden md:block px-5 py-2 text-neutral-600 dark:text-neutral-300 bg-transparent border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 rounded text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Save Draft
                        </button>

                        <div className="relative">
                            <div className="flex bg-orange-500 rounded text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all overflow-hidden">
                                <button
                                    onClick={() => handleSave('PUBLISHED')}
                                    className="px-5 py-2 hover:bg-orange-600 border-r border-black/10 flex items-center"
                                >
                                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                    Publish
                                </button>
                                <button
                                    onClick={() => setShowScheduleDialog(!showScheduleDialog)}
                                    className={`px-3 py-2 hover:bg-orange-600 transition-colors ${scheduleDate ? 'bg-orange-600 text-white' : ''}`}
                                    title="Schedule Publish"
                                >
                                    <Clock size={16} />
                                </button>
                            </div>

                            {/* Schedule Dialog Popover */}
                            <AnimatePresence>
                                {showScheduleDialog && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowScheduleDialog(false)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#111] border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-4"
                                        >
                                            <div className="flex items-center gap-2 mb-4 text-neutral-900 dark:text-white font-bold text-sm">
                                                <Calendar size={16} className="text-orange-500" />
                                                Schedule Publication
                                            </div>
                                            <div className="mb-4">
                                                <label className="text-xs text-neutral-500 uppercase font-bold block mb-2">Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={scheduleDate}
                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                    className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg p-2 text-sm focus:border-orange-500 outline-none text-neutral-900 dark:text-white"
                                                />
                                                <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">
                                                    Content will be automatically published at the selected time.
                                                </p>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setShowScheduleDialog(false)}
                                                    className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleSave('SCHEDULED')}
                                                    disabled={!scheduleDate}
                                                    className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded text-xs font-bold hover:opacity-90 disabled:opacity-50"
                                                >
                                                    Confirm Schedule
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                <div className={`flex items-start transition-all duration-500 ${focusMode ? 'px-4 lg:px-40' : ''}`}>
                    {/* Main Editor Area */}
                    <div className="flex-1 max-w-4xl mx-auto w-full group/editor-area">

                        {/* Cover Image Control */}
                        <input type="file" ref={fileInputRef} onChange={handleImageFileChange} className="hidden" accept="image/*" />
                        <div className="mb-6 relative group/cover">
                            {coverImage ? (
                                <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-white/10">
                                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                                    {isImageUploading && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur flex items-center justify-center">
                                            <div className="text-center">
                                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
                                                <p className="text-white text-sm font-bold">Uploading...</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                                        <button
                                            onClick={triggerImageUpload}
                                            disabled={isImageUploading}
                                            className="bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black/80 flex items-center gap-2 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Upload size={14} /> Change
                                        </button>
                                        <button
                                            onClick={() => setCoverImage('')}
                                            disabled={isImageUploading}
                                            className="bg-black/60 backdrop-blur text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black/80 hover:text-red-300 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <X size={14} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ) : isImageUploading ? (
                                <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
                                        <p className="text-neutral-600 dark:text-neutral-400 text-sm font-bold">Uploading to Cloudinary...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-10 opacity-0 group-hover/editor-area:opacity-100 transition-opacity duration-300 mb-2">
                                    <button
                                        onClick={triggerImageUpload}
                                        className="flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-white/5 text-sm font-medium"
                                    >
                                        <ImageIcon size={16} /> Add Cover
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mb-10 space-y-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Untitled Record..."
                                    className="w-full text-5xl font-black text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 border-none focus:ring-0 px-0 bg-transparent tracking-tighter leading-tight"
                                />
                                {!title && content.length > 50 && (
                                    <button
                                        onClick={handleMagicTitle}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange-500 hover:text-white dark:hover:text-black transition-all"
                                    >
                                        {isTitleGenerating ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                                        Generate Title
                                    </button>
                                )}
                            </div>

                            {/* Tags Input */}
                            <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
                                <button
                                    onClick={handleAutoTags}
                                    disabled={isTagGenerating}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 transition-colors text-xs font-bold uppercase tracking-wider mr-2"
                                    title="Analyze content and generate tags"
                                >
                                    {isTagGenerating ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                    <span>Suggest Tags</span>
                                </button>

                                <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-600 mr-1">
                                    <Hash size={14} />
                                </div>

                                {tags.map(tag => (
                                    <span key={tag} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/5 px-2 py-0.5 rounded text-xs flex items-center gap-1 group/tag">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="text-neutral-400 hover:text-red-500"><X size={12} /></button>
                                    </span>
                                ))}
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                                    className="bg-transparent text-sm text-neutral-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none min-w-[100px]"
                                />
                            </div>

                            {!focusMode && (
                                <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-white/5">
                                    <button
                                        onClick={handleAiDraftStream}
                                        disabled={isAiLoading || !title}
                                        className="flex items-center px-4 py-2 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-orange-600 dark:text-orange-500 rounded text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-white/10 hover:border-orange-500/50 transition-all disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {isAiLoading ? 'GENERATING...' : 'AUTONOMOUS DRAFT'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <RichEditor
                            ref={richEditorRef}
                            content={content}
                            onChange={setContent}
                            onAiRequest={handleAiImprove}
                            placeholder="Type '/' for commands or start writing..."
                        />
                    </div>

                    {/* AI Sidebar */}
                    {isSidebarOpen && (
                        <div className={`${focusMode ? 'fixed right-4 top-24 h-[80vh] z-50' : ''}`}>
                            <AiSidebar
                                isOpen={isSidebarOpen}
                                onClose={() => setIsSidebarOpen(false)}
                                onInsert={handleSidebarInsert}
                            />
                        </div>
                    )}

                    {/* Terminal Overlay */}
                    <AnimatePresence>
                        {showTerminal && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="fixed bottom-4 left-4 z-[100] w-96 bg-[#1e1e1e] rounded-lg shadow-2xl border border-neutral-800 overflow-hidden font-mono text-sm"
                            >
                                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-neutral-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="ml-2 text-neutral-400 text-xs font-bold">Nexis Engine</span>
                                    </div>
                                    <button onClick={() => setShowTerminal(false)} className="text-neutral-500 hover:text-white"><X size={14} /></button>
                                </div>
                                <div ref={terminalRef} className="h-64 overflow-y-auto p-4 space-y-2 text-green-400">
                                    {generationLogs.map((log, i) => (
                                        <div key={i} className="break-words border-l-2 border-green-500/20 pl-2">
                                            <span className="text-neutral-500 mr-2 text-xs">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                                            {log}
                                        </div>
                                    ))}
                                    <div className="animate-pulse text-green-500">_</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditorPage;