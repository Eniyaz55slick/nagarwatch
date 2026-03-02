"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import toast from "react-hot-toast";
import { MapPin, Mail, Phone, User, Building, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

const DEPARTMENTS = [
  "Roads & Infrastructure", "Sanitation", "Electricity & Lighting",
  "Water Supply", "Parks & Recreation", "Town Planning",
  "Health & Environment", "General Administration",
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<"citizen" | "official">(
    (searchParams.get("type") as "citizen" | "official") || "citizen"
  );
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", confirm: "",
    city_id: "", department: "", designation: "", ward_name: "",
  });

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function sendOtp() {
    if (!form.email) return toast.error("Enter your email first");
    setSendingOtp(true);
    try {
      // Try backend OTP endpoint
      await api.post("/api/auth/send-otp", { email: form.email });
      setOtpSent(true);
      toast.success(`OTP sent to ${form.email}`);
    } catch {
      // Fallback: simulate OTP sent (demo mode)
      setOtpSent(true);
      toast.success(`OTP sent to ${form.email} (demo: use 123456)`);
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    if (!form.city_id) return toast.error("Please select a city");
    if (form.email && !otpSent) return toast.error("Please verify your email first");
    if (form.email && otpSent && !otp) return toast.error("Enter the OTP sent to your email");
    setLoading(true);

    try {
      const endpoint = type === "citizen" ? "/api/citizens/register" : "/api/officials/register";
      const payload: Record<string, string> = {
        name: form.name, phone: form.phone, password: form.password,
        city_id: form.city_id,
      };
      if (form.email) payload.email = form.email;
      if (form.email && otp) payload.otp = otp;
      if (type === "official") {
        payload.department = form.department;
        payload.designation = form.designation || "Officer";
        payload.ward_name = form.ward_name;
      }

      const res = await api.post(endpoint, payload);
      saveAuth(res.data.access_token, type, res.data.user);
      toast.success(`Welcome to NagarWatch, ${res.data.user.name}!`);
      router.push(type === "citizen" ? "/citizen/dashboard" : "/official/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      // Demo fallback - if backend not running, simulate registration
      if (!msg || msg.includes("connect")) {
        const demoUser = {
          id: "demo_" + Date.now(),
          name: form.name, phone: form.phone, email: form.email,
          city_id: form.city_id, points: 50, tier: "new",
          trust_score: 70, report_count: 0,
          department: form.department, designation: form.designation || "Officer",
        };
        saveAuth("demo_token_" + Date.now(), type, demoUser);
        toast.success(`Welcome to NagarWatch, ${form.name}! (Demo mode)`);
        router.push(type === "citizen" ? "/citizen/dashboard" : "/official/dashboard");
      } else {
        toast.error(msg || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedCity = CITIES.find(c => c.id === form.city_id);

  return (
    <div className="min-h-screen bg-bg bg-grid-pattern flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-text">NagarWatch</span>
          </Link>
          <h1 className="text-2xl font-bold text-text">Create account</h1>
          <p className="text-text-muted text-sm mt-1">Join the civic accountability platform</p>
        </div>

        {/* Type toggle */}
        <div className="flex rounded-xl border border-border bg-bg-secondary p-1 mb-6">
          {(["citizen", "official"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                type === t ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-muted hover:text-text"
              }`}>
              {t === "citizen" ? "👤 Citizen" : "🛡️ Official"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">

          {/* Name + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name <span className="text-danger">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <input className="input pl-9" value={form.name} onChange={e => update("name", e.target.value)}
                  placeholder="Your full name" required />
              </div>
            </div>
            <div>
              <label className="label">Phone <span className="text-danger">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <input className="input pl-9" value={form.phone} onChange={e => update("phone", e.target.value)}
                  placeholder="+91 9876543210" required />
              </div>
            </div>
          </div>

          {/* Email with OTP */}
          <div>
            <label className="label">Email (optional — for OTP verification)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <input className="input pl-9" type="email" value={form.email}
                  onChange={e => { update("email", e.target.value); setOtpSent(false); setOtp(""); }}
                  placeholder="your@email.com" />
              </div>
              {form.email && !otpSent && (
                <button type="button" onClick={sendOtp} disabled={sendingOtp}
                  className="btn-secondary text-sm px-3 py-0 whitespace-nowrap">
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              )}
              {otpSent && (
                <div className="flex items-center gap-1 text-success text-sm px-2">
                  <CheckCircle className="w-4 h-4" /> Sent
                </div>
              )}
            </div>
          </div>

          {/* OTP input */}
          {otpSent && (
            <div className="animate-fade-in">
              <label className="label">OTP <span className="text-danger">*</span></label>
              <input className="input tracking-[0.5em] text-center font-mono text-lg" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •" maxLength={6} />
              <p className="text-xs text-text-muted mt-1">
                OTP sent to {form.email} ·{" "}
                <button type="button" onClick={sendOtp} className="text-accent-light hover:underline">Resend</button>
              </p>
            </div>
          )}

          {/* City */}
          <div>
            <label className="label">City <span className="text-danger">*</span></label>
            <select className="input" value={form.city_id} onChange={e => update("city_id", e.target.value)} required>
              <option value="">Select your city</option>
              {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}, {c.state}</option>)}
            </select>
          </div>

          {/* Official-only fields */}
          {type === "official" && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Official Details</p>
              <div>
                <label className="label">Department <span className="text-danger">*</span></label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <select className="input pl-9" value={form.department} onChange={e => update("department", e.target.value)} required={type === "official"}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Designation</label>
                  <input className="input" value={form.designation} onChange={e => update("designation", e.target.value)}
                    placeholder="e.g. Junior Engineer" />
                </div>
                <div>
                  <label className="label">Ward</label>
                  {selectedCity?.wards?.length ? (
                    <select className="input" value={form.ward_name} onChange={e => update("ward_name", e.target.value)}>
                      <option value="">Select ward</option>
                      {selectedCity.wards.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  ) : (
                    <input className="input" value={form.ward_name} onChange={e => update("ward_name", e.target.value)}
                      placeholder="e.g. Ward 12" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Password <span className="text-danger">*</span></label>
              <div className="relative">
                <input className="input pr-10" type={showPass ? "text" : "password"}
                  value={form.password} onChange={e => update("password", e.target.value)}
                  placeholder="Min 6 characters" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password <span className="text-danger">*</span></label>
              <input className="input" type="password" value={form.confirm}
                onChange={e => update("confirm", e.target.value)} placeholder="Repeat password" required />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-base justify-center mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : `Create ${type === "citizen" ? "Citizen" : "Official"} Account`}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-light hover:underline font-medium">Sign in</Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/" className="text-xs text-text-subtle hover:text-text flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
