"use client";

import { MessageSquare, Mail, AtSign, MessageCircle, Upload } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight transition-colors mb-2">
          연동 관리
        </h1>
        <p className="text-slate-500 dark:text-slate-400 transition-colors">
          팀의 소통 채널을 동기화하여 AI 에이전트가 업무 흐름을 파악하고 자동으로 작업을 추출할 수 있도록 설정하세요.
        </p>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Slack Card - Large Left */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between group hover:shadow-md transition-all duration-300">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#f4f2f6] dark:bg-[#4a154b]/20 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-[#4a154b] dark:text-[#E5E0FA]" fill="currentColor" strokeWidth={0} />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Slack</h2>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                연동됨
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">대화에서 작업을 자동으로 추출합니다.</p>
          </div>
          
          <button 
            disabled
            className="mt-6 self-start bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-not-allowed"
          >
            이미 연결되었습니다
          </button>
        </div>

        {/* Right Column - Two Smaller Cards */}
        <div className="flex flex-col gap-6">
          
          {/* Gmail Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-start gap-5 group hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-[#f8f1f1] dark:bg-red-500/10 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-[#ea4335] dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">Gmail</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">스레드 및 액션 아이템 동기화</p>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:border-indigo-500 group-hover:text-indigo-500 dark:group-hover:border-indigo-400 dark:group-hover:text-indigo-400 transition-colors">
              <span className="text-xl leading-none font-light mb-0.5">+</span>
            </div>
          </div>

          {/* Outlook Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-start gap-5 group hover:shadow-md transition-all duration-300 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[#eff3f8] dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <AtSign className="w-6 h-6 text-[#0078d4] dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">Outlook</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">엔터프라이즈 수신함 동기화</p>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:border-indigo-500 group-hover:text-indigo-500 dark:group-hover:border-indigo-400 dark:group-hover:text-indigo-400 transition-colors">
              <span className="text-xl leading-none font-light mb-0.5">+</span>
            </div>
          </div>

        </div>

        {/* Bottom Card - KakaoTalk (Full Width) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-8 group hover:shadow-md transition-all duration-300">
          <div className="flex-1 flex flex-col sm:flex-row gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#fee500] dark:bg-[#fee500]/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-8 h-8 text-[#3c1e1e] dark:text-[#fee500]" fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">카카오톡 대화 기록 업로드</h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold tracking-widest uppercase">
                  수동 연동
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                카카오톡 대화방에서 내보낸 <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">.txt</code> 또는 <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">.zip</code> 파일을 업로드하세요. AI 에이전트가 고객과의 이전 대화 맥락을 파악하고 관련된 작업을 자동 추출합니다.
              </p>
            </div>
          </div>
          
          <div className="md:w-72 shrink-0 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-800 flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors cursor-pointer group/drop">
            <div className="w-10 h-10 rounded bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-3 text-slate-400 dark:text-slate-300 group-hover/drop:text-indigo-500 dark:group-hover/drop:text-indigo-400 group-hover/drop:-translate-y-1 transition-all">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover/drop:text-indigo-600 dark:group-hover/drop:text-indigo-400 transition-colors">
              여기에 대화 파일 끌어다 놓기
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
