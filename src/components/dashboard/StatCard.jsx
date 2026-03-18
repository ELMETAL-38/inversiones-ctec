import React from 'react';

export default function StatCard({ icon: Icon, label, value, trend, trendUp, color = "gold" }) {
  const colorMap = {
    gold: { bg: "from-[#d4a533]/10 to-[#d4a533]/5", icon: "text-[#d4a533]", border: "border-[#d4a533]/20" },
    emerald: { bg: "from-emerald-500/10 to-emerald-500/5", icon: "text-emerald-400", border: "border-emerald-500/20" },
    blue: { bg: "from-blue-500/10 to-blue-500/5", icon: "text-blue-400", border: "border-blue-500/20" },
    red: { bg: "from-red-500/10 to-red-500/5", icon: "text-red-400", border: "border-red-500/20" },
    purple: { bg: "from-purple-500/10 to-purple-500/5", icon: "text-purple-400", border: "border-purple-500/20" },
    pink: { bg: "from-pink-500/10 to-pink-500/5", icon: "text-pink-400", border: "border-pink-500/20" },
    orange: { bg: "from-orange-500/10 to-orange-500/5", icon: "text-orange-400", border: "border-orange-500/20" },
  };
  const c = colorMap[color];

  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-xl border ${c.border} p-5 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -translate-y-8 translate-x-8" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1.5 text-gray-100">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg bg-white/5`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}