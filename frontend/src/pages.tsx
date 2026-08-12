import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, downloadAuth, setToken } from "./api";
import { t, type Lang } from "./i18n";
import { Chart, MathTex, Shell, Tag, readDraft, useDraft } from "./ui";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: string;
  setTheme: (t: string) => void;
  user: any;
  setUser: (u: any) => void;
  refreshUser: () => Promise<void>;
};

function errText(e: any) {
  return e?.message || String(e);
}

export function Login({ ctx }: { ctx: Ctx }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("demo@joklob.local");
  const [password, setPassword] = useState("demo12345");
  const [name, setName] = useState("חוקר");
  const [mode, setMode] = useState<"login" | "reg">("login");
  const [err, setErr] = useState("");
  async function go() {
    setErr("");
    try {
      const r =
        mode === "login"
          ? await api.login(email, password)
          : await api.register({ email, password, name, language: ctx.lang });
      setToken(r.access_token);
      ctx.setUser(r.user);
      nav("/");
    } catch (e) {
      setErr(errText(e));
    }
  }
  return (
    <div className="app-shell">
      <h1>JOKLOB</h1>
      <p>{t(ctx.lang, "subtitle")}</p>
      {mode === "reg" && (
        <>
          <label>{t(ctx.lang, "name")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </>
      )}
      <label>{t(ctx.lang, "email")}</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
      <label>{t(ctx.lang, "password")}</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <p className="err">{err}</p>}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={go}>
          {mode === "login" ? t(ctx.lang, "login") : t(ctx.lang, "register")}
        </button>
      </div>
      <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => setMode(mode === "login" ? "reg" : "login")}>
        {mode === "login" ? t(ctx.lang, "register") : t(ctx.lang, "login")}
      </button>
      <p className="muted">{t(ctx.lang, "demo")}</p>
    </div>
  );
}

export function Home({ ctx }: { ctx: Ctx }) {
  const items = [
    { to: "/research", k: "newResearch", s: "שפה טבעית → ניסוח → חישוב" },
    { to: "/projects", k: "openProject", s: "פתיחה ועריכה" },
    { to: "/math", k: "newCalc", s: "SymPy / יחידות / ODE" },
    { to: "/numbers", k: "numberLab", s: "סדרות בלי ניבוי הגרלות" },
    { to: "/physics", k: "physicsLab", s: "סימולציה עם הנחות" },
    { to: "/axioms", k: "axiomLab", s: "עולם עם חוקים מוגדרים" },
    { to: "/docs", k: "uploadDoc", s: "PDF DOCX TXT CSV תמונה" },
    { to: "/pdf", k: "makePdf", s: "דוח עברי עם נוסחאות" },
    { to: "/history", k: "history", s: "פעילות וחישובים" },
    { to: "/search", k: "search", s: "פרויקטים ומסמכים" },
  ] as const;
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "home")}>
      <h1>{t(ctx.lang, "subtitle")}</h1>
      <p>{t(ctx.lang, "noFake")}</p>
      <div className="grid">
        {items.map((it) => (
          <Link className="tile" key={it.to} to={it.to}>
            <b>{t(ctx.lang, it.k)}</b>
            <span>{it.s}</span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

export function LabsHub({ ctx }: { ctx: Ctx }) {
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "labs")}>
      <h1>{t(ctx.lang, "labs")}</h1>
      <div className="grid">
        <Link className="tile" to="/math"><b>{t(ctx.lang, "newCalc")}</b><span>algebra · calculus · units</span></Link>
        <Link className="tile" to="/numbers"><b>{t(ctx.lang, "numberLab")}</b><span>factors · patterns</span></Link>
        <Link className="tile" to="/physics"><b>{t(ctx.lang, "physicsLab")}</b><span>classical → quantum toys</span></Link>
        <Link className="tile" to="/axioms"><b>{t(ctx.lang, "axiomLab")}</b><span>finite worlds</span></Link>
        <Link className="tile" to="/between"><b>{t(ctx.lang, "between")}</b><span>1 → 2 density</span></Link>
        <Link className="tile" to="/research"><b>{t(ctx.lang, "newResearch")}</b><span>NL pipeline</span></Link>
      </div>
    </Shell>
  );
}

