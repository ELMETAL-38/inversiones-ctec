import React from 'react';

const colorMap = {
  gold:    { bg: 'rgba(212,165,51,0.15)',  border: '1px solid rgba(212,165,51,0.3)',  icon: '#d4a533' },
  emerald: { bg: 'rgba(16,185,129,0.15)',  border: '1px solid rgba(16,185,129,0.3)',  icon: '#10b981' },
  blue:    { bg: 'rgba(59,130,246,0.15)',  border: '1px solid rgba(59,130,246,0.3)',  icon: '#3b82f6' },
  red:     { bg: 'rgba(239,68,68,0.15)',   border: '1px solid rgba(239,68,68,0.3)',   icon: '#ef4444' },
  purple:  { bg: 'rgba(168,85,247,0.15)',  border: '1px solid rgba(168,85,247,0.3)',  icon: '#a855f7' },
  pink:    { bg: 'rgba(236,72,153,0.15)',  border: '1px solid rgba(236,72,153,0.3)',  icon: '#ec4899' },
  orange:  { bg: 'rgba(249,115,22,0.15)',  border: '1px solid rgba(249,115,22,0.3)',  icon: '#f97316' },
};

export default function StatCard({ icon: Icon, label, value, trend, trendUp, color = "gold" }) {
  const c = colorMap[color] || colorMap.gold;

  return (
    <div style={{ background: c.bg, border: c.border }} className="rounded-xl p-5 relative overflow-hidden">
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
        <div className="p-2.5 rounded-lg bg-white/5">
          <Icon style={{ color: c.icon }} className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}