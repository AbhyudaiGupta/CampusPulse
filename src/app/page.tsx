import { Activity, MapPin, Users, Compass, Clock, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-[#0a1628]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">CampusPulse</span>
              <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-medium">
                Outline v0.1
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">Live Spaces</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">Campus Map</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">Crowd Forecasts</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">Reservations</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4">
            <Compass className="w-3.5 h-3.5" /> Project Bootstrap & Initial Outline
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Know Before You Go.
          </h1>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            A privacy-first smart campus resource finder and real-time crowd predictor.
            Explore campus spaces, avoid rush hours, and find the perfect spot to study.
          </p>
        </div>

        {/* Core Modules Outline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-[#0a1628] border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Space Occupancy</h3>
            <p className="text-sm text-slate-400">
              Real-time capacity indicators across university libraries, open study halls, and computer clusters.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a1628] border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Crowd Flow Forecasts</h3>
            <p className="text-sm text-slate-400">
              Hourly predictive analytics to help students avoid peak congestion and plan study sessions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a1628] border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Privacy-First Architecture</h3>
            <p className="text-sm text-slate-400">
              Aggregated anonymous space metrics without individual device logging or facial recognition.
            </p>
          </div>
        </div>

        {/* Initial Spaces Wireframe / Preview */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f2040]/40 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Campus Spaces Directory Outline</h2>
              <p className="text-xs text-slate-400 mt-1">Foundational data models and UI structure</p>
            </div>
            <span className="text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-3 py-1 rounded-full">
              Foundation Stage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0a1628] border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">Main Library (2nd Fl)</span>
                <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">35% Full</span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> North Campus • Quiet Zone
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0a1628] border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">Turing Computing Lab</span>
                <span className="text-xs text-amber-400 bg-amber-950 px-2 py-0.5 rounded">72% Full</span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Engineering Block • Workstations
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0a1628] border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">Student Commons</span>
                <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">20% Full</span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Central Plaza • Collaborative
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        CampusPulse • Smart Campus Resource Finder • Initial Project Outline
      </footer>
    </div>
  );
}
