"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Search, FileText, ChevronUp, ChevronDown, ChevronsUpDown,
  CheckCircle, Clock, XCircle, ExternalLink, Mail, Briefcase,
  Filter, RefreshCw,
} from "lucide-react";
import { updateStatus, type Application, type ApplicationStatus } from "@/lib/supabase";
import { StatusBadge } from "./StatusBadge";

interface Props {
  initialData: Application[];
}

type SortKey  = keyof Application | null;
type SortDir  = "asc" | "desc";

const STATUS_FILTERS = ["all", "pending", "shortlisted", "rejected"] as const;
type  StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_ACTIONS: Array<{ status: ApplicationStatus; label: string; icon: React.ReactNode; cls: string }> = [
  { status: "pending",     label: "Pending",     icon: <Clock      className="w-3.5 h-3.5" />, cls: "hover:bg-amber-500/15 hover:border-amber-500/40 hover:text-amber-300"   },
  { status: "shortlisted", label: "Shortlist",   icon: <CheckCircle className="w-3.5 h-3.5"/>, cls: "hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-300" },
  { status: "rejected",    label: "Reject",      icon: <XCircle    className="w-3.5 h-3.5" />, cls: "hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-300"   },
];

function SortIcon({ column, sortKey, sortDir }: { column: string; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ChevronsUpDown className="w-3 h-3 text-slate-600" />;
  return sortDir === "asc"
    ? <ChevronUp   className="w-3 h-3 text-blue-400" />
    : <ChevronDown className="w-3 h-3 text-blue-400" />;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const hue      = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 select-none"
      style={{ background: `hsl(${hue}, 60%, 25%)`, border: `1px solid hsl(${hue}, 60%, 35%)` }}
    >
      {initials}
    </div>
  );
}

export function ApplicationsTable({ initialData }: Props) {
  const [apps,         setApps]         = useState<Application[]>(initialData);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey,      setSortKey]      = useState<SortKey>(null);
  const [sortDir,      setSortDir]      = useState<SortDir>("asc");
  const [updating,     setUpdating]     = useState<Set<string>>(new Set());
  const [isPending,    startTransition] = useTransition();

  // ── Derived data ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...apps];

    // Search
    const q = search.toLowerCase().trim();
    if (q) list = list.filter(a =>
      a.full_name.toLowerCase().includes(q) ||
      a.job_title.toLowerCase().includes(q)  ||
      a.email.toLowerCase().includes(q)
    );

    // Status filter
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);

    // Sort
    if (sortKey) {
      list.sort((a, b) => {
        const va = String(a[sortKey] ?? "").toLowerCase();
        const vb = String(b[sortKey] ?? "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }

    return list;
  }, [apps, search, statusFilter, sortKey, sortDir]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    setUpdating(prev => new Set(prev).add(id));
    startTransition(async () => {
      const ok = await updateStatus(id, status);
      if (ok) setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      setUpdating(prev => { const s = new Set(prev); s.delete(id); return s; });
    });
  };

  const TH = ({ col, label }: { col: SortKey; label: string }) => (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => handleSort(col)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors group"
      >
        {label}
        <SortIcon column={col ?? ""} sortKey={sortKey} sortDir={sortDir} />
      </button>
    </th>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, title, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0f1623] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                statusFilter === f
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-[#0f1623] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-600 font-mono">
        Showing <span className="text-slate-400">{filtered.length}</span> of <span className="text-slate-400">{apps.length}</span> applicants
      </p>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/80 overflow-hidden bg-[#0a0f1a] shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 bg-[#0c1220]">
                <TH col="full_name" label="Applicant" />
                <TH col="job_title" label="Position"  />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Resume</th>
                <TH col="status"    label="Status"    />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <Search className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No applicants match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((app, idx) => {
                  const isUpdating = updating.has(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`border-b border-slate-800/40 transition-colors group hover:bg-blue-500/[0.03] ${
                        idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                      }`}
                    >
                      {/* Applicant */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={app.full_name} />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-200 truncate">{app.full_name}</p>
                            {app.created_at && (
                              <p className="text-xs text-slate-600 font-mono mt-0.5">
                                {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="text-slate-300 text-sm">{app.job_title}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <a
                          href={`mailto:${app.email}`}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors text-xs font-mono"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[160px]">{app.email}</span>
                        </a>
                      </td>

                      {/* Resume */}
                      <td className="px-4 py-3.5">
                        {app.resume_url ? (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View CV
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-700 italic">Not uploaded</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isUpdating ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…
                          </span>
                        ) : (
                          <StatusBadge status={app.status} />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {STATUS_ACTIONS.filter(a => a.status !== app.status).map(action => (
                            <button
                              key={action.status}
                              onClick={() => handleStatusChange(app.id, action.status)}
                              disabled={isUpdating}
                              title={action.label}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700/60 text-slate-500 bg-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed ${action.cls}`}
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
