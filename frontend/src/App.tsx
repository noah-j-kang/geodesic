import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthProfile from './components/AuthProfile';
import WebGLManifold from './canvas/WebGLManifold';
import Omnibar from './components/Omnibar';
import PropertiesPanel from './components/PropertiesPanel';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={
          <div className="w-full h-full relative">
            {/* 3D Canvas Layer - z-0 */}
            <WebGLManifold />
            
            {/* UI Overlays Layer - z-10 to z-50 */}
            <div className="pointer-events-none absolute inset-0 z-10 [&>*]:pointer-events-auto">
              <AuthProfile />
              <Omnibar />
              <PropertiesPanel />
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
