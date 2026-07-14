import { useState, useEffect, useRef } from "react";
import {
  Play,
  Music,
  Radio,
  Cpu,
  Globe,
  Search,
  ArrowUpRight,
  ChevronDown,
  Link2,
} from "lucide-react";



// ── Crosshair marker ──────────────────────────────────────────────────────────
function NodeMarker({ dim = false }: { dim?: boolean }) {
  const c = dim ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)";
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="0" x2="7" y2="5" stroke={c} strokeWidth="1" />
      <line x1="7" y1="9" x2="7" y2="14" stroke={c} strokeWidth="1" />
      <line x1="0" y1="7" x2="5" y2="7" stroke={c} strokeWidth="1" />
      <line x1="9" y1="7" x2="14" y2="7" stroke={c} strokeWidth="1" />
      <circle cx="7" cy="7" r="1.8" stroke={c} strokeWidth="0.9" fill="none" />
    </svg>
  );
}

// ── Data node card ────────────────────────────────────────────────────────────
interface NodeProps {
  label: string;
  sub: string;
  icon: React.ReactNode;
  style?: React.CSSProperties;
  markerSide?: "left" | "right";
}

function DataNode({ label, sub, icon, style, markerSide = "right" }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="absolute flex items-center gap-2"
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {markerSide === "left" && <NodeMarker dim={!hovered} />}
      <div
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 backdrop-blur-md border transition-all duration-300"
        style={{
          background: hovered ? "rgba(20,21,21,0.9)" : "rgba(13,14,14,0.7)",
          borderColor: hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)",
          boxShadow: hovered ? "0 0 28px rgba(143,168,136,0.12)" : "none",
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {icon}
        </div>
        <div>
          <div
            className="text-xs font-semibold leading-tight"
            style={{ fontFamily: "Manrope, sans-serif", color: "rgba(255,255,255,0.82)" }}
          >
            {label}
          </div>
          <div
            className="text-[10px] leading-tight mt-0.5"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "rgba(255,255,255,0.28)" }}
          >
            {sub}
          </div>
        </div>
      </div>
      {markerSide === "right" && <NodeMarker dim={!hovered} />}
    </div>
  );
}

