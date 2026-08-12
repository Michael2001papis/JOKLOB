const TOKEN_KEY = "joklob_token";
const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function req(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(apiUrl(path), { ...init, headers });
  if (res.status === 401) {
    setToken(null);
    if (!path.includes("/auth/login")) window.location.assign("/login");
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(data?.detail || data?.error || res.statusText);
  return data;
}

export async function downloadAuth(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(apiUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  register: (body: object) => req("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    return req("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  },
  me: () => req("/api/auth/me"),
  patchMe: (body: object) => req("/api/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
  projects: () => req("/api/projects"),
  createProject: (body: object) => req("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  getProject: (id: number) => req(`/api/projects/${id}`),
  deleteProject: (id: number) => req(`/api/projects/${id}`, { method: "DELETE" }),
  parse: (body: object) => req("/api/research/parse", { method: "POST", body: JSON.stringify(body) }),
  solve: (body: object) => req("/api/research/solve", { method: "POST", body: JSON.stringify(body) }),
  problems: () => req("/api/research/problems"),
  problem: (id: number) => req(`/api/research/problems/${id}`),
  math: (body: object) => req("/api/labs/math", { method: "POST", body: JSON.stringify(body) }),
  numbers: (body: object) => req("/api/labs/numbers", { method: "POST", body: JSON.stringify(body) }),
  between: (body: object) => req("/api/labs/between", { method: "POST", body: JSON.stringify(body) }),
  physics: (body: object) => req("/api/labs/physics", { method: "POST", body: JSON.stringify(body) }),
  physicsScenarios: () => req("/api/labs/physics/scenarios"),
  axioms: (body: object) => req("/api/labs/axioms", { method: "POST", body: JSON.stringify(body) }),
  upload: (fd: FormData) => req("/api/documents", { method: "POST", body: fd }),
  documents: (projectId?: number) => req("/api/documents" + (projectId ? `?project_id=${projectId}` : "")),
  document: (id: number) => req(`/api/documents/${id}`),
  patchDoc: (id: number, body: object) => req(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteDoc: (id: number) => req(`/api/documents/${id}`, { method: "DELETE" }),
  shareDoc: (id: number, hours = 48) => req(`/api/documents/${id}/share`, { method: "POST", body: JSON.stringify({ hours }) }),
  pdf: (body: object) => req("/api/pdf", { method: "POST", body: JSON.stringify(body) }),
  pdfs: () => req("/api/pdf"),
  search: (q: string) => req(`/api/search?q=${encodeURIComponent(q)}`),
  activity: () => req("/api/activity"),
  saveDraft: (key: string, payload: object) => req("/api/drafts", { method: "POST", body: JSON.stringify({ key, payload }) }),
  drafts: () => req("/api/drafts"),
};
