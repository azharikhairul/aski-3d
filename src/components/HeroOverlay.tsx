import { Compass } from 'lucide-react';
import type { LightingPresetId } from '../data/poiData';

interface HeroOverlayProps {
  lightingPreset: LightingPresetId;
}

export function HeroOverlay({ lightingPreset }: HeroOverlayProps) {
  const isNight = lightingPreset === 'malam';

  return (
    <section
      aria-label="Pengantar Gedung BPS Provinsi Gorontalo"
      className="pointer-events-none fixed inset-0 z-20 flex items-end lg:items-center justify-center px-3 sm:px-6 pb-3.5 pt-16 sm:pb-6 lg:py-0"
    >
      <div className="pointer-events-none flex w-full max-w-6xl items-center justify-center lg:justify-start px-0 sm:px-0 lg:px-5">
        <div
          className={`pointer-events-auto w-full max-w-lg rounded-3xl p-4 sm:p-7 lg:bg-transparent lg:p-0 lg:shadow-none lg:border-0 ${
            isNight
              ? 'bg-slate-900/95 text-slate-100 border border-slate-700/90 shadow-xl'
              : 'bg-white/95 text-slate-900 border border-slate-200/90 shadow-xl'
          }`}
        >
          {/* Official BPS Provinsi Gorontalo Identity Kicker */}
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/image_7240f3d0.png"
              alt="Lambang Resmi BPS Provinsi Gorontalo"
              referrerPolicy="no-referrer"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white object-contain p-1 border border-slate-200/90 shadow-2xs shrink-0"
            />
            <p
              className={`text-xs font-semibold tracking-wide ${
                isNight ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Badan Pusat Statistik Provinsi Gorontalo
            </p>
          </div>

          <h1
            className={`mt-2.5 sm:mt-3 font-display font-extrabold tracking-tight leading-[1.06] text-balance ${
              isNight ? 'text-white' : 'text-slate-900'
            }`}
            style={{ fontSize: 'clamp(1.65rem, 3.8vw, 3.35rem)' }}
          >
            Audit Sistem Kearsipan{' '}
            <span className="block text-orange-500">Internal (ASKI).</span>
          </h1>

          <p
            className={`mt-2 sm:mt-4 max-w-md text-xs sm:text-base leading-relaxed ${
              isNight ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Sistem pengawasan dan evaluasi kearsipan digital terpadu Badan Pusat Statistik
            se-Provinsi Gorontalo untuk mewujudkan tata kelola kearsipan yang tertib, autentik,
            dan akuntabel sesuai standar ANRI.
          </p>

          {/* Action Button & Interactive 3D Guide Pill */}
          <div className="mt-3.5 sm:mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => { window.location.href = '/login'; }}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer ${
                isNight
                  ? 'bg-white text-slate-900 hover:bg-slate-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <span>Masuk ke Sistem ASKI</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xs transition-colors shadow-2xs"
              style={{
                backgroundColor: isNight ? 'rgba(30, 41, 59, 0.85)' : 'rgba(241, 245, 249, 0.88)',
                borderColor: isNight ? 'rgba(51, 65, 85, 0.85)' : 'rgba(226, 232, 240, 0.95)',
                color: isNight ? '#cbd5e1' : '#475569',
              }}
            >
              <Compass className="h-4 w-4 text-orange-500 shrink-0" aria-hidden="true" />
              <span>Gedung BPS Gorontalo 3D</span>
            </div>
          </div>

          {/* 3-Column Metrics Strip */}
          <div
            className={`mt-4 sm:mt-7 grid grid-cols-3 gap-2.5 sm:gap-4 border-t pt-3.5 sm:pt-5 ${
              isNight ? 'border-slate-700/80' : 'border-slate-200/90'
            }`}
          >
            <div>
              <div className="font-display font-mono-tabular text-base sm:text-2xl font-extrabold whitespace-nowrap">
                6 Satker
              </div>
              <div
                className={`mt-0.5 text-[11px] sm:text-xs leading-tight ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                BPS Kab/Kota se-Gorontalo
              </div>
            </div>
            <div
              className={`border-l pl-2.5 sm:pl-4 ${
                isNight ? 'border-slate-700/80' : 'border-slate-200/90'
              }`}
            >
              <div className="font-display font-mono-tabular text-base sm:text-2xl font-extrabold whitespace-nowrap">
                F1 & F2
              </div>
              <div
                className={`mt-0.5 text-[11px] sm:text-xs leading-tight ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Audit Mandiri & Pengawasan
              </div>
            </div>
            <div
              className={`border-l pl-2.5 sm:pl-4 ${
                isNight ? 'border-slate-700/80' : 'border-slate-200/90'
              }`}
            >
              <div className="font-display font-mono-tabular text-base sm:text-2xl font-extrabold whitespace-nowrap">
                ANRI
              </div>
              <div
                className={`mt-0.5 text-[11px] sm:text-xs leading-tight ${
                  isNight ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Standar Kearsipan Nasional
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
