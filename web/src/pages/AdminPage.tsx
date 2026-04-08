// 파일: web/src/pages/AdminPage.tsx
// 역할: 관리자 패널 — 가입 대기 목록 + 승인/거부
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import { useAuthStore } from "../stores/authStore";

interface UserRow {
  id: number;
  email: string;
  name: string;
  picture?: string;
  role: string;
  status: string;
  oauth_provider: string;
  created_at: string;
}

export function AdminPage() {
  const { token, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users?status=${filter}`, {
        headers: authHeader,
      });
      setUsers(res.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const action = async (userId: number, type: "approve" | "reject") => {
    await axios.post(`${API_URL}/admin/users/${userId}/${type}`, {}, { headers: authHeader });
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🔑 관리자 패널</h1>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate("/")} className="text-sm text-blue-500 hover:underline">
            ← 대시보드
          </button>
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button onClick={clearAuth} className="text-sm text-red-400 hover:underline">
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* 필터 탭 */}
        <div className="flex gap-2 mb-4">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === s
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border"
              }`}
            >
              {s === "pending" ? "대기" : s === "approved" ? "승인됨" : "거부됨"}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <p className="text-gray-400 text-center py-8">불러오는 중...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-400 text-center py-8">해당 항목이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
                {u.picture && (
                  <img src={u.picture} alt="" className="w-10 h-10 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                  <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">{u.oauth_provider} · {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                {filter === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => action(u.id, "approve")}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => action(u.id, "reject")}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg"
                    >
                      거부
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
