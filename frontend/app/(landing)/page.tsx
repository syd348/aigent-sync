"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, AtSign, MessageCircle, Upload } from "lucide-react";
import { SlackConnectCard } from "@/app/components/SlackConnectCard";
import { isLoggedIn } from "@/app/lib/auth";

export default function ConnectWorkspacePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eff3fc] dark:from-slate-950 via-white dark:via-slate-900 to-[#eff3fc] dark:to-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 flex flex-col transition-colors duration-300">
      <nav className="flex justify-between items-center p-6 lg:px-12">
        <div className="text-xl font-bold text-indigo-900 dark:text-indigo-400 tracking-tight">
          Aigent Sync
        </div>
        {loggedIn && (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            대시보드로 이동
          </Link>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center mt-12 px-6 pb-20">
        <div className="text-center mb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold tracking-wider uppercase">
            AI 설정 1단계
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-slate-100">
            워크스페이스 연결하기
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
            소통 채널을 동기화하여 AI 에이전트가 업무 흐름을 파악하고 대화를 검토할 수 있도록 하세요.
          </p>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <SlackConnectCard />

          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-700 flex items-start gap-5 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#f8f1f1] dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-[#ea4335] dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-slate-100">Gmail</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">스레드 및 캘린더 동기화</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:border-blue-500 group-hover:text-blue-500 dark:group-hover:border-blue-400 dark:group-hover:text-blue-400 transition-colors">
                <span className="text-xl leading-none font-light mb-0.5">+</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-700 flex items-start gap-5 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-[#eff3f8] dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                <AtSign className="w-6 h-6 text-[#0078d4] dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-slate-100">Outlook</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">엔터프라이즈 수신함 관리</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:border-blue-500 group-hover:text-blue-500 dark:group-hover:border-blue-400 dark:group-hover:text-blue-400 transition-colors">
                <span className="text-xl leading-none font-light mb-0.5">+</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-8 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300">
            <div className="flex-1 flex flex-col sm:flex-row gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#fee500] dark:bg-[#fee500]/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-8 h-8 text-[#3c1e1e] dark:text-[#fee500]" fill="currentColor" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">카카오톡 대화 내용</h3>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold tracking-widest uppercase">
                    선택 사항
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                  카카오톡 대화방에서보낸 <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">.txt</code> 또는 <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">.zip</code> 파일을 업로드하세요.
                </p>
              </div>
            </div>

            <div className="md:w-72 shrink-0 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-800 flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer group/drop">
              <div className="w-10 h-10 rounded bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-3 text-slate-400 dark:text-slate-300 group-hover/drop:text-blue-500 dark:group-hover/drop:text-blue-400 group-hover/drop:-translate-y-1 transition-all">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover/drop:text-blue-600 dark:group-hover/drop:text-blue-400 transition-colors">
                여기에 대화 파일 업로드
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 dark:text-slate-500">
        <div className="flex gap-6 mb-4 sm:mb-0">
          <Link href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">개인정보 처리방침</Link>
          <Link href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">이용약관</Link>
          <Link href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">보안 정책</Link>
        </div>
        <div>© 2024 Aigent Sync. All rights reserved.</div>
      </footer>
    </div>
  );
}