// ── Vertical data stream lines ────────────────────────────────────────────────
function DataStreams() {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-28 pointer-events-none">
      {[32, 52, 76, 100, 68, 44, 58, 92, 48, 64, 84, 38].map((h, i) => (
        <div
          key={i}
          className="w-px rounded-full"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, rgba(255,255,255,${0.18 + (i % 3) * 0.06}), transparent)`,
            animation: `ds-pulse ${1.4 + (i % 4) * 0.25}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.09}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes ds-pulse {
          from { opacity: 0.25; transform: scaleY(0.65); }
          to   { opacity: 0.9;  transform: scaleY(1);    }
        }
      `}</style>
    </div>
  );
}

// ── Partner logos ─────────────────────────────────────────────────────────────
const partners = [
  { name: "Spotify", symbol: "♫" },
  { name: "SoundCloud", symbol: "◉" },
  { name: "Apple Music", symbol: "✦" },
];

// ── Nav links (3 removed per spec) ───────────────────────────────────────────
const navLinks = ["Home", "Discovery Engine", "Features", "FAQ"];

import { useNavigate } from 'react-router-dom';

// ── Main App ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Home");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const float = (amp: number, freq: number, phase: number) =>
    Math.sin((tick * 0.04 + phase) * freq) * amp;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#070808", fontFamily: "Inter, sans-serif", color: "#f0f0ee" }}
    >
      {/* ── Nebula background — warm sage-green centre glow ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Main warm sage glow — centre-right, matching reference */}
        <div
          className="absolute"
          style={{
            top: "5%",
            left: "30%",
            width: "780px",
            height: "700px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(143,168,136,0.28) 0%, rgba(143,168,136,0.10) 30%, rgba(100,120,95,0.04) 60%, transparent 75%)",
            filter: "blur(2px)",
          }}
        />
        {/* Faint secondary right bloom */}
        <div
          className="absolute"
          style={{
            top: "20%",
            right: "-60px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(180,190,170,0.09) 0%, transparent 70%)",
          }}
        />
        {/* Very subtle grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── Navigation ── */}
      <header className="relative z-20 flex items-center justify-between px-6 lg:px-10 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span
            className="text-sm font-bold tracking-tight hidden sm:block"
            style={{ fontFamily: "Manrope, sans-serif", color: "rgba(255,255,255,0.85)" }}
          >
            Geodesic
          </span>
        </div>

        {/* Centre nav */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => setActiveNav(link)}
              className="px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: activeNav === link ? 500 : 400,
                color: activeNav === link ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.38)",
                background: activeNav === link ? "rgba(255,255,255,0.07)" : "transparent",
              }}
            >
              {link}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Hero ── */}
      <main
        className="relative flex flex-col items-center justify-center"
        style={{ minHeight: "calc(100vh - 68px)", paddingBottom: "110px" }}
      >
        {/* SVG topology lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1440 760"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
            <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
            <linearGradient id="lg3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
            <linearGradient id="lg4" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
          </defs>
          <line x1="218" y1="248" x2="720" y2="378" stroke="url(#lg1)" strokeWidth="0.7" strokeDasharray="5 9" />
          <line x1="1208" y1="208" x2="720" y2="378" stroke="url(#lg2)" strokeWidth="0.7" strokeDasharray="5 9" />
          <line x1="173" y1="538" x2="720" y2="378" stroke="url(#lg3)" strokeWidth="0.7" strokeDasharray="5 9" />
          <line x1="1230" y1="528" x2="720" y2="378" stroke="url(#lg4)" strokeWidth="0.7" strokeDasharray="5 9" />
          <line x1="218" y1="248" x2="173" y2="538" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="3 12" />
          <line x1="1208" y1="208" x2="1230" y2="528" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="3 12" />
          <circle cx="720" cy="378" r="2.5" fill="rgba(255,255,255,0.28)" />
          <circle cx="720" cy="378" r="7" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" fill="none" />
        </svg>

        {/* Nodes */}
        <DataNode
          label="Acoustic Folk"
          sub="20.9k Artists"
          icon={<Music size={12} />}
          markerSide="right"
          style={{
            top: "14%", left: "7%",
            transform: `translateY(${float(4, 1, 0)}px)`,
          }}
        />
        <DataNode
          label="Cyberpunk Synth"
          sub="2.9k Artists"
          icon={<Cpu size={12} />}
          markerSide="left"
          style={{
            top: "11%", right: "7%",
            transform: `translateY(${float(5, 0.9, 1.2)}px)`,
          }}
        />
        <DataNode
          label="Global Afrobeats"
          sub="19.3k Artists"
          icon={<Globe size={12} />}
          markerSide="right"
          style={{
            bottom: "22%", left: "5%",
            transform: `translateY(${float(4, 1.1, 2.4)}px)`,
          }}
        />
        <DataNode
          label="Experimental Jazz"
          sub="440 Artists"
          icon={<Radio size={12} />}
          markerSide="left"
          style={{
            bottom: "20%", right: "6%",
            transform: `translateY(${float(3.5, 0.95, 3.6)}px)`,
          }}
        />

        {/* ── Central hero content ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mx-auto">
          {/* Headline */}
          <h1
            className="font-extrabold leading-none mb-6"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "clamp(3rem, 8vw, 5.5rem)",
              letterSpacing: "-0.04em",
              color: "#f5f5f3",
            }}
          >
            Geodesic
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm sm:text-[15px] mb-9 max-w-md leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.38)",
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
            }}
          >
            Explore the shape of sound. We use persistent homology to extract structural features
            from high-dimensional music spaces.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200"
              style={{
                fontFamily: "Manrope, sans-serif",
                background: "#ffffff",
                color: "#070808",
                boxShadow: "0 2px 20px rgba(255,255,255,0.12)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.boxShadow = "0 4px 28px rgba(255,255,255,0.22)";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.boxShadow = "0 2px 20px rgba(255,255,255,0.12)";
                el.style.transform = "translateY(0)";
              }}
            >
              <Play size={12} fill="currentColor" />
              Launch the Explorer
              <ArrowUpRight size={13} />
            </button>
            <button
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold border transition-all duration-200"
              style={{
                fontFamily: "Manrope, sans-serif",
                background: "transparent",
                borderColor: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.45)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(255,255,255,0.25)";
                el.style.color = "rgba(255,255,255,0.8)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(255,255,255,0.12)";
                el.style.color = "rgba(255,255,255,0.45)";
              }}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Data stream lines */}
        <DataStreams />

        {/* Scroll indicator — bottom left */}
        <div
          className="absolute bottom-6 left-8 flex items-center gap-3"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          <span className="text-[10px] tabular-nums" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            02/03
          </span>
          <span className="w-px h-3.5" style={{ background: "rgba(255,255,255,0.1)" }} />
          <span className="text-[10px] flex items-center gap-1" style={{ fontFamily: "Inter, sans-serif" }}>
            Scroll for music map <ChevronDown size={10} />
          </span>
        </div>

        {/* Right label */}
        <div
          className="absolute bottom-6 right-8 flex items-center gap-2"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          <span className="text-[10px]" style={{ fontFamily: "Inter, sans-serif" }}>Sonic horizons</span>
          <span className="w-5 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>
      </main>

      {/* ── Partner belt ── */}
      <section
        className="relative z-10 py-7 border-t"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <p
          className="text-center text-[10px] mb-5 tracking-widest"
          style={{ color: "rgba(255,255,255,0.2)", fontFamily: "Inter, sans-serif" }}
        >
          DISCOVER MUSIC FROM TOP SOURCES
        </p>
        <div className="flex items-center justify-center flex-wrap gap-7 px-8">
          {partners.map(({ name, symbol }) => (
            <div
              key={name}
              className="flex items-center gap-1.5 cursor-pointer transition-all duration-200"
              style={{ color: "rgba(255,255,255,0.18)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.5)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.18)"; }}
            >
              <span className="text-sm">{symbol}</span>
              <span className="text-sm font-semibold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
