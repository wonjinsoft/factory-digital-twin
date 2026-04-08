// 파일: web/src/pages/AdminPage.tsx
// 역할: 관리자 패널 — 사용자 승인/거부 + 디바이스 관리
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

interface DeviceRow {
  device_id: string;
  device_type: string;
  flash: string;
  battery: string;
  online: string;
  last_updated: string;
}

type Tab = "users" | "devices";

export function AdminPage() {
  const { token, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");

  // 사용자 관련
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userFilter, setUserFilter] = useState("pending");
  const [userLoading, setUserLoading] = useState(false);

  // 디바이스 관련
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [deviceLoading, setDeviceLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users?status=${userFilter}`, { headers: authHeader });
      setUsers(res.data);
    } catch { navigate("/login"); }
    finally { setUserLoading(false); }
  };

  const fetchDevices = async () => {
    setDeviceLoading(true);
    try {
      const res = await axios.get(`${API_URL}/devices`);
      setDevices(res.data.devices);
    } finally { setDeviceLoading(false); }
  };

  useEffect(() => { if (tab === "users") fetchUsers(); }, [userFilter, tab]);
  useEffect(() => { if (tab === "devices") fetchDevices(); }, [tab]);

  const userAction = async (userId: number, type: "approve" | "reject") => {
    await axios.post(`${API_URL}/admin/users/${userId}/${type}`, {}, { headers: authHeader });
    fetchUsers();
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm(`${deviceId} 를 삭제할까요?`)) return;
    await axios.delete(`${API_URL}/devices/${deviceId}`);
    fetchDevices();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🔑 관리자 패널</h1>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate("/")} className="text-sm text-blue-500 hover:underline">← 대시보드</button>
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button onClick={clearAuth} className="text-sm text-red-400 hover:underline">로그아웃</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* 메인 탭 */}
        <div className="flex gap-2 mb-6">
          {(["users", "devices"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50 border"
              }`}
            >
              {t === "users" ? "👤 사용자" : "📱 디바이스"}
            </button>
          ))}
        </div>

        {/* 사용자 탭 */}
        {tab === "users" && (
          <>
            <div className="flex gap-2 mb-4">
              {["pending", "approved", "rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => setUserFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    userFilter === s ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50 border"
                  }`}
                >
                  {s === "pending" ? "대기" : s === "approved" ? "승인됨" : "거부됨"}
                </button>
              ))}
            </div>
            {userLoading ? (
              <p className="text-gray-400 text-center py-8">불러오는 중...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-400 text-center py-8">해당 항목이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    {u.picture && <img src={u.picture} alt="" className="w-10 h-10 rounded-full" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                      <p className="text-sm text-gray-500 truncate">{u.email}</p>
                      <p className="text-xs text-gray-400">{u.oauth_provider} · {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    {userFilter === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => userAction(u.id, "approve")} className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg">승인</button>
                        <button onClick={() => userAction(u.id, "reject")} className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg">거부</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 디바이스 탭 */}
        {tab === "devices" && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={fetchDevices} className="text-sm text-blue-500 hover:underline">↻ 새로고침</button>
            </div>
            {deviceLoading ? (
              <p className="text-gray-400 text-center py-8">불러오는 중...</p>
            ) : devices.length === 0 ? (
              <p className="text-gray-400 text-center py-8">등록된 디바이스가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {devices.map((d) => (
                  <div key={d.device_id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <span className="text-2xl">📱</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{d.device_id}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span className={d.online === "true" ? "text-green-500 font-medium" : "text-gray-400"}>
                          {d.online === "true" ? "● 온라인" : "○ 오프라인"}
                        </span>
                        <span>플래시: {d.flash}</span>
                        <span>배터리: {d.battery}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        최근 보고: {d.last_updated ? new Date(d.last_updated).toLocaleString() : "없음"}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDevice(d.device_id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
