import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: number;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userId: string, password: string) => Promise<boolean>;
  loginWithFace: (userId: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<string | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (userId: string, password: string) => {
    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, password }),
      });
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        set({ user: response.user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },
  loginWithFace: async (userId: string) => {
    try {
      const response = await apiFetch('/login/face', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, verified: true }),
      });
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        set({ user: response.user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Face login failed:', error);
      return false;
    }
  },
  signup: async (data: SignupData) => {
    try {
      const response = await apiFetch('/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.user_id;
    } catch (error) {
      console.error('Signup failed:', error);
      return null;
    }
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, isAuthenticated: false });
  },
}));
