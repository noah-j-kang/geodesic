import { useState, useRef } from 'react';
import { useUIStore } from '../store/useUIStore';

export default function TopologicalHUD() {
  const { hudState, setHUDState, isReconnecting } = useUIStore();
  
  // Local state for immediate updates
  const [localState, setLocalState] = useState(hudState);
  
  const timerRef = useRef<number | null>(null);

  const handleSliderChange = (key: keyof typeof hudState, value: number) => {
    setLocalState((prev) => ({ ...prev, [key]: value }));
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setHUDState({ [key]: value });
      // TODO: Fire WebSocket payloads to prevent overwhelming the API Gateway
    }, 100);
  };

  return (
    <div className={`w-full flex flex-col gap-4 z-40 ${isReconnecting ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}`}>
      <h2 className="text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-2 mb-2">Topological HUD</h2>
      {isReconnecting && <div className="text-xs text-yellow-400 mb-2 font-bold animate-pulse">Reconnecting to Node...</div>}
      {Object.entries(localState).map(([key, value]) => {
        let label = key;
        let tooltip = '';
        if (key === 'timbral_density_h0') { label = 'Timbral Density'; tooltip = 'Density of 0-dimensional features in the audio topology (h0).'; }
        if (key === 'cyclic_frequency_h1') { label = 'Cyclic Frequency'; tooltip = 'Frequency of 1-dimensional cyclical features (h1).'; }
        if (key === 'transient_sharpness') { label = 'Transient Sharpness'; tooltip = 'Sharpness of the audio transients.'; }

        return (
        <div key={key} className="flex flex-col gap-1 group">
          <label className="text-xs text-white/70 flex justify-between group-hover:text-cyan-400 transition-colors cursor-help" title={tooltip}>
            <span className="flex items-center gap-1">
              {label}
              <span className="text-[9px] opacity-50 bg-white/10 rounded-full w-3 h-3 flex items-center justify-center font-bold">?</span>
            </span>
            <span className="text-white/40 group-hover:text-cyan-400/80">{value.toFixed(2)}</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={value} 
            onChange={(e) => handleSliderChange(key as keyof typeof hudState, parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1 bg-white/10 group-hover:bg-white/20 rounded-full appearance-none outline-none cursor-pointer transition-colors"
          />
        </div>
      )})}
    </div>
  );
}
