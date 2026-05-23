"use client";

import { Users, MoreHorizontal } from "lucide-react";

const teamMembers = [
  { name: "Sarah Jenkins", role: "Product Manager", tasks: 8, total: 10, avatar: "SJ", color: "bg-blue-100 text-blue-700", barColor: "bg-blue-500" },
  { name: "Marcus Thorne", role: "Developer", tasks: 3, total: 5, avatar: "MT", color: "bg-emerald-100 text-emerald-700", barColor: "bg-emerald-500" },
  { name: "Alex Chen", role: "Designer", tasks: 7, total: 8, avatar: "AC", color: "bg-purple-100 text-purple-700", barColor: "bg-purple-500" },
  { name: "Emily Watson", role: "QA Engineer", tasks: 2, total: 12, avatar: "EW", color: "bg-orange-100 text-orange-700", barColor: "bg-orange-500" },
];

export function LoadBalancingCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Team Load Balancing</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">Real-time task distribution and capacity among team members.</p>
      
      <div className="space-y-6 flex-1">
        {teamMembers.map((member) => (
          <div key={member.name} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${member.color}`}>
                  {member.avatar}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900">{member.tasks}</span>
                <span className="text-sm text-slate-500"> / {member.total} left</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
              <div 
                className={`h-2.5 rounded-full ${member.barColor} transition-all duration-1000 ease-in-out`}
                style={{ width: `${(member.tasks / member.total) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
