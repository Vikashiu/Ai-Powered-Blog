import { create } from 'zustand';
import type { User, BlogPost, Notification } from '../types';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
// import type { View } from '../types';
interface AppState {
  // Auth Slice
  user: User | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Blog Slice
  posts: BlogPost[];
  isLoadingPosts: boolean;
  fetchPosts: () => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  // UI Slice
  activeView: string;
  setActiveView: (view: string, postId?: string) => void;
  currentPostId: string | undefined;

  // Notification Slice
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Theme Slice
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // --- Auth ---
  user: null,
  isLoadingAuth: true,

  checkAuth: async () => {
    try {
      if (apiService.isAuthenticated()) {
        const { user } = await apiService.getCurrentUser();
        set({ user, isLoadingAuth: false });
      } else {
        set({ user: null, isLoadingAuth: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      apiService.clearToken();
      set({ user: null, isLoadingAuth: false });
    }

    // Init theme state from DOM
    const storedTheme = localStorage.getItem("nexis_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const theme =
      storedTheme === "dark" || (!storedTheme && prefersDark)
        ? "dark"
        : "light";

    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },

  login: async (email: string, password: string) => {
    set({ isLoadingAuth: true });
    try {
      const { user } = await apiService.login({ email, password });
      set({ user, isLoadingAuth: false });
      get().addNotification('success', `Welcome back, ${user.name}`);
    } catch (error: any) {
      set({ isLoadingAuth: false });
      get().addNotification('error', error.message || 'Login failed');
      throw error;
    }
  },

  signup: async (email: string, name: string, password: string) => {
    set({ isLoadingAuth: true });
    try {
      const { user } = await apiService.signup({ email, name, password });
      set({ user, isLoadingAuth: false });
      get().addNotification('success', `Welcome, ${user.name}!`);
    } catch (error: any) {
      set({ isLoadingAuth: false });
      get().addNotification('error', error.message || 'Signup failed');
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiService.logout();
      set({ user: null, activeView: 'landing' });
      get().addNotification('info', 'You have been logged out');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state anyway
      apiService.clearToken();
      set({ user: null, activeView: 'landing' });
    }
  },

  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    set({ user: updatedUser });
    get().addNotification('success', 'Profile updated successfully');
  },

  // --- Blog ---
  posts: [],
  isLoadingPosts: false,

  fetchPosts: async () => {
    // Always fetch fresh data to ensure new posts appear immediately
    set({ isLoadingPosts: true });
    try {
      const data = await apiService.getPosts();
      set({ posts: data, isLoadingPosts: false });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      set({ isLoadingPosts: false });
      get().addNotification('error', 'Failed to load posts');
    }
  },

  deletePost: async (id: string) => {
    try {
      await apiService.deletePost(id);
      set(state => ({
        posts: state.posts.filter(p => p.id !== id)
      }));
      get().addNotification('success', 'Post deleted successfully');
    } catch (error) {
      console.error('Failed to delete post:', error);
      get().addNotification('error', 'Failed to delete post');
      throw error;
    }
  },

  // --- UI ---
  activeView: 'landing',
  currentPostId: undefined,
  setActiveView: (view: string, postId?: string) => {
    set({ activeView: view, currentPostId: postId });
    window.scrollTo(0, 0);
  },

  // --- Notifications ---
  notifications: [],
  addNotification: (type, message) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substring(2),
      type,
      message,
      timestamp: Date.now(),
      read: false
    };
    set(state => ({ notifications: [newNotification, ...state.notifications] }));

    // Auto dismiss from toast view (handled by component), but keep in history
  },
  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },

  // --- Theme ---
  theme: 'dark',
  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';

    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexis_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexis_theme', 'light');
    }
    set({ theme: next });
  }
}));
