"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, getAuth } from "@/lib/auth";
import clsx from "clsx";
import {
  LayoutDashboard, FilePlus, List, Trophy, Scan,
  BarChart3, Settings, LogOut, Shield, MapPin
} from "lucide-react";

const CITIZEN_LINKS = [
  { href: "/citizen/dashboard", label: "Overview",        icon: LayoutDashboard },
  { href: "/citizen/report",    label: "Report Issue",    icon: FilePlus },
  { href: "/citizen/issues",    label: "My Complaints",   icon: List },
  { href: "/citizen/leaderboard", label: "Leaderboard",  icon: Trophy },
];

const OFFICIAL_LINKS = [
  { href: "/official/dashboard", label: "Overview",       icon: LayoutDashboard },
  { href: "/official/assigned",  label: "Assigned Issues",icon: List },
  { href: "/official/resolved",  label: "Resolved",       icon: Shield },
  { href: "/official/leaderboard", label: "Rankings",     icon: Trophy },
];

const COMMON_LINKS = [
  { href: "/dashboard",  label: "City Dashboard", icon: BarChart3 },
  { href: "/scanner",    label: "X Scanner",      icon: Scan },
];

export function Sidebar({ type }: { type: "citizen" | "official" }) {
  const pathname = usePathname();
  const { user }  = getAuth();
  const links     = type === "citizen" ? CITIZEN_LINKS : OFFICIAL_LINKS;

  return (
    <aside className="w-64 min-h-screen bg-bg-secondary border-r border-border flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-text text-lg tracking-tight">NagarWatch</span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="card-sm">
          <p className="text-sm font-semibold text-text truncate">{user?.name || "User"}</p>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            {type === "citizen" ? `${user?.points || 0} points` : user?.department || "Official"}
          </p>
          <div className="mt-2">
            <span className={clsx(
              "badge text-xs",
              type === "citizen"
                ? "bg-accent/10 text-accent-light border border-accent/20"
                : "bg-violet/10 text-violet-light border border-violet/20"
            )}>
              {type === "citizen" ? (user?.tier || "new") : (user?.designation || "Officer")}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider px-3 mb-2">
          {type === "citizen" ? "Citizen Portal" : "Official Portal"}
        </p>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx("sidebar-link", pathname === href && "active")}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-border">
          <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider px-3 mb-2">
            Platform
          </p>
          {COMMON_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx("sidebar-link", pathname === href && "active")}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={logout}
          className="sidebar-link w-full text-danger hover:bg-danger/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
