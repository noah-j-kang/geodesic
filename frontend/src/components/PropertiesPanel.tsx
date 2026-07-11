import TopologicalHUD from './TopologicalHUD';
import ActiveNodeInspector from './ActiveNodeInspector';
import { useUIStore } from '../store/useUIStore';

export default function PropertiesPanel() {
  const activeNodeId = useUIStore((state) => state.activeNodeId);

  return (
    <div className="absolute right-6 top-6 bottom-6 w-80 bg-graphite/80 backdrop-blur-md border border-white/20 p-5 rounded-lg flex flex-col gap-6 z-40 overflow-y-auto shadow-2xl">
      <div className="flex-1">
        <TopologicalHUD />
      </div>
      
      {activeNodeId && (
        <div className="pt-4 border-t border-white/10 mt-auto">
          <h2 className="text-xs uppercase tracking-widest text-white/50 mb-3">Selected Node</h2>
          <ActiveNodeInspector />
        </div>
      )}
    </div>
  );
}
