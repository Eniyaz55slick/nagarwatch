"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { createWebSocket } from "@/lib/ws";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/Spinner";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import Link from "next/link";
import { MapPin, BarChart3, Activity, CheckCircle, TrendingUp, Scan, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashData {
  city: { id: string; name: string; state: string; slug: string };
  stats: { total: number; resolved: number; open: number; resolution_rate: number };
  by_category: Record<string, { total: number; resolved: number }>;
  wards: { ward_name: string; health_score: number; tension: string; pending: number }[];
  recent_issues: { id: string; title: string; status: string; priority: string; created_at: string }[];
}
interface City { id: string; name: string; state: string; slug: string; }

const COLORS = ["#6366f1","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#f43f5e","#84cc16"];
const TENSION_COLORS: Record<string,string> = { low:"border-success/40 bg-success/5", medium:"border-warning/40 bg-warning/5", high:"border-orange-500/40 bg-orange-500/5", critical:"border-danger/40 bg-danger/5" };
const TENSION_DOT: Record<string,string> = { low:"bg-success", medium:"bg-warning", high:"bg-orange-500", critical:"bg-danger" };

export default function DashboardPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState("");
  const [data,   setData]   = useState<DashData | null>(null);
  const [issues, setIssues] = useState<{ id:string;title:string;status:string;priority:string;category:string;created_at:string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    api.get("/api/cities/").then(r => { setCities(r.data); if (r.data.length) setCityId(r.data[0].slug); }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!cityId) return;
    loadDashboard();
    const ws = createWebSocket(`city/${cityId}`, () => loadDashboard());
    const iv = setInterval(loadDashboard, 30000);
    return () => { ws.close(); clearInterval(iv); };
  }, [cityId]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const city = cities.find(c => c.slug === cityId);
      if (!city) return;
      const [d, i] = await Promise.all([
        api.get(`/api/cities/${cityId}/dashboard`),
        api.get(`/api/issues/?city_id=${city.id}&limit=50`),
      ]);
      setData(d.data); setIssues(i.data);
    } catch { toast.error("Failed to load dashboard"); }
    finally { setLoading(false); }
  }

  const catData  = data ? Object.entries(data.by_category).map(([name,v])=>({ name:name.replace("_"," "), total:v.total, resolved:v.resolved })) : [];
  const wardData = data?.wards.map(w=>({ name:w.ward_name, score:w.health_score })) || [];
  const filtered = issues.filter(i => filter==="all" || i.status===filter);

  return (
    <div className="min-h-screen bg-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-white"/></div>
            <span className="font-bold text-text">NagarWatch</span>
          </Link>
          <div className="flex items-center gap-3">
            <select value={cityId} onChange={e=>setCityId(e.target.value)} className="input w-48 py-1.5 text-sm">
              {cities.map(c=><option key={c.slug} value={c.slug}>{c.name}, {c.state}</option>)}
            </select>
            <Link href="/scanner" className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 px-3"><Scan className="w-3.5 h-3.5"/> X Scanner</Link>
            <Link href="/login" className="btn-primary text-sm py-1.5 px-4">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        {!data && loading && <div className="flex justify-center py-32"><Spinner size="lg"/></div>}
        {!data && !loading && <div className="text-center py-32 text-text-muted">{cities.length===0 ? "No cities found. Add a city via POST /api/cities/" : "Select a city above."}</div>}

        {data && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text">{data.city.name}</h1>
                <p className="text-text-muted">{data.city.state}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-success rounded-full animate-pulse-slow"/><span className="text-xs text-success">Live</span></div>
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/issues/report/${data.city.id}/monthly?month=${new Date().getMonth()+1}&year=${new Date().getFullYear()}`} target="_blank" rel="noreferrer" className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                  <Download className="w-3.5 h-3.5"/> Monthly Report
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label:"Total Issues", value:data.stats.total,           icon:BarChart3,  color:"text-accent-light" },
                { label:"Resolved",     value:data.stats.resolved,        icon:CheckCircle,color:"text-success" },
                { label:"Active",       value:data.stats.open,            icon:Activity,   color:"text-warning" },
                { label:"Resolution %", value:`${data.stats.resolution_rate}%`, icon:TrendingUp, color:"text-violet-light" },
              ].map(({ label,value,icon:Icon,color })=>(
                <div key={label} className="stat-card"><Icon className={`w-5 h-5 ${color} mb-1`}/><p className="stat-value">{value}</p><p className="stat-label">{label}</p></div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="font-semibold text-text mb-5">Issues by Category</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={catData} margin={{bottom:20,left:-20}}>
                    <XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:9}} angle={-30} textAnchor="end"/>
                    <YAxis tick={{fill:"#94a3b8",fontSize:10}}/>
                    <Tooltip contentStyle={{background:"#111827",border:"1px solid #1e293b",borderRadius:8}}/>
                    <Bar dataKey="total" fill="#6366f1" radius={[4,4,0,0]} name="Total"/>
                    <Bar dataKey="resolved" fill="#10b981" radius={[4,4,0,0]} name="Resolved"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2 className="font-semibold text-text mb-5">Ward Health</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={wardData} dataKey="score" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name})=>name}>
                      {wardData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{background:"#111827",border:"1px solid #1e293b",borderRadius:8}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-text mb-4">Ward Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.wards.map(w=>(
                  <div key={w.ward_name} className={`card-sm border ${TENSION_COLORS[w.tension]}`}>
                    <div className="flex items-center gap-2 mb-2"><div className={`w-2 h-2 rounded-full ${TENSION_DOT[w.tension]}`}/><p className="text-sm font-medium text-text truncate">{w.ward_name}</p></div>
                    <p className="text-2xl font-bold text-text">{w.health_score.toFixed(0)}<span className="text-xs text-text-muted">/100</span></p>
                    <p className="text-xs text-text-muted mt-1">{w.pending} pending</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-text">All Issues</h2>
                <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
                  {["all","open","resolved","disputed"].map(f=>(
                    <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter===f?"bg-accent text-white":"text-text-muted hover:text-text"}`}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Title</th>
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Category</th>
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Priority</th>
                    <th className="text-left py-3 px-2 text-text-muted font-medium">Reported</th>
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0,20).map(i=>(
                      <tr key={i.id} className="table-row">
                        <td className="py-3 px-2 text-text font-medium max-w-xs truncate">{i.title}</td>
                        <td className="py-3 px-2 text-text-muted text-xs capitalize">{i.category?.replace("_"," ")}</td>
                        <td className="py-3 px-2"><StatusBadge status={i.status}/></td>
                        <td className="py-3 px-2"><PriorityBadge priority={i.priority}/></td>
                        <td className="py-3 px-2 text-text-muted text-xs">{formatDistanceToNow(new Date(i.created_at),{addSuffix:true})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
