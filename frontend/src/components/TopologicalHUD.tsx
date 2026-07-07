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
    <div className={`absolute right-8 top-1/2 -translate-y-1/2 w-64 bg-graphite/80 backdrop-blur-md border border-white/20 p-4 rounded-lg flex flex-col gap-4 z-40 ${isReconnecting ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}`}>
      <h2 className="text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-2 mb-2">Topological HUD</h2>
      {isReconnecting && <div className="text-xs text-yellow-400 mb-2 font-bold animate-pulse">Reconnecting to Node...</div>}
      {Object.entries(localState).map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1 group">
          <label className="text-xs text-white/70 capitalize flex justify-between group-hover:text-white transition-colors">
            {key.replace(/_/g, ' ')}
            <span className="text-white/40 group-hover:text-white/80">{value.toFixed(2)}</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={value} 
            onChange={(e) => handleSliderChange(key as keyof typeof hudState, parseFloat(e.target.value))}
            className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none outline-none cursor-pointer"
          />
        </div>
      ))}
    </div>
  );
}
