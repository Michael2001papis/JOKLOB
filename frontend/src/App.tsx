import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, getToken, setToken } from "./api";
import type { Lang } from "./i18n";
import {
  AxiomPage,
  BetweenPage,
  DocsPage,
  HistoryPage,
  Home,
  LabsHub,
  Login,
  MathPage,
  MorePage,
  NumbersPage,
  PdfPage,
  PhysicsPage,
  ProjectDetail,
  Projects,
  Research,
  SearchPage,
} from "./pages";
import { Guard } from "./ui";

export default function App() {
  const [token, setTok] = useState<string | null>(getToken());
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<Lang>("he");
  const [theme, setTheme] = useState("dark");

  async function refreshUser() {
    const t = getToken();
    setTok(t);
    if (!t) return;
    try {
      const me = await api.me();
      setUser(me);
      setLang(me.language === "en" ? "en" : "he");
      setTheme(me.theme || "dark");
      document.documentElement.lang = me.language === "en" ? "en" : "he";
      document.documentElement.dir = me.language === "en" ? "ltr" : "rtl";
      document.documentElement.dataset.theme = me.theme || "dark";
    } catch {
      setToken(null);
      setTok(null);
    }
  }

  useEffect(() => {
    refreshUser();
  }, []);

  const ctx = { lang, setLang, theme, setTheme, user, setUser, refreshUser };

  return (
    <Routes>
      <Route path="/login" element={<Login ctx={ctx} />} />
      <Route
        path="/*"
        element={
          <Guard token={token}>
            <Routes>
              <Route path="/" element={<Home ctx={ctx} />} />
              <Route path="/labs" element={<LabsHub ctx={ctx} />} />
              <Route path="/projects" element={<Projects ctx={ctx} />} />
              <Route path="/projects/:id" element={<ProjectDetail ctx={ctx} />} />
              <Route path="/research" element={<Research ctx={ctx} />} />
              <Route path="/math" element={<MathPage ctx={ctx} />} />
              <Route path="/numbers" element={<NumbersPage ctx={ctx} />} />
              <Route path="/between" element={<BetweenPage ctx={ctx} />} />
              <Route path="/physics" element={<PhysicsPage ctx={ctx} />} />
              <Route path="/axioms" element={<AxiomPage ctx={ctx} />} />
              <Route path="/docs" element={<DocsPage ctx={ctx} />} />
              <Route path="/pdf" element={<PdfPage ctx={ctx} />} />
              <Route path="/history" element={<HistoryPage ctx={ctx} />} />
              <Route path="/search" element={<SearchPage ctx={ctx} />} />
              <Route path="/more" element={<MorePage ctx={ctx} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Guard>
        }
      />
    </Routes>
  );
}
