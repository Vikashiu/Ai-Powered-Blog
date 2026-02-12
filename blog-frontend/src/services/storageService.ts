import type { BlogPost, Comment } from "../types";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const storageService = {
  getPosts: async (): Promise<BlogPost[]> => {
    try {
      const res = await fetch(`${API_URL}/posts`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  getPostById: async (id: string): Promise<BlogPost | undefined> => {
    try {
      const res = await fetch(`${API_URL}/posts/${id}`);
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error('Failed to fetch post');
      return res.json();
    } catch (error) {
      console.error(error);
      return undefined;
    }
  },

  savePost: async (post: BlogPost): Promise<BlogPost> => {
    // Try to update first
    const updateRes = await fetch(`${API_URL}/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });

    if (updateRes.ok) {
      return updateRes.json();
    }

    // If update failed (e.g. 404 or backend threw error because ID didn't exist), try Create
    // Note: Backend createPost ignores passed ID and generates new one, which is standard.
    const createRes = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });

    if (!createRes.ok) throw new Error('Failed to save post');
    return createRes.json();
  },

  deletePost: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`);
      if (!res.ok) return [];
      return res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  addComment: async (comment: Comment): Promise<Comment> => {
    const res = await fetch(`${API_URL}/posts/${comment.postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  }
};
