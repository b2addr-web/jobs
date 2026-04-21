import { Clock, Star, XCircle } from "lucide-react";
import type { AppStatus } from "@/lib/supabase";

const CONFIG = {
  pending:     { label: "Pending",     icon: Clock,   cls: "bg-amber-500/10  text-amber-400  border-amber-500/20"  },
  shortlisted: { label: "Shortlisted", icon: Star,    cls: "bg-blue-500/10   text-blue-400   border-blue-500/20"   },
  rejected:    { label: "Rejected",    icon: XCircle, cls: "bg-red-500/10    text-red-400    border-red-500/20"    },
};

export function StatusBadge({ status }: { status: AppStatus }) {
  const { label, icon: Icon, cls } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
