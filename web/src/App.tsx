// 파일: web/src/App.tsx
// 역할: 메인 앱 — 2D 대시보드 / 3D 뷰 탭 전환
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "./config";
import { useMachineStore, Machine } from "./stores/machineStore";
import { useWebSocket } from "./hooks/useWebSocket";
import { MachineCard } from "./components/MachineCard";
import { ControlPanel } from "./components/ControlPanel";
import { AlarmPanel } from "./components/AlarmPanel";
import { FactoryScene } from "./components/scene/FactoryScene";

function App() {
  const { machines, setMachines } = useMachineStore();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "3d">("dashboard");
  // ✅ 추가
  const [agentPaused, setAgentPaused] = useState(false);
  useWebSocket((paused) => setAgentPaused(paused));

  useEffect(() => {
    axios.get(`${API_URL}/machines`)
      .then((res) => setMachines(res.data.machines))
      .catch((err) => console.error("기계 목록 조회 실패", err));
  }, []);

  // ✅ 추가: 초기 Agent 상태 조회
  useEffect(() => {
    axios.get(`${API_URL}/control/agent/status`)
      .then((res) => setAgentPaused(res.data.paused))
      .catch((err) => console.error("Agent 상태 조회 실패", err));
  }, []);

  // ✅ 추가: 토글 핸들러
  const toggleAgent = async () => {
    try {
      const res = await axios.post(`${API_URL}/control/agent/toggle`);
      setAgentPaused(res.data.paused);
    } catch (err) {
      console.error("Agent 토글 실패", err);
    }
  };

  const currentMachine = selectedMachine
    ? machines[selectedMachine.machine_id]
    : null;

  const machineList = Object.values(machines);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-wrap justify-between items-center gap-y-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            🏭 Factory Digital Twin
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            기계 {machineList.length}대 모니터링 중
          </p>
        </div>

        {/* 탭 + Agent 제어 버튼 */}
        <div className="flex gap-2 items-center flex-wrap justify-end">
          {/* Agent 토글 버튼 */}
          <button
            onClick={toggleAgent}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              agentPaused
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            <span className="hidden sm:inline">{agentPaused ? "▶ Agent 재개" : "⏸ Agent 정지"}</span>
            <span className="sm:hidden">{agentPaused ? "▶ 재개" : "⏸ 정지"}</span>
          </button>

          {/* 구분선 */}
          <div className="w-px h-6 bg-gray-300" />

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-2 rounded-lg font-medium text-sm ${
              activeTab === "dashboard"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className="hidden sm:inline">📊 대시보드</span>
            <span className="sm:hidden">📊</span>
          </button>
          <button
            onClick={() => setActiveTab("3d")}
            className={`px-3 py-2 rounded-lg font-medium text-sm ${
              activeTab === "3d"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className="hidden sm:inline">🏭 3D 뷰</span>
            <span className="sm:hidden">🏭</span>
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">

        {/* 대시보드 탭 */}
        {activeTab === "dashboard" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              {machineList.length === 0 ? (
                <p className="text-gray-400">기계 데이터 불러오는 중...</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {machineList.map((machine) => (
                    <div
                      key={machine.machine_id}
                      onClick={() => setSelectedMachine(machine)}
                      className="cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-lg"
                    >
                      <MachineCard machine={machine} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <AlarmPanel />
          </div>
        )}

        {/* 3D 뷰 탭 */}
        {activeTab === "3d" && (
          <div className="flex-1">
            <FactoryScene />
          </div>
        )}
      </div>

      {/* 제어 패널 */}
      {currentMachine && activeTab === "dashboard" && (
        <ControlPanel
          machine={currentMachine}
          onClose={() => setSelectedMachine(null)}
        />
      )}
    </div>
  );
}

export default App;