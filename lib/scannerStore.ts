// Shared store for X-scanner detected issues
// These get displayed in the citizen reports page

export interface ScannedIssue {
  id: string;
  post_text: string;
  author: string;
  author_handle: string;
  title: string;
  category: string;
  priority: string;
  summary: string;
  location_hint: string;
  city: string;
  confidence: number;
  created_at: string;
  source: "x_scanner";
  registered: boolean;
  likes?: number;
  retweets?: number;
}

// In-memory store (persists during session)
const STORE_KEY = "nw_scanned_issues";

export function getScannedIssues(): ScannedIssue[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addScannedIssue(issue: ScannedIssue) {
  if (typeof window === "undefined") return;
  const existing = getScannedIssues();
  const updated = [issue, ...existing].slice(0, 100); // keep last 100
  sessionStorage.setItem(STORE_KEY, JSON.stringify(updated));
}

export function clearScannedIssues() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORE_KEY);
}
