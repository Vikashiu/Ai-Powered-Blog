import axios from 'axios';
import type { User } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

class ApiService {
  client = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
    // Note: withCredentials is removed to avoid CORS conflicts
  });

  constructor() {
    // Automatically add the token to every request
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Optional: Global error handler
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error || error.message || 'Request failed';
        return Promise.reject(new Error(message));
      }
    );
  }

  // --- AUTH METHODS ---

  async login(credentials: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', credentials);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async signup(data: { email: string; name: string; password: string }) {
    const response = await this.client.post('/auth/signup', data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    const response = await this.client.get<{ user: User }>('/auth/me');
    return response.data;
  }

  // --- POST METHODS (Restored) ---

  async getPosts() {
    const response = await this.client.get('/posts');
    return response.data;
  }

  async getPost(id: string) {
    const response = await this.client.get(`/posts/${id}`);
    return response.data;
  }

  async createPost(data: any) {
    const response = await this.client.post('/posts', data);
    return response.data;
  }

  async updatePost(id: string, data: any) {
    const response = await this.client.put(`/posts/${id}`, data);
    return response.data;
  }

  async deletePost(id: string) {
    await this.client.delete(`/posts/${id}`);
    // 204 No Content response has no data
  }

  // --- COMMENT METHODS (Restored) ---

  async getComments(postId: string) {
    const response = await this.client.get(`/posts/${postId}/comments`);
    return response.data;
  }

  async createComment(postId: string, content: string) {
    const response = await this.client.post(`/posts/${postId}/comments`, { content });
    return response.data;
  }

  // --- UPLOAD METHODS ---

  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // --- TOKEN UTILS ---

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }
}

export const apiService = new ApiService();