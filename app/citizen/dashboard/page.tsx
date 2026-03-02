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
import Link from "next/link";
import { FilePlus, Trophy, CheckCircle, AlertTriangle, Star, TrendingUp } from "lucide-react";

interface Issue {
  id: string; title: string; category: string; status: string;
  priority: string; location_text: string; created_at: string;
  upvote_count: number; photo_url?: string;
}
interface Citizen {
  id: string; name: string; points: number; tier: string;
  trust_score: number; report_count: number;
}

export default function CitizenDashboard() {
  const { user }     = getAuth();
  const [citizen,   setCitizen]   = useState<Citizen | null>(null);
  const [issues,    setIssues]    = useState<Issue[]>([]);
  const [cityIssues, setCityIssues] = useState<Issue[]>([]);
  const [loading,   setLoading]   = useState(true);

  async function loadData() {
    if (!user?.id) return;
    try {
      const [cRes, iRes, ciRes] = await Promise.all([
        api.get(`/api/citizens/${user.id}`),
        api.get(`/api/issues/?reported_by_id=${user.id}&limit=20`),
        api.get(`/api/issues/?limit=10`),
      ]);
      setCitizen(cRes.data);
      setIssues(iRes.data);
      setCityIssues(ciRes.data);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadData();
    const ws = createWebSocket(`citizen/${user?.id}`, (data) => {
      if (data.type === "points_earned") {
        toast.success(`+${data.points} points — ${data.reason}`);
        loadData();
      }
      if (data.type === "issue_updated") loadData();
    });
    return () => ws.close();
  }, []);

  const TIER_COLORS: Record<string,string> = {
    champion: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    active:   "text-accent-light bg-accent/10 border-accent/20",
    contributor: "text-success bg-success/10 border-success/20",
    new:      "text-text-muted bg-border/50 border-border",
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar type="citizen" />
      <main className="ml-64 flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text">Welcome back, {citizen?.name}</h1>
                <p className="text-text-muted text-sm mt-1">Here is your civic activity overview</p>
              </div>
              <Link href="/citizen/report" className="btn-primary flex items-center gap-2">
                <FilePlus className="w-4 h-4" /> Report Issue
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Reports",  value: citizen?.report_count || 0, icon: AlertTriangle, color: "text-warning" },
                { label: "Points Earned",  value: citizen?.points || 0,       icon: Star,          color: "text-yellow-400" },
                { label: "Trust Score",    value: `${citizen?.trust_score || 0}%`, icon: CheckCircle, color: "text-success" },
                { label: "Current Tier",   value: citizen?.tier || "new",     icon: Trophy,        color: "text-accent-light" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="stat-card">
                  <Icon className={`w-5 h-5 ${color} mb-1`} />
                  <p className="stat-value">{value}</p>
                  <p className="stat-label">{label}</p>
                </div>
              ))}
            </div>

            {/* Tier badge */}
            <div className={`card flex items-center gap-4 border ${TIER_COLORS[citizen?.tier || "new"]}`}>
              <Trophy className="w-8 h-8 flex-shrink-0" />
              <div>
                <p className="font-semibold text-text capitalize">{citizen?.tier} Tier</p>
                <p className="text-sm text-text-muted">
                  {citizen?.tier === "champion" ? "You are in the top tier of civic contributors." :
                   citizen?.tier === "active"   ? "Keep reporting to reach Champion tier at 500 points." :
                   citizen?.tier === "contributor" ? "Reach 200 points to become an Active contributor." :
                   "Start reporting issues to earn points and climb the leaderboard."}
                </p>
              </div>
            </div>

            {/* My Issues */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-text">My Complaints</h2>
                <span className="text-sm text-text-muted">{issues.length} total</span>
              </div>
              {issues.length === 0 ? (
                <EmptyState title="No complaints yet" description="Report your first civic issue to get started." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Title</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Category</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Priority</th>
                        <th className="text-left py-3 px-2 text-text-muted font-medium">Reported</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map(issue => (
                        <tr key={issue.id} className="table-row">
                          <td className="py-3 px-2 text-text font-medium max-w-xs truncate">{issue.title}</td>
                          <td className="py-3 px-2 text-text-muted capitalize">{issue.category?.replace("_"," ")}</td>
                          <td className="py-3 px-2"><StatusBadge status={issue.status} /></td>
                          <td className="py-3 px-2"><PriorityBadge priority={issue.priority} /></td>
                          <td className="py-3 px-2 text-text-muted text-xs">
                            {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent City Issues */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-accent-light" />
                <h2 className="font-semibold text-text">Recent City Issues</h2>
              </div>
              <div className="space-y-2">
                {cityIssues.slice(0,5).map(issue => (
                  <div key={issue.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm text-text font-medium truncate">{issue.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{issue.location_text || "Location not specified"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={issue.priority} />
                      <StatusBadge status={issue.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
