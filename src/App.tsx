import { useEffect, useRef, useState } from 'react';
import { BottomControlDock } from './components/BottomControlDock';
import { HeroOverlay } from './components/HeroOverlay';
import { TopBar } from './components/TopBar';
import {
  CAMERA_PRESETS,
  type CameraView,
  HERO_CAMERA_VIEW,
  type LightingPresetId,
} from './data/poiData';
import {
  BpsSceneCanvas,
  type BpsSceneCanvasHandle,
} from './three/BpsSceneCanvas';

export default function App() {
  const sceneRef = useRef<BpsSceneCanvasHandle | null>(null);

  const [cameraView, setCameraView] = useState<CameraView>(HERO_CAMERA_VIEW);
  const [activePresetId, setActivePresetId] = useState<string>('isometrik');
  const [lightingPreset, setLightingPreset] = useState<LightingPresetId>('pagi');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  // Keyboard shortcuts ('H' toggle dock, '+/-' zoom, 'Arrows' rotate)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((c) => !c);
      } else if (e.key === '+' || e.key === '=') {
        sceneRef.current?.zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        sceneRef.current?.zoomOut();
      } else if (e.key === 'ArrowLeft') {
        sceneRef.current?.rotateLeft();
      } else if (e.key === 'ArrowRight') {
        sceneRef.current?.rotateRight();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelectPreset = (presetId: string) => {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setCameraView(preset.view);
  };

  const handleResetView = () => {
    setActivePresetId('isometrik');
    setCameraView(HERO_CAMERA_VIEW);
    sceneRef.current?.resetView();
  };

  return (
    <main
      className="relative h-screen w-screen overflow-hidden select-none"
      data-lighting={lightingPreset}
    >
      {/* Full-Viewport 3D Architectural Canvas (Zoom, Rotate & Lighting) */}
      <BpsSceneCanvas
        ref={sceneRef}
        cameraView={cameraView}
        lightingPreset={lightingPreset}
        activePoiId={null}
        showHotspots={false}
        onSelectPoi={() => {}}
      />

      {/* Top Floating Navbar (Identity & Login) */}
      <TopBar
        lightingPreset={lightingPreset}
        onResetView={handleResetView}
        onLogin={() => {
          window.location.href = '/login';
        }}
      />

      {/* Hero Editorial Overlay */}
      <HeroOverlay lightingPreset={lightingPreset} />

      {/* Bottom Control Dock (3D Rotation Presets, Zoom In/Out, Rotate, Reset & Lighting) */}
      <BottomControlDock
        collapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((c) => !c)}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        lightingPreset={lightingPreset}
        onSelectLighting={setLightingPreset}
        onZoomIn={() => sceneRef.current?.zoomIn()}
        onZoomOut={() => sceneRef.current?.zoomOut()}
        onRotateLeft={() => sceneRef.current?.rotateLeft()}
        onRotateRight={() => sceneRef.current?.rotateRight()}
        onResetView={handleResetView}
      />
    </main>
  );
}