export function Projects({ ctx }: { ctx: Ctx }) {
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  async function load() {
    setRows(await api.projects());
  }
  useEffect(() => { load(); }, []);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "projects")}>
      <h1>{t(ctx.lang, "projects")}</h1>
      <label>{t(ctx.lang, "title")}</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <label>{t(ctx.lang, "description")}</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      <button className="btn" style={{ marginTop: 8 }} onClick={async () => {
        if (!title.trim()) return;
        await api.createProject({ title, description, domain: "general" });
        setTitle(""); setDescription(""); load();
      }}>{t(ctx.lang, "createProject")}</button>
      {rows.map((p) => (
        <Link className="list-item" key={p.id} to={`/projects/${p.id}`}>
          <b>{p.title}</b>
          <div className="muted">{p.domain} · {p.updated_at}</div>
        </Link>
      ))}
    </Shell>
  );
}

export function ProjectDetail({ ctx }: { ctx: Ctx }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  useEffect(() => {
    const n = Number(id);
    api.getProject(n).then(setP);
    api.documents(n).then(setDocs);
  }, [id]);
  if (!p) return <Shell lang={ctx.lang}><p>…</p></Shell>;
  return (
    <Shell lang={ctx.lang} title={p.title}>
      <h1>{p.title}</h1>
      <p>{p.description}</p>
      <div className="row">
        <Link className="btn" to={`/research?project=${p.id}`}>{t(ctx.lang, "newResearch")}</Link>
      </div>
      <h2>{t(ctx.lang, "docs")}</h2>
      {docs.map((d) => <div className="list-item" key={d.id}>{d.original_name}</div>)}
      <button className="btn danger" style={{ marginTop: 16 }} onClick={async () => {
        await api.deleteProject(p.id); nav("/projects");
      }}>{t(ctx.lang, "delete")}</button>
    </Shell>
  );
}

export function Research({ ctx }: { ctx: Ctx }) {
  const projectId = Number(new URLSearchParams(window.location.search).get("project") || 0) || null;
  const [text, setText] = useState(readDraft("research"));
  const [parsed, setParsed] = useState<any>(null);
  const [problemId, setProblemId] = useState<number | null>(null);
  const [vars, setVars] = useState<any[]>([]);
  const [assumptions, setAssumptions] = useState<any[]>([]);
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");
  useDraft("research", text);
  useEffect(() => { api.saveDraft("research", { text }).catch(() => {}); }, [text]);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "newResearch")}>
      <h1>{t(ctx.lang, "newResearch")}</h1>
      <label>{t(ctx.lang, "problem")}</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="לדוגמה: פתור: x^2 - 5*x + 6 = 0" />
      <p className="muted">{t(ctx.lang, "offline")}</p>
      <button className="btn" onClick={async () => {
        setErr(""); setResult(null);
        try {
          const r = await api.parse({ text, project_id: projectId });
          setParsed(r);
          setProblemId(r.problem_id);
          const full = await api.problem(r.problem_id);
          setVars(full.variables);
          setAssumptions(full.assumptions);
          setExpr(r.parsed.expression || "");
        } catch (e) { setErr(errText(e)); }
      }}>{t(ctx.lang, "parse")}</button>
      {err && <p className="err">{err}</p>}
      {parsed && (
        <div className="card" style={{ marginTop: 12 }}>
          <Tag cert={parsed.certainty} />
          <div className="muted">{t(ctx.lang, "domain")}: {parsed.parsed.domain} · {parsed.parsed.intent}</div>
          <h2>{t(ctx.lang, "formal")}</h2>
          <p>{parsed.parsed.formal_statement}</p>
          {!!parsed.parsed.missing?.length && (
            <>
              <h2>{t(ctx.lang, "missing")}</h2>
              <ul>{parsed.parsed.missing.map((m: string) => <li key={m}>{m}</li>)}</ul>
            </>
          )}
          <h2>{t(ctx.lang, "assumptions")}</h2>
          {assumptions.map((a, i) => (
            <label key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="checkbox" checked={!!a.confirmed} onChange={(e) => {
                const n = [...assumptions]; n[i] = { ...a, confirmed: e.target.checked }; setAssumptions(n);
              }} />
              <textarea value={a.text} onChange={(e) => {
                const n = [...assumptions]; n[i] = { ...a, text: e.target.value }; setAssumptions(n);
              }} />
            </label>
          ))}
          <h2>{t(ctx.lang, "variables")}</h2>
          {vars.map((v, i) => (
            <div key={v.id} className="row" style={{ marginBottom: 6 }}>
              <input value={v.name} readOnly />
              <input placeholder="value" value={v.value} onChange={(e) => {
                const n = [...vars]; n[i] = { ...v, value: e.target.value, confirmed: true }; setVars(n);
              }} />
              <input placeholder="unit" value={v.unit} onChange={(e) => {
                const n = [...vars]; n[i] = { ...v, unit: e.target.value }; setVars(n);
              }} />
            </div>
          ))}
          <label>Expression</label>
          <input dir="ltr" value={expr} onChange={(e) => setExpr(e.target.value)} />
          <button className="btn" style={{ marginTop: 10 }} onClick={async () => {
            setErr("");
            try {
              const r = await api.solve({ problem_id: problemId, variables: vars, assumptions, expression: expr });
              setResult(r.result);
            } catch (e) { setErr(errText(e)); }
          }}>{t(ctx.lang, "solve")}</button>
        </div>
      )}
      {result && <ResultView lang={ctx.lang} result={result} />}
    </Shell>
  );
}

