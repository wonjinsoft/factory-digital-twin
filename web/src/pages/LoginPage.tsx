// 파일: web/src/pages/LoginPage.tsx
// 역할: 로그인 페이지 — Google / Kakao OAuth 버튼
import { API_URL } from "../config";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">🏭 Factory Digital Twin</h1>
          <p className="text-gray-400 text-sm mt-2">계정으로 로그인하세요</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          {/* Google 로그인 */}
          <a
            href={`${API_URL}/auth/google`}
            className="flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Google로 로그인
          </a>

          {/* Kakao 로그인 */}
          <a
            href={`${API_URL}/auth/kakao`}
            className="flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <span className="text-lg">💬</span>
            카카오로 로그인
          </a>
        </div>

        <p className="text-gray-500 text-xs text-center">
          로그인 후 관리자 승인이 필요합니다.
        </p>
      </div>
    </div>
  );
}
