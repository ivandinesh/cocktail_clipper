import { Routes, Route, NavLink } from "react-router-dom";
import "./index.css";
import Dashboard from "./Dashboard";
import BrandingSettings from "./BrandingSettings";
import ImportScenes from "./ImportScenes";
import ClipCutter from "./ClipCutter";
import StitchPanel from "./StitchPanel";
import CreateProject from "./CreateProject";

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
        <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <NavLink to="/" className="text-xl font-bold tracking-tight">
              <span className="text-blue-400">Cocktail</span>Clips
            </NavLink>
            <div className="flex gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                Create
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/branding"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                Branding
              </NavLink>
              <NavLink
                to="/import"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                Import Scenes
              </NavLink>
              <NavLink
                to="/cut"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                Cut
              </NavLink>
              <NavLink
                to="/stitch"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                Stitch
              </NavLink>
            </div>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
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

export default App;
