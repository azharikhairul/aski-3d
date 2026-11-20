import {
  ChevronDown,
  ChevronUp,
  Compass,
  Moon,
  RotateCcw,
  RotateCw,
  Sun,
  Sunrise,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CAMERA_PRESETS,
  type LightingPresetId,
} from '../data/poiData';

interface BottomControlDockProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  lightingPreset: LightingPresetId;
  onSelectLighting: (id: LightingPresetId) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onResetView: () => void;
}

const MOBILE_SHORT_LABELS: Record<string, string> = {
  isometrik: 'Isometrik',
  fasad: 'Fasad',
  kanopi: 'Gerbang',
};

const LIGHTING_OPTIONS: Array<{
  id: LightingPresetId;
  label: string;
  Icon: typeof Sun;
}> = [
  { id: 'pagi', label: 'Pagi', Icon: Sun },
  { id: 'senja', label: 'Senja', Icon: Sunrise },
  { id: 'malam', label: 'Malam', Icon: Moon },
];

export function BottomControlDock({
  collapsed,
  onToggleCollapse,
  activePresetId,
  onSelectPreset,
  lightingPreset,
  onSelectLighting,
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onResetView,
}: BottomControlDockProps) {
  const isNight = lightingPreset === 'malam';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3 sm:bottom-4 z-30 flex justify-center px-3 sm:px-6 transition-transform duration-200"
      style={{
        transform: collapsed
          ? 'translate3d(0, calc(100% - 34px), 0)'
          : 'translate3d(0, 0, 0)',
      }}
    >
      <div className="flex w-full max-w-6xl flex-col items-center">
        {/* Collapse / Expand Toggle Handle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Tampilkan kontrol 3D' : 'Sembunyikan kontrol 3D'}
          className={`pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
            isNight
              ? 'bg-slate-900/95 text-slate-200 border border-slate-700 hover:bg-slate-800'
              : 'bg-white/95 text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {collapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Kontrol 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sembunyikan</span>
            </>
          )}
        </button>

        {/* Main Compact Bottom Dock */}
        <div
          className={`pointer-events-auto w-full rounded-2xl p-2 sm:px-5 sm:py-2.5 shadow-md transition-colors ${
            isNight
              ? 'bg-slate-900/95 border border-slate-700/90 text-slate-100'
              : 'bg-white/95 border border-slate-200/90 text-slate-900'
          }`}
        >
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            {/* Group 1: 3 Camera Rotation Angle Presets */}
            <div
              className="grid grid-cols-3 gap-1 lg:flex lg:items-center lg:gap-1"
              role="group"
              aria-label="Sudut rotasi kamera"
            >
              {CAMERA_PRESETS.map((preset) => {
                const active = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset.id)}
                    className={`whitespace-nowrap shrink-0 rounded-lg px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                      active
                        ? 'bg-orange-500 text-white font-semibold shadow-xs'
                        : isNight
                          ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="sm:hidden">
                      {MOBILE_SHORT_LABELS[preset.id] ?? preset.label}
                    </span>
                    <span className="hidden sm:inline">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Group 2 & 3: Lighting + 3D Zoom & Rotate Controls */}
            <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
              {/* Lighting Preset (Pagi, Senja, Malam) */}
              <div
                className={`flex items-center gap-0.5 rounded-lg p-0.5 ${
                  isNight ? 'bg-slate-800' : 'bg-slate-100'
                }`}
                role="group"
                aria-label="Pencahayaan waktu"
              >
                {LIGHTING_OPTIONS.map(({ id, label, Icon }) => {
                  const active = lightingPreset === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSelectLighting(id)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                        active
                          ? isNight
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'bg-white text-slate-900 shadow-2xs'
                          : isNight
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 3D Zoom & Rotate Tools */}
              <div
                className={`flex items-center gap-0.5 rounded-lg p-0.5 ${
                  isNight ? 'bg-slate-800' : 'bg-slate-100'
                }`}
                role="group"
                aria-label="Kontrol 3D zoom dan rotasi"
              >
                <button
                  type="button"
                  onClick={onZoomIn}
                  aria-label="Perbesar tampilan 3D (Zoom In)"
                  title="Zoom In"
                  className={`inline-flex items-center justify-center rounded-md p-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                    isNight
                      ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <ZoomIn className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onZoomOut}
                  aria-label="Perkecil tampilan 3D (Zoom Out)"
                  title="Zoom Out"
                  className={`inline-flex items-center justify-center rounded-md p-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                    isNight
                      ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <ZoomOut className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className={`h-4 w-[1px] mx-0.5 ${isNight ? 'bg-slate-700' : 'bg-slate-200'}`} />

                <button
                  type="button"
                  onClick={onResetView}
                  aria-label="Reset rotasi dan posisi kamera"
                  title="Reset Tampilan"
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                    isNight
                      ? 'text-orange-400 hover:bg-slate-700 hover:text-orange-300'
                      : 'text-orange-600 hover:bg-white hover:text-orange-700'
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
