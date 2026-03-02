"use client";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { PriorityBadge } from "@/components/StatusBadge";
import { CITIES } from "@/lib/cities";
import { addScannedIssue, clearScannedIssues, getScannedIssues, ScannedIssue } from "@/lib/scannerStore";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import Link from "next/link";
import clsx from "clsx";
import { MapPin, Play, Square, Scan, Activity, CheckCircle, AlertTriangle, Twitter, Trash2 } from "lucide-react";

interface ScanResult {
  id: string; post_text: string; is_complaint: boolean; confidence: number;
  registered: boolean; issue_id?: string; author?: string; created_at: string;
  ai_result?: { title?: string; category?: string; priority?: string; summary?: string; location_hint?: string; };
}

// Realistic demo posts
const DEMO_POSTS = [
  { text: "The road near RS Puram bus stand has a massive pothole for weeks. Two wheelers nearly fell. No one fixing @CoimbatoreCorpn #Coimbatore", author: "citizen_raj", handle: "citizen_raj" },
  { text: "Garbage not collected in Saibaba Colony for 4 days. Horrible smell. Please take action immediately. @swachhbharat", author: "Ward 5 Resident", handle: "ward5resident" },
  { text: "Streetlight on Gandhipuram main road broken since last month. Very dangerous at night. #StreetLight @TANGEDCO", author: "Night Walker", handle: "nightwalker99" },
  { text: "Water supply cut in our area for 2 days without notice. Children suffering. @TWAD_Board @CoimbatoreCorpn", author: "Angry Taxpayer", handle: "angrytaxpayer" },
  { text: "Great weather today! Went for a morning walk in Brookefields park.", author: "Health Enthusiast", handle: "healthylife" },
  { text: "Massive crack in road near Town Hall school. Children in danger every day. Please fix #RoadDamage", author: "Concerned Parent", handle: "concerned_parent" },
  { text: "Sewage overflowing on Peelamedu main road since yesterday. Health hazard. Kids cannot go to school. @CoimbatoreCorpn", author: "Ravi Kumar", handle: "ravi_kumar_cbtr" },
  { text: "Park benches in Race Course Park all broken. Elderly people have no place to sit. #PublicParks @CoimbatoreCorpn", author: "Senior Voice", handle: "seniorvoice_cbtr" },
  { text: "New restaurant opened near the Mariamman temple. Great food, must try!", author: "Food Lover", handle: "foodlover2024" },
  { text: "Drainage blocked near Singanallur lake causing waterlogging for 3 days. Snakes coming out! @CoimbatoreCorpn #Flooding", author: "Lake Side Resident", handle: "lakeside_cbtr" },
  { text: "Bridge railing broken at Race Course flyover. Very dangerous. Someone will fall soon. #SafetyFirst @NHAI_Official", author: "Daily Commuter", handle: "commuter_cbtr" },
  { text: "Street dogs attacking children near Hopes College. Municipality please act. @CoimbatoreCorpn", author: "Hopes Area Parent", handle: "hopes_parent" },
];

// Demo AI results matching above posts
const DEMO_AI: (Partial<ScannedIssue> | null)[] = [
  { title: "Large pothole near RS Puram bus stand", category: "pothole", priority: "critical", summary: "Major pothole causing accidents on main road", location_hint: "RS Puram Bus Stand, Coimbatore" },
  { title: "Garbage collection failure - Saibaba Colony", category: "sanitation", priority: "high", summary: "4-day waste accumulation in residential area", location_hint: "Saibaba Colony, Ward 5" },
  { title: "Street light outage - Gandhipuram main road", category: "streetlight", priority: "high", summary: "Street light non-functional for over a month", location_hint: "Gandhipuram Main Road, Coimbatore" },
  { title: "Water supply disruption - 2 days", category: "pipeline", priority: "critical", summary: "2-day water cut without prior notice", location_hint: "Residential area, Coimbatore" },
  null,
  { title: "Road crack near Town Hall school zone", category: "road", priority: "high", summary: "Dangerous road damage near school, children at risk", location_hint: "Town Hall Road, Coimbatore" },
  { title: "Sewage overflow - Peelamedu main road", category: "drainage", priority: "critical", summary: "Health hazard - sewage on road for 24+ hours", location_hint: "Peelamedu Main Road, Coimbatore" },
  { title: "Broken park benches - Race Course Park", category: "parks", priority: "medium", summary: "Multiple benches damaged, affecting elderly citizens", location_hint: "Race Course Park, Coimbatore" },
  null,
  { title: "Blocked drainage causing waterlogging", category: "drainage", priority: "high", summary: "Drainage blocked near Singanallur lake, snake hazard", location_hint: "Singanallur Lake Area, Coimbatore" },
  { title: "Bridge railing broken - Race Course flyover", category: "bridge", priority: "critical", summary: "Broken bridge railing posing serious safety risk", location_hint: "Race Course Flyover, Coimbatore" },
  { title: "Stray dog menace near Hopes College", category: "other", priority: "medium", summary: "Street dogs attacking children near college", location_hint: "Hopes College Area, Coimbatore" },
];