function ResultView({ lang, result }: { lang: Lang; result: any }) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <Tag cert={result.certainty} />
      {result.error && <p className="err">{result.error}</p>}
      <h2>{t(lang, "result")}</h2>
      <MathTex tex={result.result_latex} />
      {result.result_text && <pre>{result.result_text}</pre>}
      <h2>{t(lang, "steps")}</h2>
      {(result.steps || []).map((s: any) => (
        <div key={s.ord + s.title}>
          <b>{s.ord}. {s.title}</b>
          <div className="muted">{s.explanation} · {s.method}</div>
          <MathTex tex={s.latex} />
        </div>
      ))}
      <h2>{t(lang, "verify")}</h2>
      <pre>{JSON.stringify(result.verification || result.units || {}, null, 2)}</pre>
      <h2>{t(lang, "limits")}</h2>
      <p>{result.limitations}</p>
    </div>
  );
}

export function MathPage({ ctx }: { ctx: Ctx }) {
  const [expression, setExpression] = useState("x^2 - 5*x + 6 = 0");
  const [intent, setIntent] = useState("solve");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "newCalc")}>
      <h1>{t(ctx.lang, "newCalc")}</h1>
      <label>Intent</label>
      <select value={intent} onChange={(e) => setIntent(e.target.value)}>
        {["solve", "simplify", "differentiate", "integrate", "limit", "matrix", "ode", "fourier", "laplace", "units"].map((x) => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>
      <label>Expression</label>
      <textarea dir="ltr" value={expression} onChange={(e) => setExpression(e.target.value)} />
      <button className="btn" onClick={async () => {
        setErr("");
        try { setResult(await api.math({ expression, intent })); }
        catch (e) { setErr(errText(e)); }
      }}>{t(ctx.lang, "solve")}</button>
      {err && <p className="err">{err}</p>}
      {result && <ResultView lang={ctx.lang} result={result} />}
    </Shell>
  );
}

