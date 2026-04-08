// 파일: web/src/pages/AuthCallbackPage.tsx
// 역할: OAuth 콜백 — URL에서 token 추출 → 유저 정보 조회 → 상태별 리다이렉트
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import { useAuthStore } from "../stores/authStore";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const status = params.get("status");

    if (!token) {
      navigate("/login");
      return;
    }

    // 유저 정보 조회
    axios
      .get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setAuth(token, res.data);
        if (status === "approved") {
          navigate("/");
        } else {
          navigate("/pending");
        }
      })
      .catch(() => navigate("/login"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-lg">로그인 처리 중...</p>
    </div>
  );
}
