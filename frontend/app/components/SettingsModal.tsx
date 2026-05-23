import { X, Plug, BrainCircuit, Bell, User, Hash, Mail, Monitor } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/app/lib/utils";
import { useTheme } from "next-themes";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("integrations");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const tabs = [
    { id: "integrations", label: "외부 연동", icon: Plug },
    { id: "appearance", label: "화면 설정", icon: Monitor },
    { id: "ai", label: "AI 설정", icon: BrainCircuit },
    { id: "notifications", label: "알림", icon: Bell },
    { id: "account", label: "계정", icon: User },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl flex overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Sidebar */}
        <div className="w-64 bg-slate-50 dark:bg-slate-800/50 p-6 border-r border-slate-100 dark:border-slate-800 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">설정</h2>
          <nav className="flex-1 space-y-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === "integrations" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#E5E0FA] dark:bg-[#4A154B]/30 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-[#4A154B] dark:text-[#E5E0FA]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">Slack</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">대화에서 작업을 자동으로 추출합니다.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-sm font-semibold rounded-lg transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-500/30">
                    연동됨
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">Gmail</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">이메일 수신함에서 액션 아이템을 추출합니다.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    연동하기
                  </button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">테마</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 border-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-all",
                        theme === "light" ? "border-indigo-600 dark:border-indigo-500" : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                      )}>
                      <div className="w-full h-16 bg-white border border-slate-200 rounded-md shadow-sm"></div>
                      <span className={cn("text-sm", theme === "light" ? "font-semibold text-indigo-700 dark:text-indigo-400" : "font-medium text-slate-600 dark:text-slate-400")}>라이트</span>
                    </button>
                    <button 
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 border-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-all",
                        theme === "dark" ? "border-indigo-600 dark:border-indigo-500" : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                      )}>
                      <div className="w-full h-16 bg-slate-900 border border-slate-700 rounded-md shadow-sm"></div>
                      <span className={cn("text-sm", theme === "dark" ? "font-semibold text-indigo-700 dark:text-indigo-400" : "font-medium text-slate-600 dark:text-slate-400")}>다크</span>
                    </button>
                    <button 
                      onClick={() => setTheme("system")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 border-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-all",
                        theme === "system" ? "border-indigo-600 dark:border-indigo-500" : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                      )}>
                      <div className="w-full h-16 bg-gradient-to-br from-white to-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"></div>
                      <span className={cn("text-sm", theme === "system" ? "font-semibold text-indigo-700 dark:text-indigo-400" : "font-medium text-slate-600 dark:text-slate-400")}>시스템</span>
                    </button>
                  </div>
                </div>
                
                <hr className="border-slate-100 dark:border-slate-800" />
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">UI 언어</h4>
                  <select className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="ko">한국어 (Korean)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab !== "integrations" && activeTab !== "appearance" && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 animate-in zoom-in-95 duration-300">
                <Plug className="w-12 h-12 mb-4 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-medium">이 기능은 준비 중입니다.</p>
                <p className="text-xs mt-2">추후 업데이트를 통해 제공될 예정입니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
