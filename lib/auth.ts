export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city_id?: string;
  points?: number;
  tier?: string;
  trust_score?: number;
  report_count?: number;
  department?: string;
  ward_name?: string;
  performance_score?: number;
  designation?: string;
}

export function saveAuth(token: string, type: "citizen" | "official", user: User) {
  localStorage.setItem("nw_token", token);
  localStorage.setItem("nw_type",  type);
  localStorage.setItem("nw_user",  JSON.stringify(user));
}

export function getAuth(): { token: string | null; type: string | null; user: User | null } {
  if (typeof window === "undefined") return { token: null, type: null, user: null };
  const token = localStorage.getItem("nw_token");
  const type  = localStorage.getItem("nw_type");
  const raw   = localStorage.getItem("nw_user");
  const user  = raw ? JSON.parse(raw) : null;
  return { token, type, user };
}

export function logout() {
  localStorage.removeItem("nw_token");
  localStorage.removeItem("nw_type");
  localStorage.removeItem("nw_user");
  window.location.href = "/";
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem("nw_token");
}
