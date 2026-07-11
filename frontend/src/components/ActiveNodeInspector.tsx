import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../store/useUIStore';

// Singleton Audio Controller (outside React tree to prevent re-instantiation)
const audioSingleton = new Audio();
audioSingleton.crossOrigin = 'anonymous';

export default function ActiveNodeInspector() {
  const activeNodeId = useUIStore((state) => state.activeNodeId);
  const nodes = useUIStore((state) => state.nodes);
  
  const scrubberRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorStatus, setErrorStatus] = useState<"NONE" | "DEAD_LINK" | "AUTOPLAY_BLOCKED">("NONE");
  const [isBuffering, setIsBuffering] = useState(false);

  const activeNode = nodes.find(n => n.spotify_track_id === activeNodeId);

  // Handle active_node changes
  useEffect(() => {
    if (!activeNode) return;

    // Reset State
    setErrorStatus("NONE");
    setIsBuffering(true);
    setIsPlaying(false);
    
    // Clear and pause current audio
    audioSingleton.pause();
    audioSingleton.currentTime = 0;
    
    // Load new stream
    audioSingleton.src = activeNode.metadata.preview_url;
    audioSingleton.load();

    const playAudio = async () => {
      try {
        await audioSingleton.play();
        setIsPlaying(true);
        setIsBuffering(false);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setErrorStatus("AUTOPLAY_BLOCKED");
          setIsBuffering(false);
        } else {
          setErrorStatus("DEAD_LINK");
          setIsBuffering(false);
        }
      }
    };

    playAudio();

    return () => {
      audioSingleton.pause();
    };
  }, [activeNode]);

  // Audio Event Listeners for buffering & errors
  useEffect(() => {
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleError = () => {
      setErrorStatus("DEAD_LINK");
      setIsBuffering(false);
      setIsPlaying(false);
    };
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audioSingleton.addEventListener('waiting', handleWaiting);
    audioSingleton.addEventListener('playing', handleCanPlay);
    audioSingleton.addEventListener('error', handleError);
    audioSingleton.addEventListener('ended', handleEnded);
    audioSingleton.addEventListener('pause', handlePause);
    audioSingleton.addEventListener('play', handlePlay);

    return () => {
      audioSingleton.removeEventListener('waiting', handleWaiting);
      audioSingleton.removeEventListener('playing', handleCanPlay);
      audioSingleton.removeEventListener('error', handleError);
      audioSingleton.removeEventListener('ended', handleEnded);
      audioSingleton.removeEventListener('pause', handlePause);
      audioSingleton.removeEventListener('play', handlePlay);
    };
  }, []);

  // requestAnimationFrame Scrubber Loop (Bypasses React State)
  useEffect(() => {
    const updateScrubber = () => {
      if (scrubberRef.current) {
        const duration = audioSingleton.duration || 30; // default 30s preview
        const current = audioSingleton.currentTime || 0;
        const width = (current / duration) * 100;
        scrubberRef.current.style.width = `${width}%`;
      }
      rafRef.current = requestAnimationFrame(updateScrubber);
    };
    
    rafRef.current = requestAnimationFrame(updateScrubber);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleManualPlay = () => {
    if (audioSingleton.paused) {
      audioSingleton.play().catch(() => setErrorStatus("DEAD_LINK"));
    } else {
      audioSingleton.pause();
    }
  };

  if (!activeNode) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {/* Desaturated Album Art */}
        <img 
          src={activeNode.metadata.album_art_url} 
          alt="Album Art" 
          className={`w-12 h-12 rounded object-cover transition-all duration-500 ${isPlaying ? 'grayscale-0 opacity-100 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'grayscale opacity-80'}`}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-xs text-white/80 font-bold truncate">{activeNode.metadata.track_title}</span>
          <span className="text-[10px] text-white/50 truncate mb-1">{activeNode.metadata.artist_name}</span>
          <span className="text-[10px] text-white/40 font-mono">Similarity Dist: {activeNode.distance_l2.toFixed(3)}</span>
        </div>
        
        {/* Play Control */}
        <button 
          onClick={handleManualPlay}
          disabled={errorStatus === "DEAD_LINK"}
          className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${
            errorStatus === 'DEAD_LINK' ? 'border-red-500/50 text-red-500/50' :
            errorStatus === 'AUTOPLAY_BLOCKED' ? 'border-yellow-500 text-yellow-500 animate-pulse' :
            isPlaying ? 'border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'border-white/40 hover:border-white text-white'
          }`}
        >
          {isBuffering && errorStatus !== "DEAD_LINK" ? (
            <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-white animate-spin" />
          ) : isPlaying ? (
            <span className="text-[10px]">||</span> // Pause
          ) : (
            <span className="text-[10px] ml-0.5">▶</span> // Play
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorStatus === "DEAD_LINK" && (
        <div className="text-[10px] text-red-500 font-mono tracking-widest uppercase">
          [ERR: AUDIO STREAM UNAVAILABLE]
        </div>
      )}
      {errorStatus === "AUTOPLAY_BLOCKED" && (
        <div className="text-[10px] text-yellow-500 font-mono tracking-widest uppercase">
          [INTERVENTION REQ: CLICK PLAY]
        </div>
      )}

      {/* Scrubber (Updated via ref, not state) */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1 relative">
        <div 
          ref={scrubberRef} 
          className={`h-full absolute top-0 left-0 transition-none ${errorStatus === "DEAD_LINK" ? 'bg-red-500' : isPlaying ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-white/70'}`}
          style={{ width: '0%' }}
        />
      </div>
    </div>
  );
}
