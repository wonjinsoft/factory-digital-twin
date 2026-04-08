// 파일: web/src/stores/authStore.ts
// 역할: 인증 상태 전역 스토어 (JWT 토큰 + 유저 정보)
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  picture?: string;
  role: string;    // "user" | "admin"
  status: string;  // "pending" | "approved" | "rejected"
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: "auth" }
  )
);
