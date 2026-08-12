import { useEffect, useRef, type ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { NavLink, useNavigate } from "react-router-dom";
import { t, type Lang } from "./i18n";

export function Tag({ cert }: { cert?: any }) {
  if (!cert) return null;
  const code = cert.code || cert;
  const cls = cert.tag || {
    verified_math: "verified",
    numerically_checked: "numeric",
    unproven_conjecture: "conjecture",
    theoretical_model: "model",
    partial: "partial",
    insufficient_info: "unknown",
    contradiction_impossible: "impossible",
  }[code] || "partial";
  const label = cert.he || cert.en || code;
  return <span className={`tag ${cls}`}>{label}</span>;
}

export function MathTex({ tex, display = true }: { tex?: string; display?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !tex) return;
    try {
      katex.render(tex, ref.current, { throwOnError: false, displayMode: display });
    } catch {
      ref.current.textContent = tex;
    }
  }, [tex, display]);
  if (!tex) return null;
  return <div className="math" ref={ref} />;
}

export function Chart({ x, y, name = "y", title = "" }: { x: number[]; y: number[]; name?: string; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !x?.length) return;
    let cancelled = false;
    (async () => {
    if (!ref.current || cancelled) return;
    const Plotly = await import("plotly.js-dist-min");
    if (!ref.current || cancelled) return;
    Plotly.newPlot(
      ref.current,
      [{ x, y, name, line: { color: "#7ee7ff" }, mode: "lines" }],
      {
        margin: { t: 28, r: 12, l: 36, b: 36 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#9bb0d0", size: 11 },
        title: { text: title, font: { size: 13 } },
        xaxis: { gridcolor: "rgba(126,231,255,0.12)" },
        yaxis: { gridcolor: "rgba(126,231,255,0.12)" },
        height: 220,
      },
      { displayModeBar: false, responsive: true }
    );
    })();
    return () => { cancelled = true; };
  }, [x, y, name, title]);
  return <div ref={ref} style={{ direction: "ltr" }} />;
}

export function Shell({ lang, children, title }: { lang: Lang; children: ReactNode; title?: string }) {
  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">JOKLOB LAB</div>
        <div className="muted">{title}</div>
      </div>
      {children}
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          {t(lang, "home")}
        </NavLink>
        <NavLink to="/labs" className={({ isActive }) => (isActive ? "active" : "")}>
          {t(lang, "labs")}
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => (isActive ? "active" : "")}>
          {t(lang, "projects")}
        </NavLink>
        <NavLink to="/docs" className={({ isActive }) => (isActive ? "active" : "")}>
          {t(lang, "docs")}
        </NavLink>
        <NavLink to="/more" className={({ isActive }) => (isActive ? "active" : "")}>
          {t(lang, "more")}
        </NavLink>
      </nav>
    </div>
  );
}

export function useDraft(key: string, value: string) {
  useEffect(() => {
    localStorage.setItem("draft:" + key, value);
  }, [key, value]);
}

export function readDraft(key: string) {
  return localStorage.getItem("draft:" + key) || "";
}

export function Guard({ token, children }: { token: string | null; children: ReactNode }) {
  const nav = useNavigate();
  useEffect(() => {
    if (!token) nav("/login");
  }, [token, nav]);
  if (!token) return null;
  return <>{children}</>;
}
