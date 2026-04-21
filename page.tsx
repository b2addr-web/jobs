"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import {
  Search, Users, Star, Clock, XCircle, FileText,
  Mail, Briefcase, ExternalLink, RefreshCw, ChevronDown,
  LayoutDashboard, Filter, Download,
} from "lucide-react";
import { supabase, type Application, type AppStatus } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { StatsCard } from "@/components/StatsCard";

// ── Status action buttons config ───────────────────────────────────────────────
const STATUS_ACTIONS: { status: AppStatus; label: string; icon: typeof Star; cls: string }[] = [
  { status: "shortlisted", label: "Shortlist", icon: Star,    cls: "hover:bg-blue-500/15 hover:text-blue-400 hover:border-blue-500/30" },
  { status: "pending",     label: "Pending",   icon: Clock,   cls: "hover:bg-amber-500/15 hover:text-amber-400 hover:border-amber-500/30" },
  { status: "rejected",    label: "Reject",    icon: XCircle, cls: "hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30" },
];

const FILTER_TABS: { value: AppStatus | "all"; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "pending",     label: "Pending" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected",    label: "Rejected" },
];

// ── Avatar initials ────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors   = ["from-blue-600 to-cyan-500", "from-violet-600 to-blue-500", "from-cyan-600 to-teal-500", "from-blue-500 to-indigo-600"];
  const idx      = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
}

// ── Row action button ──────────────────────────────────────────────────────────
function ActionButton({ action, current, onAction, loading }: {
  action:   typeof STATUS_ACTIONS[0];
  current:  AppStatus;
  onAction: (s: AppStatus) => void;
  loading:  boolean;
}) {
  const isActive = current === action.status;
  const Icon = action.icon;
  return (
    <button
      onClick={() => !isActive && onAction(action.status)}
      disabled={isActive || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
        ${isActive
          ? "bg-blue-500/20 text-blue-300 border-blue-500/40 cursor-default"
          : `border-white/5 text-slate-400 ${action.cls} cursor-pointer`}
        disabled:opacity-50`}
    >
      {loading && isActive ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {action.label}
    </button>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [apps,          setApps]          = useState<Application[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState<AppStatus | "all">("all");
  const [updatingId,    setUpdatingId]    = useState<string | null>(null);
  const [isPending,     startTransition]  = useTransition();
  const [expanded,      setExpanded]      = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setApps(data as Application[]);
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, []);

  // ── Realtime subscription ────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("applications_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setApps(prev => prev.map(a => a.id === (payload.new as Application).id ? payload.new as Application : a));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Update status ────────────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: AppStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (!error) setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setUpdatingId(null);
  };

  // ── Filter + Search ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return apps.filter(a => {
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchSearch = !q || a.full_name.toLowerCase().includes(q) || a.job_title.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [apps, search, filterStatus]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       apps.length,
    pending:     apps.filter(a => a.status === "pending").length,
    shortlisted: apps.filter(a => a.status === "shortlisted").length,
    rejected:    apps.filter(a => a.status === "rejected").length,
  }), [apps]);

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Job Title", "Status", "Resume"],
      ...filtered.map(a => [a.full_name, a.email, a.job_title, a.status, a.resume_url ?? ""])
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "applicants.csv"; a.click();
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-[#0a0f1a]/80 backdrop-blur border-r border-white/5 flex flex-col z-20">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">TalentHub</p>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium cursor-pointer">
            <LayoutDashboard className="w-4 h-4" /> Applications
          </div>
          {[
            { icon: Users,   label: "Candidates" },
            { icon: Filter,  label: "Job Posts" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm cursor-pointer transition-colors">
              <Icon className="w-4 h-4" /> {label}
            </div>
          ))}
        </nav>

        {/* Status legend */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Status Legend</p>
          {[
            { color: "bg-amber-400", label: "Pending",     count: stats.pending },
            { color: "bg-blue-400",  label: "Shortlisted", count: stats.shortlisted },
            { color: "bg-red-400",   label: "Rejected",    count: stats.rejected },
          ].map(({ color, label, count }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{count}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 relative z-10">
        {/* Topbar */}
        <header className="sticky top-0 z-10 px-8 py-4 bg-[#080c14]/80 backdrop-blur border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Applicants Dashboard</h1>
            <p className="text-xs text-slate-500">{stats.total} total applications</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchApps} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-600/20">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </header>

        <div className="px-8 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatsCard label="Total Applicants" value={stats.total}       color="bg-blue-500"  />
            <StatsCard label="Pending Review"   value={stats.pending}     color="bg-amber-500" />
            <StatsCard label="Shortlisted"      value={stats.shortlisted} color="bg-blue-500"  />
            <StatsCard label="Rejected"         value={stats.rejected}    color="bg-red-500"   />
          </div>

          {/* Table card */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0f1a] overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, role, or email..."
                  className="w-full bg-[#080c14] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 p-1 rounded-xl bg-[#080c14] border border-white/5">
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterStatus(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterStatus === tab.value
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 font-mono ${filterStatus === tab.value ? "text-blue-200" : "text-slate-600"}`}>
                      {tab.value === "all" ? apps.length : apps.filter(a => a.status === tab.value).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-24 flex flex-col items-center gap-3 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-sm">Loading applicants...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 flex flex-col items-center gap-3 text-slate-500">
                <Users className="w-10 h-10 opacity-30" />
                <p className="text-sm">No applicants found</p>
                {search && <p className="text-xs">Try a different search term</p>}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Applicant", "Job Title", "Status", "Resume", "Actions"].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(app => (
                    <>
                      <tr
                        key={app.id}
                        className="group hover:bg-blue-500/5 transition-colors cursor-pointer"
                        onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                      >
                        {/* Applicant */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={app.full_name} />
                            <div>
                              <p className="text-sm font-medium text-slate-100">{app.full_name}</p>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="w-3 h-3" />
                                {app.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Job title */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-300">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            {app.job_title}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusBadge status={app.status} />
                        </td>

                        {/* Resume */}
                        <td className="px-6 py-4">
                          {app.resume_url ? (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View CV
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-600">No resume</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {STATUS_ACTIONS.map(action => (
                              <ActionButton
                                key={action.status}
                                action={action}
                                current={app.status}
                                loading={updatingId === app.id}
                                onAction={status => handleStatusChange(app.id, status)}
                              />
                            ))}
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-600 ml-1 transition-transform ${expanded === app.id ? "rotate-180" : ""}`} />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expanded === app.id && (
                        <tr key={`${app.id}-detail`} className="bg-blue-500/5">
                          <td colSpan={5} className="px-8 py-4">
                            <div className="grid grid-cols-3 gap-6 text-sm">
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Full Name</p>
                                <p className="text-slate-200 font-medium">{app.full_name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email Address</p>
                                <a href={`mailto:${app.email}`} className="text-blue-400 hover:text-blue-300">{app.email}</a>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Applied For</p>
                                <p className="text-slate-200">{app.job_title}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
                                <StatusBadge status={app.status} />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Application ID</p>
                                <p className="text-slate-500 font-mono text-xs">{app.id}</p>
                              </div>
                              {app.resume_url && (
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Resume</p>
                                  <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs">
                                    <ExternalLink className="w-3 h-3" /> Open Resume
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}

            {/* Footer */}
            {!loading && filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of <span className="text-slate-300 font-medium">{apps.length}</span> applicants
                </p>
                <p className="text-xs text-slate-600">Click any row to expand details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
