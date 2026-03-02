"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { createWebSocket } from "@/lib/ws";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import clsx from "clsx";
import { CheckCircle, Clock, Star, TrendingUp, AlertTriangle } from "lucide-react";

interface Issue {
  id: string; title: string; category: string; status: string;
  priority: string; location_text: string; created_at: string;
  ward_name?: string; upvote_count: number; description: string;
}

const STATUSES = ["acknowledged","in_progress","resolved","escalated"];

export default function OfficialDashboard() {
  const { user }  = getAuth();
  const [issues,  setIssues]  = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("open");
  const [modal, setModal] = useState<{ issue: Issue; status: string } | null>(null);
  const [note, setNote] = useState("");

  async function loadIssues() {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/officials/${user.id}/issues`);
      setIssues(res.data);
    } catch { toast.error("Failed to load issues"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadIssues();
    const ws = createWebSocket(`official/${user?.id}`, (data) => {
      if (data.type === "new_issue") {
        toast(`New issue assigned: ${data.title}`, { icon: "!" });
        loadIssues();
      }
    });
    return () => ws.close();
  }, []);

  async function updateStatus(issueId: string, newStatus: string, noteText: string) {
    setUpdating(issueId);
    try {
      const res = await api.put(
        `/api/officials/issue/${issueId}/update?official_id=${user?.id}`,
        { new_status: newStatus, note: noteText }
      );
      toast.success(`Status updated${res.data.points_earned ? ` — +${res.data.points_earned} points` : ""}`);
      loadIssues();
      setModal(null);
      setNote("");
    } catch { toast.error("Update failed"); }
    finally { setUpdating(null); }
  }

  async function escalate(issueId: string) {
    if (!confirm("Escalate this issue to your superior? This will deduct 10 points.")) return;
    try {
      await api.post(`/api/officials/issue/${issueId}/escalate?official_id=${user?.id}&reason=manual_escalation`);
      toast.success("Issue escalated");
      loadIssues();
    } catch { toast.error("Escalation failed"); }
  }

  const filtered = issues.filter(i => {
    if (activeTab === "open")     return ["open","acknowledged","in_progress"].includes(i.status);
    if (activeTab === "resolved") return i.status === "resolved";
    if (activeTab === "disputed") return ["disputed","escalated"].includes(i.status);
    return true;
  });

  const stats = {
    assigned: issues.length,
    resolved: issues.filter(i => i.status === "resolved").length,
    pending:  issues.filter(i => ["open","acknowledged","in_progress"].includes(i.status)).length,
    critical: issues.filter(i => i.priority === "critical").length,
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar type="official" />
      <main className="ml-64 flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-text">Official Dashboard</h1>
              <p className="text-text-muted text-sm mt-1">{user?.department} — {user?.designation}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Assigned", value: stats.assigned, icon: TrendingUp, color: "text-accent-light" },
                { label: "Resolved",       value: stats.resolved, icon: CheckCircle, color: "text-success" },
                { label: "Pending",        value: stats.pending,  icon: Clock,       color: "text-warning" },
                { label: "Critical",       value: stats.critical, icon: AlertTriangle, color: "text-danger" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="stat-card">
                  <Icon className={`w-5 h-5 ${color} mb-1`} />
                  <p className="stat-value">{value}</p>
                  <p className="stat-label">{label}</p>
                </div>
              ))}
            </div>

            {/* Performance */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <h2 className="font-semibold text-text">Performance Score</h2>
                <span className="ml-auto text-xl font-bold text-text">
                  {user?.performance_score?.toFixed(1) || "0.0"}<span className="text-text-muted text-sm">/100</span>
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-500"
                  style={{ width: `${user?.performance_score || 0}%` }}
                />
              </div>
            </div>

            {/* Issues Table */}
            <div className="card">
              {/* Tabs */}
              <div className="flex gap-1 mb-5 bg-bg-secondary rounded-lg p-1">
                {[
                  { key: "open",     label: `Active (${stats.pending})` },
                  { key: "resolved", label: `Resolved (${stats.resolved})` },
                  { key: "disputed", label: "Disputed" },
                  { key: "all",      label: "All" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={clsx("flex-1 py-2 rounded-md text-sm font-medium transition-all",
                      activeTab === key ? "bg-accent text-white" : "text-text-muted hover:text-text")}>
                    {label}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <EmptyState title="No issues in this category" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Title</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Ward</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Priority</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Reported</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(issue => (
                        <tr key={issue.id} className="table-row">
                          <td className="py-3 px-2">
                            <p className="text-text font-medium truncate max-w-xs">{issue.title}</p>
                            <p className="text-xs text-text-muted truncate max-w-xs">{issue.location_text}</p>
                          </td>
                          <td className="py-3 px-2 text-text-muted text-xs">{issue.ward_name || "—"}</td>
                          <td className="py-3 px-2"><PriorityBadge priority={issue.priority} /></td>
                          <td className="py-3 px-2"><StatusBadge status={issue.status} /></td>
                          <td className="py-3 px-2 text-text-muted text-xs">
                            {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                          </td>
                          <td className="py-3 px-2">
                            {["open","acknowledged","in_progress"].includes(issue.status) && (
                              <div className="flex gap-1.5 flex-wrap">
                                {STATUSES.filter(s => s !== issue.status && s !== "escalated").map(s => (
                                  <button key={s}
                                    onClick={() => setModal({ issue, status: s })}
                                    disabled={!!updating}
                                    className="text-xs px-2 py-1 rounded bg-bg-secondary border border-border hover:border-accent text-text-muted hover:text-text transition-colors capitalize">
                                    {s.replace("_"," ")}
                                  </button>
                                ))}
                                <button onClick={() => escalate(issue.id)}
                                  className="text-xs px-2 py-1 rounded bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition-colors">
                                  Escalate
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {modal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full animate-fade-in">
              <h3 className="font-semibold text-text mb-1">Update Issue Status</h3>
              <p className="text-sm text-text-muted mb-4 truncate">{modal.issue.title}</p>
              <p className="text-sm text-text-muted mb-2">
                Changing to: <span className="text-accent-light font-medium capitalize">{modal.status.replace("_"," ")}</span>
              </p>
              <textarea
                className="input min-h-20 resize-none mb-4"
                placeholder="Add a note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => { setModal(null); setNote(""); }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => updateStatus(modal.issue.id, modal.status, note)}
                  disabled={!!updating}
                  className="btn-primary flex-1">
                  {updating ? <Spinner size="sm" /> : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