export function NumbersPage({ ctx }: { ctx: Ctx }) {
  const [raw, setRaw] = useState("1, 1, 2, 3, 5, 8");
  const [method, setMethod] = useState("sum");
  const [out, setOut] = useState<any>(null);
  const [explodeVal, setExplodeVal] = useState("21");
  const numbers = useMemo(() => raw.split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => !Number.isNaN(n)), [raw]);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "numberLab")}>
      <h1>{t(ctx.lang, "numberLab")}</h1>
      <p>{t(ctx.lang, "numbersHint")}</p>
      <textarea dir="ltr" value={raw} onChange={(e) => setRaw(e.target.value)} />
      <button className="btn" onClick={async () => setOut(await api.numbers({ numbers, combine_method: method, explode: { value: Number(explodeVal), k: 6, constraints: { min: 1, max: 37, mode: "sum_parts" } } }))}>
        {t(ctx.lang, "analyze")}
      </button>
      <label>{t(ctx.lang, "combine")}</label>
      <select value={method} onChange={(e) => setMethod(e.target.value)}>
        {["sum", "product", "mean", "rms", "l1", "polynomial_base10_if_digits"].map((m) => <option key={m}>{m}</option>)}
      </select>
      <label>{t(ctx.lang, "explode")} (k=6, bounds 1–37 as abstract set)</label>
      <input dir="ltr" value={explodeVal} onChange={(e) => setExplodeVal(e.target.value)} />
      {out && (
        <div className="card" style={{ marginTop: 12 }}>
          <Tag cert={out.certainty} />
          <p>{out.analysis?.limitations}</p>
          <pre>{JSON.stringify(out.analysis?.statistics, null, 2)}</pre>
          <h2>Factorization</h2>
          {(out.analysis?.prime_factorization || []).map((f: any, i: number) => <MathTex key={i} tex={f.latex} />)}
          <h2>Explanations</h2>
          {(out.analysis?.candidate_explanations || []).map((e: any, i: number) => (
            <div key={i}><Tag cert={{ code: e.certainty, he: e.kind, tag: e.certainty === "verified_math" ? "verified" : "partial" }} /><pre>{JSON.stringify(e, null, 2)}</pre></div>
          ))}
          <p className="muted">{out.analysis?.next_term_policy?.reason}</p>
          {out.extra?.combine && <><h2>Combine</h2><MathTex tex={out.extra.combine.formula} /><pre>{JSON.stringify(out.extra.combine.all_methods, null, 2)}</pre></>}
          {out.extra?.explode && <><h2>Inverse sample</h2><p>{out.extra.explode.warning}</p><pre>{JSON.stringify(out.extra.explode.solutions_sample, null, 2)}</pre></>}
        </div>
      )}
    </Shell>
  );
}

export function BetweenPage({ ctx }: { ctx: Ctx }) {
  const [a, setA] = useState("1");
  const [b, setB] = useState("2");
  const [zoom, setZoom] = useState(1);
  const [data, setData] = useState<any>(null);
  async function run(z = zoom) {
    setData(await api.between({ a: Number(a), b: Number(b), depth: 5, zoom: z }));
  }
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "between")}>
      <h1>{t(ctx.lang, "between")}</h1>
      <div className="row">
        <input dir="ltr" value={a} onChange={(e) => setA(e.target.value)} />
        <input dir="ltr" value={b} onChange={(e) => setB(e.target.value)} />
      </div>
      <button className="btn" onClick={() => run()}>{t(ctx.lang, "explore")}</button>
      {data?.ok && (
        <div className="card" style={{ marginTop: 12 }}>
          <Tag cert={{ code: data.certainty, he: "תוצאה מאומתת מתמטית", tag: "verified" }} />
          <input type="range" min={1} max={80} value={zoom} onChange={(e) => { const z = Number(e.target.value); setZoom(z); run(z); }} />
          <div className="muted">zoom {zoom} · view ({data.view?.left}, {data.view?.right})</div>
          <svg className="number-line" viewBox="0 0 320 84">
            <line x1="10" y1="42" x2="310" y2="42" stroke="#7ee7ff" />
            {(data.farey_rationals_in_view || []).slice(0, 40).map((r: any, i: number) => {
              const lo = data.view.left, hi = data.view.right, x = 10 + ((r.value - lo) / (hi - lo || 1)) * 300;
              return <g key={i}><line x1={x} y1="34" x2={x} y2="50" stroke="#b388ff" /><text x={x} y="70" fontSize="7" fill="#9bb0d0" textAnchor="middle">{r.frac}</text></g>;
            })}
          </svg>
          {(data.theorems || []).map((th: any) => (
            <p key={th.title}><b>{th.title}.</b> {th.statement}</p>
          ))}
          <h2>Named irrationals in interval</h2>
          <pre>{JSON.stringify(data.named_irrationals_in_interval, null, 2)}</pre>
          <p>{data.limitations}</p>
        </div>
      )}
    </Shell>
  );
}

