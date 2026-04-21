"use client";
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Application } from "@/lib/supabase";

interface Props { applications: Application[]; }

export function StatsBar({ applications }: Props) {
  const total       = applications.length;
  const pending     = applications.filter(a => a.status === "pending").length;
  const shortlisted = applications.filter(a => a.status === "shortlisted").length;
  const rejected    = applications.filter(a => a.status === "rejected").length;

  const stats = [
    { label: "Total",       value: total,       icon: Users,         color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
    { label: "Pending",     value: pending,     icon: Clock,         color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
    { label: "Shortlisted", value: shortlisted, icon: CheckCircle,   color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
    { label: "Rejected",    value: rejected,    icon: XCircle,       color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
        <div key={label}
          className={`relative overflow-hidden rounded-2xl border ${border} ${bg} px-5 py-4 backdrop-blur-sm`}>
          {/* Subtle glow dot */}
          <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full ${bg} blur-xl`} />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
            </div>
            <div className={`p-2 rounded-xl ${bg} border ${border}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          </div>

          {total > 0 && (
            <div className="mt-3">
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    label === "Pending"     ? "bg-amber-400"  :
                    label === "Shortlisted" ? "bg-emerald-400":
                    label === "Rejected"    ? "bg-red-400"    : "bg-blue-400"
                  }`}
                  style={{ width: `${Math.round((value / total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-1 font-mono">
                {Math.round((value / total) * 100)}%
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
