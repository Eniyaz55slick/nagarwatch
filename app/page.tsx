"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MapPin, Shield, Scan, BarChart3, ArrowRight, Activity, Users, CheckCircle, AlertTriangle } from "lucide-react";

interface Stats { total: number; resolved: number; open: number; resolution_rate: number; }

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get("/api/issues/city/dashboard").then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-bg bg-grid-pattern bg-grid">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-text">NagarWatch</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-sm text-accent-light mb-6">
            <Activity className="w-3.5 h-3.5" />
            AI-Powered Civic Accountability
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-text mb-6 leading-tight tracking-tight">
            Every complaint.<br />
            <span className="gradient-text">Every city. Resolved.</span>
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            NagarWatch uses AI to detect, classify, and route civic complaints to the right officials instantly. 
            From potholes to power cuts — nothing gets ignored.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register?type=citizen" className="btn-primary flex items-center gap-2 text-base px-7 py-3">
              Report an Issue <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="btn-secondary flex items-center gap-2 text-base px-7 py-3">
              View City Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      {stats && (
        <section className="pb-16 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
            {[
              { label: "Total Issues",     value: stats.total,           icon: AlertTriangle, color: "text-warning" },
              { label: "Resolved",         value: stats.resolved,        icon: CheckCircle,   color: "text-success" },
              { label: "Active",           value: stats.open,            icon: Activity,      color: "text-accent-light" },
              { label: "Resolution Rate",  value: `${stats.resolution_rate}%`, icon: BarChart3, color: "text-violet-light" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card text-center glow-accent">
                <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-text">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text text-center mb-4">Built for accountability</h2>
          <p className="text-text-muted text-center mb-14 max-w-xl mx-auto">
            Every feature is designed to ensure civic issues are tracked, resolved, and never forgotten.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Scan,
                title: "X (Twitter) Scanner",
                desc: "AI monitors Twitter/X in real time, detects civic complaints, and auto-registers them as issues.",
                color: "text-sky-400",
                bg:   "bg-sky-500/10",
              },
              {
                icon: MapPin,
                title: "GPS Issue Detection",
                desc: "Submit complaints with one tap. GPS auto-detects your city and ward for precise routing.",
                color: "text-success",
                bg:   "bg-success/10",
              },
              {
                icon: Shield,
                title: "Official Accountability",
                desc: "Every issue is assigned, tracked, and scored. Officials are ranked by resolution speed.",
                color: "text-violet-light",
                bg:   "bg-violet/10",
              },
              {
                icon: BarChart3,
                title: "Predictive Forecasting",
                desc: "AI analyzes historical data to predict upcoming civic issues before they become crises.",
                color: "text-warning",
                bg:   "bg-warning/10",
              },
              {
                icon: Users,
                title: "Citizen Gamification",
                desc: "Points, tiers, and leaderboards reward citizens for reporting, verifying, and engaging.",
                color: "text-accent-light",
                bg:   "bg-accent/10",
              },
              {
                icon: Activity,
                title: "Monthly PDF Reports",
                desc: "Auto-generated performance reports for each city, complete with ward stats and rankings.",
                color: "text-pink-400",
                bg:   "bg-pink-500/10",
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="card hover:border-border-light transition-colors duration-300">
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-text mb-2">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center card glow-accent">
          <h2 className="text-3xl font-bold text-text mb-3">Ready to make your city better?</h2>
          <p className="text-text-muted mb-8">Join citizens and officials across India on NagarWatch.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register?type=citizen" className="btn-primary flex items-center gap-2">
              Register as Citizen <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register?type=official" className="btn-secondary">
              Register as Official
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-text">NagarWatch</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="/dashboard" className="hover:text-text transition-colors">Dashboard</Link>
            <Link href="/scanner"   className="hover:text-text transition-colors">X Scanner</Link>
            <Link href="/login"     className="hover:text-text transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-text-subtle">Civic accountability for Indian cities</p>
        </div>
      </footer>
    </div>
  );
}
