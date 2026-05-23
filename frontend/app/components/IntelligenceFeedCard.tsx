"use client";

import { Sparkles, ArrowRight, AlertTriangle, Info, CheckCircle } from "lucide-react";

const feedItems = [
  {
    id: 1,
    title: "High priority task delayed",
    description: "Sarah's 'Supply chain manifest' task is at risk of missing the deadline.",
    time: "10 mins ago",
    type: "warning",
    icon: AlertTriangle,
    color: "text-orange-600 bg-orange-100"
  },
  {
    id: 2,
    title: "Workload imbalance detected",
    description: "Marcus has 30% more tasks than the team average. Consider reassigning some tasks.",
    time: "1 hour ago",
    type: "info",
    icon: Info,
    color: "text-blue-600 bg-blue-100"
  },
  {
    id: 3,
    title: "Pattern recognized",
    description: "Security review tasks typically take 2x longer than estimated. Adjusting future estimates.",
    time: "2 hours ago",
    type: "success",
    icon: CheckCircle,
    color: "text-emerald-600 bg-emerald-100"
  }
];

export function IntelligenceFeedCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full bg-gradient-to-br from-indigo-50/50 to-white">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">AI Intelligence Feed</h3>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {feedItems.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-2 rounded-full h-fit flex-shrink-0 ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex justify-between items-start mb-1 gap-2">
                <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                <span className="text-xs text-slate-500 whitespace-nowrap">{item.time}</span>
              </div>
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="mt-6 w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
        View all AI insights <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
