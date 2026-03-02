export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open:         "status-open",
    acknowledged: "status-acknowledged",
    in_progress:  "status-in_progress",
    resolved:     "status-resolved",
    disputed:     "status-disputed",
    escalated:    "status-escalated",
  };
  return <span className={map[status] || "badge bg-slate-500/10 text-slate-400"}>{status.replace("_", " ")}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low:      "priority-low",
    medium:   "priority-medium",
    high:     "priority-high",
    critical: "priority-critical",
  };
  return <span className={map[priority] || "priority-medium"}>{priority}</span>;
}