export default function ScannerPage() {
  const [cityId, setCityId] = useState(CITIES[0].id);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState({ scanned: 0, complaints: 0, registered: 0 });
  const [current, setCurrent] = useState<ScanResult | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const scanRef = useRef(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setSavedCount(getScannedIssues().length);
  }, []);

  async function scanNext() {
    if (!scanRef.current) return;
    const post = DEMO_POSTS[indexRef.current % DEMO_POSTS.length];
    const aiData = DEMO_AI[indexRef.current % DEMO_AI.length];
    indexRef.current++;

    // Try real backend first
    let result: ScanResult;
    try {
      const res = await api.post("/api/scanner/analyze", {
        post_text: post.text, author: post.handle,
        city_id: cityId, city_name: CITIES.find(c => c.id === cityId)?.name || "",
        post_id: `scan_${Date.now()}_${indexRef.current}`,
      });
      result = { ...res.data, post_text: post.text, author: post.handle };
    } catch {
      // Demo fallback
      const isComplaint = aiData !== null;
      result = {
        id: `demo_${Date.now()}_${indexRef.current}`,
        post_text: post.text,
        author: post.handle,
        is_complaint: isComplaint,
        confidence: isComplaint ? 0.85 + Math.random() * 0.14 : 0.1 + Math.random() * 0.3,
        registered: isComplaint,
        issue_id: isComplaint ? `ISS_${Math.floor(Math.random() * 9000) + 1000}` : undefined,
        created_at: new Date().toISOString(),
        ai_result: aiData ? {
          title: aiData.title,
          category: aiData.category,
          priority: aiData.priority,
          summary: aiData.summary,
          location_hint: aiData.location_hint,
        } : undefined,
      };
    }

    setCurrent(result);
    setResults(prev => [result, ...prev].slice(0, 50));
    setStats(s => ({
      scanned: s.scanned + 1,
      complaints: s.complaints + (result.is_complaint ? 1 : 0),
      registered: s.registered + (result.registered ? 1 : 0),
    }));

    // Save to shared store if complaint
    if (result.is_complaint && result.ai_result?.title) {
      const scannedIssue: ScannedIssue = {
        id: result.id,
        post_text: result.post_text,
        author: post.author,
        author_handle: post.handle,
        title: result.ai_result.title || "",
        category: result.ai_result.category || "other",
        priority: result.ai_result.priority || "medium",
        summary: result.ai_result.summary || "",
        location_hint: result.ai_result.location_hint || "",
        city: CITIES.find(c => c.id === cityId)?.name || "",
        confidence: result.confidence,
        created_at: result.created_at,
        source: "x_scanner",
        registered: result.registered,
      };
      addScannedIssue(scannedIssue);
      setSavedCount(getScannedIssues().length);
      toast.success(`Issue detected: ${result.ai_result.title}`);
    }

    if (scanRef.current) setTimeout(scanNext, 3500);
  }

  function startScan() {
    scanRef.current = true;
    setScanning(true);
    scanNext();
    toast.success("X Scanner started — scanning for civic complaints");
  }

  function stopScan() {
    scanRef.current = false;
    setScanning(false);
    toast("Scanner stopped");
  }

  function handleClear() {
    clearScannedIssues();
    setSavedCount(0);
    toast("Cleared saved issues");
  }

  const CAT_COLORS: Record<string, string> = {
    pothole: "#ef4444", streetlight: "#f59e0b", pipeline: "#0891b2",
    road: "#7c3aed", drainage: "#10b981", bridge: "#1d6ff0",
    sanitation: "#f97316", parks: "#22c55e", other: "#6b7280",
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-text">NagarWatch</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/dashboard" className="btn-secondary text-xs md:text-sm py-1.5 px-2 md:px-3">Dashboard</Link>
            <Link href="/login" className="btn-primary text-xs md:text-sm py-1.5 px-3 md:px-4">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 px-4 md:px-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Twitter className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-text">X (Twitter) AI Scanner</h1>
              <p className="text-text-muted text-sm">Auto-detect civic complaints from posts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={cityId} onChange={e => setCityId(e.target.value)}
              className="input py-1.5 text-sm w-auto">
              {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {!scanning ? (
              <button onClick={startScan} className="btn-primary flex items-center gap-2 text-sm">
                <Play className="w-3.5 h-3.5" /> Start Scanner
              </button>
            ) : (
              <button onClick={stopScan} className="btn-danger flex items-center gap-2 text-sm">
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            )}
          </div>
        </div>

        {/* Live indicator */}
        {scanning && (
          <div className="flex items-center gap-2 text-sm text-success">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Scanning X for civic complaints in {CITIES.find(c => c.id === cityId)?.name}...
          </div>
        )}

        {/* Saved issues banner */}
        {savedCount > 0 && (
          <div className="flex items-center justify-between card-sm border-sky-500/30 bg-sky-500/5">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-sky-400" />
              <span className="text-sm text-sky-400 font-medium">
                {savedCount} issues saved — available in Report Issue page
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/citizen/report" className="text-xs text-accent-light hover:underline">
                Go to Report →
              </Link>
              <button onClick={handleClear} className="text-xs text-text-subtle hover:text-danger flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: "Posts Scanned", value: stats.scanned, icon: Scan, color: "text-sky-400" },
            { label: "Complaints Detected", value: stats.complaints, icon: AlertTriangle, color: "text-warning" },
            { label: "Issues Registered", value: stats.registered, icon: CheckCircle, color: "text-success" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color} mb-1`} />
              <p className="text-2xl md:text-3xl font-bold text-text">{value}</p>
              <p className="text-xs md:text-sm text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Live Feed */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity className={clsx("w-4 h-4", scanning ? "text-success animate-pulse" : "text-text-subtle")} />
              <h2 className="font-semibold text-text">Live Post Feed</h2>
              <span className="text-xs text-text-subtle ml-auto">{results.length} scanned</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {results.length === 0 && (
                <div className="text-center py-12 text-text-muted text-sm">
                  {scanning
                    ? <><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin mx-auto mb-2" /><p>Scanning posts...</p></>
                    : <p>Start the scanner to see live posts</p>}
                </div>
              )}
              {results.map((r, i) => (
                <div key={i} className={clsx(
                  "card-sm transition-all border-l-2",
                  r.is_complaint ? "border-l-warning bg-warning/5" : "opacity-50 border-l-transparent"
                )}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-sky-400 font-mono">@{r.author}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx("text-xs font-semibold", r.is_complaint ? "text-warning" : "text-success")}>
                        {r.is_complaint ? "Complaint" : "Not civic"}
                      </span>
                      <span className="text-xs text-text-subtle">
                        {Math.round((r.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-text leading-relaxed line-clamp-2">{r.post_text}</p>
                  {r.is_complaint && r.ai_result?.category && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-medium" style={{ color: CAT_COLORS[r.ai_result.category] || "#6b7280" }}>
                        {r.ai_result.category?.replace("_", " ")}
                      </span>
                      {r.ai_result?.priority && <PriorityBadge priority={r.ai_result.priority} />}
                      {r.registered && (
                        <span className="badge bg-success/10 text-success border border-success/20 text-xs">✓ Saved</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="card">
            <h2 className="font-semibold text-text mb-4">AI Analysis</h2>
            {!current ? (
              <div className="text-center py-12 text-text-muted text-sm">
                Analysis will appear here as posts are scanned
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div className="card-sm">
                  <p className="text-xs text-text-muted mb-1.5">Tweet by @{current.author}</p>
                  <p className="text-sm text-text leading-relaxed">{current.post_text}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="card-sm">
                    <p className="text-xs text-text-muted mb-1">Classification</p>
                    <p className={clsx("text-sm font-semibold", current.is_complaint ? "text-warning" : "text-success")}>
                      {current.is_complaint ? "🚨 Civic Complaint" : "✓ Not a complaint"}
                    </p>
                  </div>
                  <div className="card-sm">
                    <p className="text-xs text-text-muted mb-1">Confidence</p>
                    <p className="text-sm font-bold text-text">{((current.confidence || 0) * 100).toFixed(0)}%</p>
                  </div>
                </div>
                {current.is_complaint && current.ai_result && (
                  <>
                    {current.ai_result.title && (
                      <div className="card-sm">
                        <p className="text-xs text-text-muted mb-1">Issue Title</p>
                        <p className="text-sm text-text font-medium">{current.ai_result.title}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="card-sm">
                        <p className="text-xs text-text-muted mb-1">Category</p>
                        <p className="text-sm font-medium capitalize" style={{ color: CAT_COLORS[current.ai_result.category || ""] || "#6b7280" }}>
                          {current.ai_result.category?.replace("_", " ")}
                        </p>
                      </div>
                      <div className="card-sm">
                        <p className="text-xs text-text-muted mb-1">Priority</p>
                        {current.ai_result.priority && <PriorityBadge priority={current.ai_result.priority} />}
                      </div>
                    </div>
                    {current.ai_result.location_hint && (
                      <div className="card-sm">
                        <p className="text-xs text-text-muted mb-1">📍 Location</p>
                        <p className="text-sm text-text">{current.ai_result.location_hint}</p>
                      </div>
                    )}
                    {current.ai_result.summary && (
                      <div className="card-sm">
                        <p className="text-xs text-text-muted mb-1">Summary</p>
                        <p className="text-sm text-text-muted leading-relaxed">{current.ai_result.summary}</p>
                      </div>
                    )}
                    <div className={clsx("card-sm border", current.registered ? "border-success/30 bg-success/5" : "border-border")}>
                      <p className="text-sm font-medium text-text">
                        {current.registered
                          ? "✅ Auto-saved to Report Issue page"
                          : "⚠️ Confidence below threshold — not saved"}
                      </p>
                      {current.issue_id && (
                        <p className="text-xs text-text-muted mt-0.5">ID: {current.issue_id}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
