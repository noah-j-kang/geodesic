import { useState } from "react";
import { useNavigate } from "react-router-dom";

const navLinks = ["Home", "Discovery Engine", "Features"];

export default function FeaturesPage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Features");

  return (
    <div
      className="h-screen relative overflow-x-hidden overflow-y-auto"
      style={{ background: "#070808", fontFamily: "Inter, sans-serif", color: "#f0f0ee" }}
    >
      {/* ── Nebula background ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute"
          style={{
            top: "5%",
            left: "30%",
            width: "780px",
            height: "700px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(143,168,136,0.15) 0%, rgba(143,168,136,0.05) 30%, rgba(100,120,95,0.02) 60%, transparent 75%)",
            filter: "blur(2px)",
          }}
        />
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
        {/* Logo text */}
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
              onClick={() => {
                setActiveNav(link);
                if (link === 'Discovery Engine') navigate('/app');
                else if (link === 'Features') navigate('/features');
                else navigate('/');
              }}
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

      {/* ── Features Content ── */}
      <main className="relative z-10 flex flex-col items-center px-4 max-w-4xl mx-auto py-16">
        <h1
          className="font-extrabold leading-tight mb-4 text-center"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            letterSpacing: "-0.04em",
            color: "#f5f5f3",
          }}
        >
          How It Works
        </h1>
        <p className="text-center text-sm sm:text-base mb-16 max-w-2xl text-white/50">
          A deep dive into the TopoAcoustic Discovery Engine and the mathematical principles that power your music exploration.
        </p>

        <div className="w-full space-y-12">
          {/* Step 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-3 font-manrope text-white/90">
              <span className="text-[#8fa888] mr-2">01.</span> User Preferences
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              The journey begins with you. By inputting your music preferences—whether it's specific tracks, artists, or genres—the engine gathers a foundational dataset. This dataset acts as the anchor point in a vast, high-dimensional acoustic space.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-3 font-manrope text-white/90">
              <span className="text-[#8fa888] mr-2">02.</span> Sub-Topology Generation
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Based on your inputs, the engine assumes there exists a unique sub-topology representing your personal taste. We map your preferences into this space and extract structural features that define the shape of the sounds you love, creating a mathematical fingerprint of your musical identity.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-3 font-manrope text-white/90">
              <span className="text-[#8fa888] mr-2">03.</span> Topological Matching
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Finally, we match your personal sub-topology against the existing global topology of all known artists and tracks. By finding the shortest paths and structural similarities, the engine discovers new music that inherently resonates with the shape of your preferences, rather than relying on basic metadata or generic collaborative filtering.
            </p>
          </div>
        </div>

        {/* Technical Specs Section */}
        <div className="w-full mt-20 bg-[#0d0e0e] border border-white/10 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold mb-6 font-manrope text-white/90">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-2">Persistent Homology</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                We use Topological Data Analysis (TDA) via <code>giotto-tda</code> and <code>gudhi</code> to study the shape of acoustic data. By calculating persistent homology, we identify voids and connected components (simplicial complexes) within the dataset across multiple spatial resolutions.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-2">Takens' Theorem</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Applied to our audio DSP pipeline (utilizing <code>numpy</code> and <code>librosa</code>), Takens' Theorem allows us to reconstruct the phase space of an audio signal from a time series, capturing the hidden non-linear dynamics of a track.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-2">Wasserstein Distance</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                To compare two different persistence diagrams (such as your sub-topology vs. an artist's topology), we calculate the Wasserstein distance. This optimal transport metric measures the minimal "work" required to transform one shape into another.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-2">1500-D Vector Search</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Our features are embedded into a dense 1500-dimensional vector space. We strictly use <code>hnswlib</code> (Hierarchical Navigable Small World graphs) entirely in active RAM for sub-millisecond similarity lookups, bypassing the latency overhead of traditional database queries.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
