import { Routes, Route, NavLink } from "react-router-dom";
import "./index.css";
import Dashboard from "./Dashboard";
import BrandingSettings from "./BrandingSettings";
import ImportScenes from "./ImportScenes";
import ClipCutter from "./ClipCutter";
import StitchPanel from "./StitchPanel";
import CreateProject from "./CreateProject";

const navLinks = [
  { to: "/", label: "✦ Create", end: true },
  { to: "/dashboard", label: "📊 Dashboard" },
  { to: "/branding", label: "🎨 Branding" },
  { to: "/import", label: "📥 Import" },
  { to: "/cut", label: "✂️ Cut" },
  { to: "/stitch", label: "🧵 Stitch" },
];

export default function App() {
  return (
    <div className="app-bg min-h-screen text-white">
      <header className="nav-glass sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-500/20">
              ◆
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Cocktail<span className="text-blue-400">Clips</span>
            </span>
          </NavLink>
          <div className="flex gap-2 flex-wrap">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<CreateProject />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/branding" element={<BrandingSettings />} />
          <Route path="/import" element={<ImportScenes />} />
          <Route path="/cut" element={<ClipCutter />} />
          <Route path="/stitch" element={<StitchPanel />} />
        </Routes>
      </main>
    </div>
  );
}
