"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import toast from "react-hot-toast";
import { MapPin, Eye, EyeOff, Mail, Phone, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [type, setType] = useState<"citizen" | "official">("citizen");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  async function sendLoginOtp() {
    if (!email) return toast.error("Enter your email first");
    setSendingOtp(true);
    try {
      await api.post("/api/auth/send-otp", { email });
      setOtpSent(true);
      toast.success(`OTP sent to ${email}`);
    } catch {
      setOtpSent(true);
      toast.success(`OTP sent to ${email} (demo: use 123456)`);
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loginMethod === "password" && (!phone || !pass)) return toast.error("Please fill all fields");
    if (loginMethod === "otp" && (!email || !otp)) return toast.error("Enter email and OTP");
    setLoading(true);
    try {
      const endpoint = type === "citizen" ? "/api/citizens/login" : "/api/officials/login";
      const payload = loginMethod === "password"
        ? { phone, password: pass }
        : { email, otp };
      const res = await api.post(endpoint, payload);
      saveAuth(res.data.access_token, type, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      router.push(type === "citizen" ? "/citizen/dashboard" : "/official/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      // Demo fallback
      if (!msg || msg.includes("connect")) {
        const demoUser = type === "citizen"
          ? { id: "c1", name: "Ravi Kumar", phone, email, city_id: "coimbatore", points: 340, tier: "active", trust_score: 82, report_count: 8 }
          : { id: "o1", name: "Priya Sharma", phone, email, city_id: "coimbatore", department: "Roads & Infrastructure", designation: "Junior Engineer", performance_score: 78 };
        saveAuth("demo_token", type, demoUser);
        toast.success(`Welcome back! (Demo mode)`);
        router.push(type === "citizen" ? "/citizen/dashboard" : "/official/dashboard");
      } else {
        toast.error(msg || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg bg-grid-pattern flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-text">NagarWatch</span>
          </Link>
          <h1 className="text-2xl font-bold text-text">Sign in</h1>
          <p className="text-text-muted text-sm mt-1">Continue to your account</p>
        </div>

        {/* Type toggle */}
        <div className="flex rounded-xl border border-border bg-bg-secondary p-1 mb-4">
          {(["citizen", "official"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                type === t ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-muted hover:text-text"
              }`}>
              {t === "citizen" ? "👤 Citizen" : "🛡️ Official"}
            </button>
          ))}
        </div>

        {/* Login method toggle */}
        <div className="flex rounded-lg border border-border bg-bg-secondary p-1 mb-6">
          <button onClick={() => setLoginMethod("password")}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              loginMethod === "password" ? "bg-bg-card text-text shadow" : "text-text-muted"
            }`}>
            📱 Phone + Password
          </button>
          <button onClick={() => setLoginMethod("otp")}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              loginMethod === "otp" ? "bg-bg-card text-text shadow" : "text-text-muted"
            }`}>
            📧 Email OTP
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {loginMethod === "password" ? (
            <>
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="Enter your phone number" className="input pl-9" required />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={pass}
                    onChange={e => setPass(e.target.value)} placeholder="Enter your password"
                    className="input pr-10" required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Email Address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setOtpSent(false); setOtp(""); }}
                      placeholder="your@email.com" className="input pl-9" required />
                  </div>
                  <button type="button" onClick={sendLoginOtp} disabled={sendingOtp || !email}
                    className="btn-secondary text-sm px-3 whitespace-nowrap">
                    {sendingOtp ? "..." : otpSent ? "Resend" : "Send OTP"}
                  </button>
                </div>
              </div>
              {otpSent && (
                <div className="animate-fade-in">
                  <label className="label">OTP</label>
                  <input className="input tracking-[0.5em] text-center font-mono text-lg"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •" maxLength={6} required />
                  <p className="text-xs text-text-muted mt-1">OTP sent to {email} · Demo mode: use 123456</p>
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 justify-center mt-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {/* Demo shortcuts */}
        <div className="card mt-4 p-4">
          <p className="text-xs uppercase tracking-wider text-text-subtle font-semibold mb-3">
            ⚡ Demo Quick Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary text-xs py-2 justify-center"
              onClick={() => {
                const u = { id:"c1", name:"Ravi Kumar", phone:"9876543210", city_id:"coimbatore", points:340, tier:"active", trust_score:82, report_count:8 };
                saveAuth("demo_token", "citizen", u);
                toast.success("Logged in as Citizen");
                router.push("/citizen/dashboard");
              }}>
              Enter as Citizen
            </button>
            <button className="btn-secondary text-xs py-2 justify-center"
              onClick={() => {
                const u = { id:"o1", name:"Priya Sharma", phone:"9123456780", city_id:"coimbatore", department:"Roads & Infrastructure", designation:"Junior Engineer", performance_score:78 };
                saveAuth("demo_token", "official", u);
                toast.success("Logged in as Official");
                router.push("/official/dashboard");
              }}>
              Enter as Official
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          No account?{" "}
          <Link href="/register" className="text-accent-light hover:underline font-medium">Create one</Link>
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
