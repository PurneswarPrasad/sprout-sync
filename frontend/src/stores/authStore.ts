import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      },
      
      setUser: (user: User) => {
        set({ user });
      },
      
      logout: () => {
        console.log('🔐 Auth store logout called');
        set({ token: null, user: null, isAuthenticated: false });
        // Also clear localStorage manually to ensure it's cleared
        localStorage.removeItem('auth-storage');
        console.log('✅ Auth state cleared');
      },
      
      clearAuth: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