export function PhysicsPage({ ctx }: { ctx: Ctx }) {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [id, setId] = useState("projectile");
  const [params, setParams] = useState<Record<string, string>>({ v0: "20", angle_deg: "45", g: "9.80665" });
  const [out, setOut] = useState<any>(null);
  useEffect(() => { api.physicsScenarios().then((r) => setScenarios(r.scenarios)); }, []);
  const series = out?.series;
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "physicsLab")}>
      <h1>{t(ctx.lang, "physicsLab")}</h1>
      <select value={id} onChange={(e) => setId(e.target.value)}>
        {scenarios.map((s) => <option key={s.id} value={s.id}>{ctx.lang === "he" ? s.he : s.en}</option>)}
      </select>
      {Object.entries(params).map(([k, v]) => (
        <div key={k}><label>{k}</label><input dir="ltr" value={v} onChange={(e) => setParams({ ...params, [k]: e.target.value })} /></div>
      ))}
      {id === "newton_force" && (
        <label style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" onChange={(e) => setParams({ ...params, cancel_gravity: e.target.checked ? "1" : "" })} />
          סימולציית g=0 (מודל תיאורטי בלבד — לא ביטול כבידה בטבע)
        </label>
      )}
      <button className="btn" style={{ marginTop: 8 }} onClick={async () => {
        const p: any = {};
        for (const [k, v] of Object.entries(params)) {
          if (k === "cancel_gravity") p[k] = !!v;
          else if (v !== "") p[k] = Number(v);
        }
        setOut(await api.physics({ scenario: id, params: p }));
      }}>{t(ctx.lang, "runSim")}</button>
      {out && (
        <div className="card" style={{ marginTop: 12 }}>
          <Tag cert={out.certainty_pack} />
          {out.warning && <p className="err">{out.warning}</p>}
          <h2>{t(ctx.lang, "assumptions")}</h2>
          <ul>{(out.assumptions || []).map((a: string) => <li key={a}>{a}</li>)}</ul>
          {(out.equations || []).map((eq: string) => <MathTex key={eq} tex={eq} />)}
          {series?.t && series?.x && <Chart x={series.t} y={series.x} name="x" title="x(t) or first series" />}
          {series?.t && series?.y && <Chart x={series.x || series.t} y={series.y} name="y" title="trajectory / y" />}
          {series?.t && series?.psi && <Chart x={series.x} y={series.psi} name="ψ" title="wavefunction" />}
          {series?.t && series?.sigma_z && <Chart x={series.t} y={series.sigma_z} name="⟨σz⟩" title="Rabi ⟨σz⟩" />}
          {series?.d && series?.v && <Chart x={series.d} y={series.v} name="v" title="Hubble v(d)" />}
          {series?.v_over_c && series?.gamma && <Chart x={series.v_over_c} y={series.gamma} name="γ" title="γ(v/c)" />}
          <pre>{JSON.stringify({ constants: out.constants, initial: out.initial_conditions, seed: out.repro_seed, energy: out.energy, force_N: out.force_N }, null, 2)}</pre>
          <p>{out.limitations}</p>
        </div>
      )}
    </Shell>
  );
}

export function AxiomPage({ ctx }: { ctx: Ctx }) {
  const [objects, setObjects] = useState("0,1,2,3");
  const [op, setOp] = useState("+");
  const [axioms, setAxioms] = useState("commutative\nassociative\nidentity\ninverse");
  const [out, setOut] = useState<any>(null);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "axiomLab")}>
      <h1>{t(ctx.lang, "axiomLab")}</h1>
      <p>יצירת עולם מתמטי בעל חוקים חדשים ומוגדרים — לא «מתמטיקה בלי חוקים».</p>
      <label>{t(ctx.lang, "objects")}</label>
      <input dir="ltr" value={objects} onChange={(e) => setObjects(e.target.value)} />
      <label>{t(ctx.lang, "operation")}</label>
      <select value={op} onChange={(e) => setOp(e.target.value)}>
        {["+", "*", "max", "min", "xor"].map((o) => <option key={o}>{o}</option>)}
      </select>
      <label>{t(ctx.lang, "axioms")}</label>
      <textarea value={axioms} onChange={(e) => setAxioms(e.target.value)} />
      <button className="btn" onClick={async () => {
        setOut(await api.axioms({
          title: "world",
          definition: {
            objects: objects.split(/[,\s]+/).filter(Boolean),
            operations: [op],
            axioms: axioms.split("\n").filter(Boolean),
          },
        }));
      }}>{t(ctx.lang, "explore")}</button>
      {out && (
        <div className="card" style={{ marginTop: 12 }}>
          <Tag cert={out.certainty} />
          <p>{out.analysis?.limitations}</p>
          <pre>{JSON.stringify(out.analysis, null, 2)}</pre>
        </div>
      )}
    </Shell>
  );
}

