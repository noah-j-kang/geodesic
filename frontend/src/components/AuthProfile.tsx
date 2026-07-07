export default function AuthProfile() {
  return (
    <div className="absolute top-8 right-8 z-50">
      <div className="bg-graphite/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors shadow-lg">
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border border-white/20" />
        <span className="text-xs uppercase tracking-widest text-white/70 font-mono">Guest Node</span>
      </div>
    </div>
  );
}
