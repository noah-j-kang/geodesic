import React, { useState } from 'react';
import SemanticCommandLine from './SemanticCommandLine';
import ArtistSearchBar from './ArtistSearchBar';

export default function Omnibar() {
  const [mode, setMode] = useState<'semantic' | 'artist'>('semantic');

  const toggleMode = () => {
    setMode(prev => prev === 'semantic' ? 'artist' : 'semantic');
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
      <div className="relative">
        {mode === 'semantic' ? <SemanticCommandLine /> : <ArtistSearchBar />}
        
        {/* Toggle Button Overlaid on the input field */}
        <button 
          onClick={toggleMode}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-cyan-400 transition-colors z-10 w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-xs font-bold"
          title={`Switch to ${mode === 'semantic' ? 'Artist Search' : 'Semantic Command'}`}
        >
          {mode === 'semantic' ? '/' : 'A'}
        </button>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
          {mode === 'semantic' ? 'Semantic Engine Active' : 'Artist Search Active'}
        </span>
      </div>
    </div>
  );
}