export function DocsPage({ ctx }: { ctx: Ctx }) {
  const [rows, setRows] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState<any>(null);
  const [share, setShare] = useState("");
  async function load() {
    setRows(await api.documents());
    setProjects(await api.projects());
  }
  useEffect(() => { load(); }, []);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "docs")}>
      <h1>{t(ctx.lang, "uploadDoc")}</h1>
      <input type="file" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const fd = new FormData();
        fd.append("file", f);
        if (projectId) fd.append("project_id", projectId);
        fd.append("notes", notes);
        await api.upload(fd);
        load();
      }} />
      <label>{t(ctx.lang, "attachTo")}</label>
      <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
        <option value="">—</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
      <label>{t(ctx.lang, "notes")}</label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      {rows.map((d) => (
        <button className="list-item" key={d.id} onClick={async () => setOpen(await api.document(d.id))} style={{ width: "100%", background: "none", border: 0, textAlign: "inherit" }}>
          <b>{d.original_name}</b>
          <div className="muted">{d.excerpt}</div>
        </button>
      ))}
      {open && (
        <div className="card">
          <h2>{open.original_name}</h2>
          <pre>{open.extracted_text?.slice(0, 4000)}</pre>
          <textarea value={open.notes || ""} onChange={(e) => setOpen({ ...open, notes: e.target.value })} />
          <button className="btn" onClick={async () => { await api.patchDoc(open.id, { notes: open.notes, project_id: projectId ? Number(projectId) : null }); load(); }}>{t(ctx.lang, "save")}</button>
          <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => downloadAuth(`/api/documents/${open.id}/download`, open.original_name)}>{t(ctx.lang, "download")}</button>
          <button className="btn secondary" style={{ marginTop: 8 }} onClick={async () => {
            const s = await api.shareDoc(open.id, 24);
            setShare(`${location.origin}${s.path}`);
          }}>{t(ctx.lang, "share")}</button>
          {share && <p className="muted">{share}</p>}
          <button className="btn danger" style={{ marginTop: 8 }} onClick={async () => { await api.deleteDoc(open.id); setOpen(null); load(); }}>{t(ctx.lang, "delete")}</button>
        </div>
      )}
    </Shell>
  );
}

export function PdfPage({ ctx }: { ctx: Ctx }) {
  const [title, setTitle] = useState("דוח מחקר");
  const [question, setQuestion] = useState("");
  const [results, setResults] = useState("");
  const [link, setLink] = useState("");
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { api.pdfs().then(setList); }, [link]);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "makePdf")}>
      <h1>{t(ctx.lang, "makePdf")}</h1>
      <label>{t(ctx.lang, "title")}</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <label>{t(ctx.lang, "problem")}</label>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} />
      <label>{t(ctx.lang, "result")}</label>
      <textarea value={results} onChange={(e) => setResults(e.target.value)} />
      <button className="btn" onClick={async () => {
        const r = await api.pdf({
          title,
          question,
          input_data: question,
          variables: [],
          assumptions: ["חישובים מבוצעים ב-SymPy כאשר סופקה נוסחה."],
          formulas: [],
          steps: ["ראו את מסך המחקר לפתרון מדורג"],
          results,
          verification: "לא הומצאו מקורות.",
          limitations: "הדוח משקף את הקלט שהוזן.",
          sources: ["אין מקורות חיצוניים אלא אם המשתמש הוסיף."],
          versions: ["v1"],
          certainty_label: "חלקי / לפי תוכן החישוב",
          language: ctx.lang,
        });
        setLink(r.download);
      }}>{t(ctx.lang, "makePdf")}</button>
      {link && <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => downloadAuth(link, "report.pdf")}>{t(ctx.lang, "download")}</button>}
      {list.map((p) => (
        <button className="list-item" key={p.id} onClick={() => downloadAuth(`/api/pdf/${p.id}/download`, p.filename)}>{p.title} · {p.created_at}</button>
      ))}
    </Shell>
  );
}

