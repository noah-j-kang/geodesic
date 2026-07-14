import { useUIStore } from '../store/useUIStore';

export default function HoverTooltip() {
  const hoveredNode = useUIStore((state) => state.hoveredNode);

  if (!hoveredNode) return null;

  const { data, x, y } = hoveredNode;
  const { metadata } = data;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: x + 15,
        top: y + 15,
        transform: 'translate(0, 0)',
      }}
    >
      <div className="bg-[#111] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[200px] flex flex-col gap-1.5 text-white">
        
        {/* Track Title */}
        <h4 className="font-manrope font-bold text-sm leading-tight text-white/95">
          {metadata.track_title}
        </h4>
        
        {/* Artist Name */}
        <p className="font-inter text-xs text-white/60 mb-2">
          {metadata.artist_name}
        </p>
        
        {/* Extra Info Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 text-[10px] font-mono text-white/40">
          
          {/* Release Date */}
          <div className="flex flex-col">
            <span className="uppercase text-[8px] text-white/30 tracking-wider">Released</span>
            <span>{metadata.release_date || 'N/A'}</span>
          </div>

          {/* Genre */}
          <div className="flex flex-col">
            <span className="uppercase text-[8px] text-white/30 tracking-wider">Genre</span>
            <span className="truncate">{metadata.genre || 'Unknown'}</span>
          </div>

          {/* Play Count */}
          <div className="flex flex-col mt-1 col-span-2">
            <span className="uppercase text-[8px] text-white/30 tracking-wider">Play Count</span>
            <span>{metadata.play_count ? metadata.play_count.toLocaleString() : '0'}</span>
          </div>
          
        </div>
      </div>
    </div>
  );
}
