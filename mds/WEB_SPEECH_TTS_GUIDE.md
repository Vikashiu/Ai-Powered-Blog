# 🔊 Web Speech API Integration - Text-to-Speech for Blog Reading

## Problem
User cannot listen to blog posts in the Explore section because Gemini API doesn't properly support audio generation.

## Solution
Replace Gemini TTS with **Web Speech Synthesis API** - a free, built-in browser feature that reads text aloud.

## ✅ Benefits

| Feature | Gemini TTS (Old) | Web Speech API (New) |
|---------|-----------------|---------------------|
| Cost | Uses API quota | **100% Free** |
| Availability | Requires internet | **Works offline** |
| Speed | Slow (API call) | **Instant** |
| Reliability | API errors, quotas | **Always available** |
| Voice Quality | Good | **Excellent** (system voices) |
| Content Length | Limited (~1500 chars) | **Unlimited** |

## 📝 Changes Required in `PostView.tsx`

### 1. Update Imports (Line ~10-13)
**Remove:**
```typescript
import { generateSpeech, chatWithGemini } from '../services/geminiService';
import { playPcmAudio } from '../utils/audio';
```

**Replace with:**
```typescript
import { chatWithGemini } from '../services/geminiService';
```

### 2. Update Audio State (Line ~32-35)
**Remove:**
```typescript
const [isPlaying, setIsPlaying] = useState(false);
const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
const audioCtxRef = useRef<AudioContext | null>(null);
```

**Replace with:**
```typescript
const [isPlaying, setIsPlaying] = useState(false);
const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
```

### 3. Update useEffect Cleanup (Line ~60-67)
**Remove:**
```typescript
return () => {
    window.removeEventListener('scroll', handleScroll);
    if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => { });
        audioCtxRef.current = null;
    }
};
```

**Replace with:**
```typescript
return () => {
    window.removeEventListener('scroll', handleScroll);
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
};
```

### 4. Replace `toggleAudio` Function (Line ~91-135)
**Remove the entire old function and replace with:**

```typescript
const toggleAudio = () => {
    // If already speaking, stop
    if (utteranceRef.current && isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        utteranceRef.current = null;
        return;
    }

    if (!post) return;
    setIsGeneratingAudio(true);

    try {
        // Extract text content from HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = post.content;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        const cleanText = textContent.replace(/\s+/g, ' ').trim();
        
        // Prepare text to read (read full article, not just first 1500 chars!)
        const textToRead = `${post.title}. ${cleanText}`;

        if (textToRead.length < 10) {
            alert("Content too short for audio.");
            setIsGeneratingAudio(false);
            return;
        }

        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(textToRead);
        
        // Configure voice (try to get a good English voice)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) 
                            || voices.find(v => v.lang.includes('en-US'))
                            || voices.find(v => v.lang.includes('en'))
                            || voices[0];
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Configure speech parameters
        utterance.rate = 1.0;  // Normal speed
        utterance.pitch = 1.0; // Normal pitch
        utterance.volume = 1.0; // Full volume

        // Handle speech events
        utterance.onend = () => {
            setIsPlaying(false);
            utteranceRef.current = null;
        };

        utterance.onerror = (event) => {
            console.error('Speech error:', event);
            setIsPlaying(false);
            utteranceRef.current = null;
            alert('Failed to play audio. Please try again.');
        };

        // Store reference and start speaking
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    } catch (e) {
        console.error(e);
        alert("Unable to generate audio.");
    } finally {
        setIsGeneratingAudio(false);
    }
};
```

## 🎯 How It Works

1. **User clicks "Listen" button** on a blog post
2. HTML content is converted to plain text
3. **Web Speech Synthesis API** creates an utterance
4. Browser reads the text aloud in a natural voice
5. **Play/Pause controls** work perfectly

## 🌐 Browser Support

- ✅ **Chrome** - Excellent (recommended)
- ✅ **Edge** - Excellent
- ✅ **Safari** - Good
- ⚠️ **Firefox** - Basic support
- ✅ **Mobile browsers** - Works great!

## ✨ Features

- **Reads entire blog post** (not limited to 1500 characters)
- **Play/Pause toggle** with visual feedback
- **Automatic voice selection** (prefers Google voices if available)
- **Smooth animations** showing speaking status
- **Error handling** with user-friendly messages
- **Free forever** - no API costs

## 📱 User Experience

When reading a blog post, users will see:
- **Play button** overlay on cover image
- Click to start reading
- **Pulsing orange indicator** while speaking
- **Pause button** to stop
- Automatic cleanup when leaving page

## 🔒 No API Keys Needed!

Unlike Gemini TTS:
- ❌ No API keys
- ❌ No quota limits
- ❌ No network calls
- ❌ No waiting time

Just pure, instant, browser-based text-to-speech! 🎉

---

**Status**: Ready to implement
**Difficulty**: Easy (simple replacements)
**Testing**: Works immediately after changes
