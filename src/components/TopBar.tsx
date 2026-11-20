import type { LightingPresetId } from '../data/poiData';

interface TopBarProps {
  lightingPreset: LightingPresetId;
  onResetView?: () => void;
  onLogin?: () => void;
}

export function TopBar({
  lightingPreset,
  onResetView,
  onLogin,
}: TopBarProps) {
  const isNight = lightingPreset === 'malam';

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 sm:top-4 z-30 flex justify-center px-3 sm:px-6">
      <div
        className={`pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-3 sm:gap-8 rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-sm transition-colors duration-200 ${
          isNight
            ? 'border border-slate-700/80 bg-slate-900/95 text-slate-100'
            : 'border border-slate-200/90 bg-white/95 text-slate-900'
        }`}
      >
        {/* Brand Wordmark with Official BPS Logo */}
        <button
          type="button"
          onClick={onResetView}
          aria-label="Kembali ke tampilan awal gedung BPS Gorontalo"
          className="inline-flex items-center gap-2 font-display text-base sm:text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        >
          <img
            src="/assets/aistudio/image_7240f3d0.png"
            alt="Logo BPS Provinsi Gorontalo"
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-md bg-white object-contain p-0.5 border border-slate-200/80 shrink-0"
          />
          <span>
            aski<span className="text-orange-500">.</span> bps gorontalo
          </span>
        </button>

        {/* Primary Action Button: Login */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onLogin}
            aria-label="Login ke sistem BPS Gorontalo"
            className={`whitespace-nowrap shrink-0 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
              isNight
                ? 'bg-white text-slate-900 hover:bg-slate-200'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Masuk
          </button>
        </div>
      </div>
    </header>
  );
}
