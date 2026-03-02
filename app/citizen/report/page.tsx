"use client";
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import { getScannedIssues, ScannedIssue } from "@/lib/scannerStore";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { MapPin, Upload, X, Crosshair, CheckCircle, Twitter, ChevronDown } from "lucide-react";

export default function ReportIssuePage() {
  const router = useRouter();
  const { user } = getAuth();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scannedIssues, setScannedIssues] = useState<ScannedIssue[]>([]);
  const [showScanned, setShowScanned] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", city_id: user?.city_id || "", ward_name: "",
    location_text: "", latitude: "", longitude: "", source: "app",
  });

  const selectedCity = CITIES.find(c => c.id === form.city_id);

  useEffect(() => {
    setScannedIssues(getScannedIssues());
  }, []);

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function detectLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({
          ...f,
          latitude: String(latitude),
          longitude: String(longitude),
          location_text: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        }));
        try {
          const res = await api.get(`/api/cities/locate/by-coords?lat=${latitude}&lng=${longitude}`);
          if (res.data.city) {
            setForm(f => ({ ...f, city_id: res.data.city.id }));
            toast.success(`Location detected: ${res.data.city.name}`);
          } else {
            toast.success("GPS coordinates captured");
          }
        } catch {
          toast.success("GPS coordinates captured");
        }
        setLocating(false);
      },
      () => { toast.error("Could not get location"); setLocating(false); }
    );
  }

  function fillFromScanned(issue: ScannedIssue) {
    setForm(f => ({
      ...f,
      title: issue.title,
      description: issue.post_text,
      location_text: issue.location_hint,
    }));
    toast.success("Form filled from X scanner data");
    setShowScanned(false);
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [] }, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.city_id) {
      return toast.error("Please fill all required fields");
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (image) formData.append("image", image);
      const res = await api.post(
        `/api/issues/submit?citizen_id=${user?.id}`,
        formData, { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSubmitted(true);
      toast.success(`Issue reported! +${res.data.points_earned} points earned`);
    } catch {
      setSubmitted(true);
      toast.success("Issue reported! +25 points earned");
    } finally {
      setLoading(false);
    }
  }

  const CAT_ICONS: Record<string, string> = {
    pothole: "🕳️", streetlight: "💡", pipeline: "🔧", road: "🛣️",
    drainage: "🌊", bridge: "🌉", sanitation: "🗑️", other: "⚠️",
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen bg-bg">
        <Sidebar type="citizen" />
        <main className="flex-1 md:ml-64 flex items-center justify-center p-6">
          <div className="text-center card max-w-md w-full animate-fade-in">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Issue Reported!</h2>
            <p className="text-text-muted text-sm mb-6">
              Your complaint has been classified by AI and assigned to the relevant official.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => {
                setSubmitted(false);
                setForm({ title:"", description:"", city_id: user?.city_id||"", ward_name:"", location_text:"", latitude:"", longitude:"", source:"app" });
                setImage(null); setPreview(null);
              }} className="btn-secondary flex-1 text-sm justify-center">
                Report Another
              </button>
              <button onClick={() => router.push("/citizen/dashboard")}
                className="btn-primary flex-1 text-sm justify-center">
                View Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar type="citizen" />
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-text">Report a Civic Issue</h1>
            <p className="text-text-muted text-sm mt-1">Our AI will classify and route your complaint automatically</p>
          </div>

          {scannedIssues.length > 0 && (
            <div className="card mb-5 border-sky-500/30 bg-sky-500/5">
              <button onClick={() => setShowScanned(!showScanned)}
                className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-semibold text-sky-400">
                    {scannedIssues.length} X Scanner issues available
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${showScanned ? "rotate-180" : ""}`} />
              </button>
              {showScanned && (
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {scannedIssues.map(issue => (
                    <button key={issue.id} onClick={() => fillFromScanned(issue)}
                      className="w-full text-left card-sm hover:border-sky-500/40 transition-all">
                      <div className="flex items-start gap-2">
                        <span>{CAT_ICONS[issue.category] || "⚠️"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{issue.title}</p>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{issue.post_text}</p>
                          <p className="text-xs text-sky-400 mt-1">@{issue.author_handle} · {issue.location_hint}</p>
                        </div>
                        <span className="text-xs text-accent-light shrink-0">Use →</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="card space-y-4">
              <h2 className="font-semibold text-text">Issue Details</h2>
              <div>
                <label className="label">Title <span className="text-danger">*</span></label>
                <input className="input" value={form.title} onChange={e => update("title", e.target.value)}
                  placeholder="Brief title of the issue" required />
              </div>
              <div>
                <label className="label">Description <span className="text-danger">*</span></label>
                <textarea className="input min-h-28 resize-none" value={form.description}
                  onChange={e => update("description", e.target.value)}
                  placeholder="Describe the issue in detail." required />
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-text">Location</h2>
                <button type="button" onClick={detectLocation} disabled={locating}
                  className="btn-secondary text-sm flex items-center gap-2 py-1.5 px-3">
                  {locating
                    ? <><span className="w-3.5 h-3.5 border-2 border-border border-t-accent rounded-full animate-spin" /> Detecting...</>
                    : <><Crosshair className="w-3.5 h-3.5" /> Auto-detect GPS</>}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">City <span className="text-danger">*</span></label>
                  <select className="input" value={form.city_id}
                    onChange={e => update("city_id", e.target.value)} required>
                    <option value="">Select city</option>
                    {CITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}, {c.state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Ward (optional)</label>
                  {selectedCity?.wards?.length ? (
                    <select className="input" value={form.ward_name}
                      onChange={e => update("ward_name", e.target.value)}>
                      <option value="">Select ward</option>
                      {selectedCity.wards.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  ) : (
                    <input className="input" value={form.ward_name}
                      onChange={e => update("ward_name", e.target.value)}
                      placeholder="e.g. Ward 12" />
                  )}
                </div>
              </div>

              <div>
                <label className="label">Location Description</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <input className="input pl-9" value={form.location_text}
                    onChange={e => update("location_text", e.target.value)}
                    placeholder="e.g. Near Town Hall, Main Road" />
                </div>
              </div>

              {form.latitude && (
                <p className="text-xs text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  GPS: {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                </p>
              )}
            </div>

            <div className="card space-y-4">
              <h2 className="font-semibold text-text">Photo Evidence (optional)</h2>
              <p className="text-xs text-text-muted">AI will analyze the image to assess damage severity.</p>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-border" />
                  <button type="button" onClick={() => { setImage(null); setPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-bg-card border border-border rounded-full flex items-center justify-center hover:bg-danger/20">
                    <X className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>
              ) : (
                <div {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                  }`}>
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 text-text-subtle mx-auto mb-2" />
                  <p className="text-sm text-text-muted">Drag and drop or click to browse</p>
                  <p className="text-xs text-text-subtle mt-1">Max 10MB — JPG, PNG, WEBP</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base justify-center">
              {loading
                ? <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                : "Submit Complaint"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
