import { useState } from 'react';
import { useUIStore } from '../store/useUIStore';

export default function SemanticCommandLine() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'throttled'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const setTargetVector = useUIStore(state => state.setTargetVector);
  const setHUDState = useUIStore(state => state.setHUDState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || status === 'loading' || status === 'throttled') return;
    
    setStatus('loading');
    
    try {
      // Mock API call based on constraints
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (query.toLowerCase().includes('error')) reject(new Error('Timeout'));
          if (query.toLowerCase().includes('spam')) reject(new Error('429'));
          resolve(true);
        }, 800);
      });
      
      // Mock response
      setHUDState({
        timbral_density_h0: Math.random(),
        cyclic_frequency_h1: Math.random(),
        transient_sharpness: Math.random(),
      });
      useUIStore.getState().setCameraTarget([
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        30 + Math.random() * 20
      ]);
      setStatus('idle');
      setQuery('');
    } catch (err: any) {
      if (err.message === '429') {
        setStatus('throttled');
        setErrorMessage('[THROTTLE: 3s]');
        setTimeout(() => { setStatus('idle'); setErrorMessage(''); }, 3000);
      } else {
        setStatus('error');
        setErrorMessage('[ERR: TRANSLATION TIMEOUT]');
        setTimeout(() => { setStatus('idle'); setErrorMessage(''); }, 2000);
      }
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute inset-0 bg-white/5 rounded-lg blur transition-opacity ${status === 'error' ? 'bg-red-500/20' : ''}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={status === 'throttled'}
          placeholder="ENTER SEMANTIC COMMAND..."
          className={`relative w-full bg-graphite/80 backdrop-blur-md border ${status === 'error' ? 'border-red-500 text-red-500' : status === 'throttled' ? 'border-yellow-500 text-yellow-500' : 'border-white/20 text-white'} p-4 pl-12 rounded-lg outline-none focus:border-cyan-400/50 transition-colors placeholder-white/30 font-mono text-sm shadow-xl`}
        />
        {status === 'error' || status === 'throttled' ? (
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest ${status === 'error' ? 'text-red-500' : 'text-yellow-500'}`}>
            {errorMessage}
          </div>
        ) : null}
      </form>
    </div>
  );
}
