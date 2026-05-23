"use client";

import Link from "next/link";
import { MessageSquare, Mail, AtSign, MessageCircle, Upload } from "lucide-react";

export default function ConnectWorkspacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eff3fc] via-white to-[#eff3fc] text-slate-900 font-sans selection:bg-indigo-100 flex flex-col">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center p-6 lg:px-12">
        <div className="text-xl font-bold text-indigo-900 tracking-tight">
          Aigent Sync
        </div>
        <Link 
          href="/dashboard" 
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Skip for now
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center mt-12 px-6 pb-20">
        
        {/* Header Section */}
        <div className="text-center mb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-wider uppercase">
            AI Setup Phase 1
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
            Connect Your Workspace
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            Sync your communication channels so your AI agents can start learning your workflow and reviewing conversations.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          
          {/* Slack Card - Large Left */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#f4f2f6] flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#4a154b]" fill="currentColor" strokeWidth={0} />
              </div>
              <h2 className="text-xl font-bold mb-1 text-slate-900">Slack</h2>
              <p className="text-slate-500 text-sm">Sync team channels.</p>
            </div>
            
            <button className="mt-6 self-start bg-[#111827] hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 group-hover:px-7 duration-300 ease-out">
              Connect Slack
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Right Column - Two Smaller Cards */}
          <div className="flex flex-col gap-6">
            
            {/* Gmail Card */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-start gap-5 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#f8f1f1] flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-[#ea4335]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 text-slate-900">Gmail</h3>
                <p className="text-slate-500 text-sm">Sync threads & calendars.</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">
                <span className="text-xl leading-none font-light mb-0.5">+</span>
              </div>
            </div>

            {/* Outlook Card */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-start gap-5 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-[#eff3f8] flex items-center justify-center shrink-0">
                <AtSign className="w-6 h-6 text-[#0078d4]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 text-slate-900">Outlook</h3>
                <p className="text-slate-500 text-sm">Manage enterprise inbox.</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">
                <span className="text-xl leading-none font-light mb-0.5">+</span>
              </div>
            </div>

          </div>

          {/* Bottom Card - KakaoTalk (Full Width) */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col md:flex-row gap-8 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <div className="flex-1 flex flex-col sm:flex-row gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#fee500] flex items-center justify-center shrink-0">
                <MessageCircle className="w-8 h-8 text-[#3c1e1e]" fill="currentColor" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-900">KakaoTalk Chat History</h3>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold tracking-widest uppercase">
                    Optional
                  </span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                  Upload a <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.txt</code> or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.zip</code> export of your KakaoTalk chats. This allows your AI agents to understand the historical context of local client communications.
                </p>
              </div>
            </div>
            
            <div className="md:w-72 shrink-0 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 hover:border-blue-300 transition-colors cursor-pointer group/drop">
              <div className="w-10 h-10 rounded bg-white shadow-sm flex items-center justify-center mb-3 text-slate-400 group-hover/drop:text-blue-500 group-hover/drop:-translate-y-1 transition-all">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-500 group-hover/drop:text-blue-600 transition-colors">
                Drop chat export here
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
        <div className="flex gap-6 mb-4 sm:mb-0">
          <Link href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-slate-600 transition-colors">Security</Link>
        </div>
        <div>
          © 2024 Aigent Sync. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
