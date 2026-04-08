// 파일: web/src/pages/PendingPage.tsx
// 역할: 관리자 승인 대기 화면
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function PendingPage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="text-5xl">⏳</div>
        <div>
          <h2 className="text-xl font-bold text-white">승인 대기 중</h2>
          <p className="text-gray-400 text-sm mt-2">
            {user?.name}님, 관리자 승인 후 이용 가능합니다.
          </p>
          <p className="text-gray-500 text-xs mt-1">{user?.email}</p>
        </div>

        {/* 관리자만: 승인 패널 바로가기 */}
        {user?.role === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-xl w-full"
          >
            🔑 승인 관리 페이지로 이동
          </button>
        )}

        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-300 text-sm underline"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
