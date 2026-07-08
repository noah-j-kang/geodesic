import SemanticCommandLine from './components/SemanticCommandLine';
import TopologicalHUD from './components/TopologicalHUD';
import AuthProfile from './components/AuthProfile';
import ActiveNodeInspector from './components/ActiveNodeInspector';
import WebGLManifold from './canvas/WebGLManifold';
import ArtistSearchBar from './components/ArtistSearchBar';

function App() {
  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas Layer - z-0 */}
      <WebGLManifold />
      
      {/* UI Overlays Layer - z-10 to z-50 */}
      <div className="pointer-events-none absolute inset-0 z-10 [&>*]:pointer-events-auto">
        <AuthProfile />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
          <ArtistSearchBar />
        </div>
        <TopologicalHUD />
        <SemanticCommandLine />
        <ActiveNodeInspector />
      </div>
    </div>
  );
}

export default App;