export function HistoryPage({ ctx }: { ctx: Ctx }) {
  const [act, setAct] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  useEffect(() => {
    api.activity().then(setAct);
    api.problems().then(setProblems);
  }, []);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "history")}>
      <h1>{t(ctx.lang, "history")}</h1>
      {problems.map((p) => (
        <div className="list-item" key={p.id}>
          <b>{p.domain}</b>
          <div>{p.natural_language}</div>
          <div className="muted">{p.status} · {p.created_at}</div>
        </div>
      ))}
      <h2>Activity</h2>
      {act.map((a) => (
        <div className="list-item" key={a.id}>{a.action} {a.entity} {a.detail}<div className="muted">{a.created_at}</div></div>
      ))}
    </Shell>
  );
}

export function SearchPage({ ctx }: { ctx: Ctx }) {
  const [q, setQ] = useState("");
  const [r, setR] = useState<any>(null);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "search")}>
      <h1>{t(ctx.lang, "search")}</h1>
      <input value={q} onChange={async (e) => {
        setQ(e.target.value);
        if (e.target.value.trim().length >= 2) setR(await api.search(e.target.value));
      }} />
      {r && (
        <>
          <h2>{t(ctx.lang, "projects")}</h2>
          {r.projects.map((p: any) => <Link className="list-item" key={p.id} to={`/projects/${p.id}`}>{p.title}</Link>)}
          <h2>Problems</h2>
          {r.problems.map((p: any) => <div className="list-item" key={p.id}>{p.text}</div>)}
          <h2>{t(ctx.lang, "docs")}</h2>
          {r.documents.map((d: any) => <div className="list-item" key={d.id}>{d.name}</div>)}
        </>
      )}
    </Shell>
  );
}

export function MorePage({ ctx }: { ctx: Ctx }) {
  const [deferred, setDeferred] = useState<any>(null);
  useEffect(() => {
    const h = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  return (
    <Shell lang={ctx.lang} title={t(ctx.lang, "more")}>
      <h1>{t(ctx.lang, "settings")}</h1>
      <label>{t(ctx.lang, "language")}</label>
      <div className="row">
        <button className="btn secondary" onClick={() => { ctx.setLang("he"); api.patchMe({ language: "he" }); document.documentElement.lang = "he"; document.documentElement.dir = "rtl"; }}>עברית</button>
        <button className="btn secondary" onClick={() => { ctx.setLang("en"); api.patchMe({ language: "en" }); document.documentElement.lang = "en"; document.documentElement.dir = "ltr"; }}>English</button>
      </div>
      <label>{t(ctx.lang, "theme")}</label>
      <div className="row">
        <button className="btn secondary" onClick={() => { ctx.setTheme("dark"); api.patchMe({ theme: "dark" }); document.documentElement.dataset.theme = "dark"; }}>{t(ctx.lang, "dark")}</button>
        <button className="btn secondary" onClick={() => { ctx.setTheme("light"); api.patchMe({ theme: "light" }); document.documentElement.dataset.theme = "light"; }}>{t(ctx.lang, "light")}</button>
      </div>
      <div className="install-banner">
        <b>{t(ctx.lang, "install")}</b>
        <p>Samsung Galaxy S22: Chrome → תפריט → Add to Home screen / התקנת אפליקציה. המניפסט מוגדר כ-standalone PWA.</p>
        {deferred && <button className="btn" onClick={async () => { deferred.prompt(); setDeferred(null); }}>{t(ctx.lang, "install")}</button>}
      </div>
      <Link className="list-item" to="/history">{t(ctx.lang, "history")}</Link>
      <Link className="list-item" to="/search">{t(ctx.lang, "search")}</Link>
      <button className="btn danger" style={{ marginTop: 16 }} onClick={() => { setToken(null); ctx.setUser(null); location.assign("/login"); }}>{t(ctx.lang, "logout")}</button>
    </Shell>
  );
}
