interface Props { label: string; value: number; color: string; }
export function StatsCard({ label, value, color }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f1623] p-5">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${color}`} />
      <p className="text-3xl font-bold text-white font-mono">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}
