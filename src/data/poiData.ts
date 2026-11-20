export type LightingPresetId = 'pagi' | 'senja' | 'malam';

export interface CameraView {
  position: [number, number, number];
  target: [number, number, number];
}

export interface PoiArea {
  id: string;
  order: number;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  architecturalHighlight: string;
  hotspotPosition: [number, number, number];
  cameraView: CameraView;
}

export interface CameraPreset {
  id: string;
  label: string;
  view: CameraView;
}

export interface LightingPreset {
  id: LightingPresetId;
  label: string;
  skyColor: string;
  fogColor: string;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  envIntensity: number;
  interiorGlow: number;
  spotIntensity: number;
  exposure: number;
}

/**
 * Default hero camera framing inspired by the 3rd reference layout:
 * shifts the camera target left so the 3D building diorama occupies the
 * right portion of the viewport while the left editorial hero content
 * sits cleanly with comfortable spacing over soft studio background.
 */
export const HERO_CAMERA_VIEW: CameraView = {
  position: [24.5, 18.2, 44.5],
  target: [-13.7, 4.2, 9.5],
};

export const EXPLORE_CAMERA_VIEW: CameraView = {
  position: [24.5, 15.8, 34.5],
  target: [0, 4.8, 4.0],
};

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'isometrik',
    label: 'Isometrik',
    view: EXPLORE_CAMERA_VIEW,
  },
  {
    id: 'fasad',
    label: 'Fasad Utama',
    view: {
      position: [0, 9.2, 44.5],
      target: [0, 4.5, 4.0],
    },
  },
  {
    id: 'kanopi',
    label: 'Pintu Masuk',
    view: {
      position: [13, 5.8, 22],
      target: [0, 3.2, 8.2],
    },
  },
];

export const LIGHTING_PRESETS: Record<LightingPresetId, LightingPreset> = {
  pagi: {
    id: 'pagi',
    label: 'Pagi Cerah',
    skyColor: '#EBF0F7',
    fogColor: '#EBF0F7',
    sunColor: '#FFF3DB',
    sunIntensity: 3.4,
    sunPosition: [24, 30, 22],
    hemiSky: '#D8E8FF',
    hemiGround: '#8A99AD',
    hemiIntensity: 0.55,
    envIntensity: 0.34,
    interiorGlow: 0.25,
    spotIntensity: 0.0,
    exposure: 1.06,
  },
  senja: {
    id: 'senja',
    label: 'Senja Emas',
    skyColor: '#E89B6C',
    fogColor: '#E28752',
    sunColor: '#FF5A09',
    sunIntensity: 6.8,
    sunPosition: [-22, 13.5, 32],
    hemiSky: '#FF8A3D',
    hemiGround: '#2A1408',
    hemiIntensity: 0.28,
    envIntensity: 0.12,
    interiorGlow: 1.8,
    spotIntensity: 2.2,
    exposure: 1.18,
  },
  malam: {
    id: 'malam',
    label: 'Malam Kota',
    skyColor: '#050914',
    fogColor: '#050914',
    sunColor: '#3B82F6',
    sunIntensity: 0.14,
    sunPosition: [-18, 26, 20],
    hemiSky: '#0F1D36',
    hemiGround: '#02040A',
    hemiIntensity: 0.1,
    envIntensity: 0.02,
    interiorGlow: 3.4,
    spotIntensity: 9.5,
    exposure: 0.92,
  },
};

export const POI_AREAS: PoiArea[] = [
  {
    id: 'mahkota-logo',
    order: 1,
    name: 'Mahkota Fasad & Lambang BPS',
    shortName: 'Fasad & Logo',
    subtitle: 'Identitas Ikonik 4 Lantai',
    description:
      'Puncak menara tengah berbalut panel komposit biru sabak dengan lambang tiga pita BPS dan papan nama resmi Badan Pusat Statistik Provinsi Gorontalo.',
    architecturalHighlight:
      'Bingkai mahkota putih menonjol 0,6 m ke depan untuk menciptakan bayangan tegas di bawah sinar matahari tropis Gorontalo.',
    hotspotPosition: [0, 16.2, 3.2],
    cameraView: {
      position: [9.5, 14.2, 26.5],
      target: [0, 11.2, 1.5],
    },
  },
  {
    id: 'porte-cochere',
    order: 2,
    name: 'Pintu Masuk Porte-Cochère',
    shortName: 'Pintu Masuk',
    subtitle: 'Kanopi Penyambut Tamu',
    description:
      'Kanopi putih melengkung lebar ditopang empat pilar ramping di sisi depan yang menaungi jalur penurunan tamu dan akses ramp difabel.',
    architecturalHighlight:
      'Lengkungan simetris setinggi 4,4 m menghubungkan sisi taman depan dengan lobi utama tanpa memutus pandangan ke menara.',
    hotspotPosition: [0, 4.7, 10.2],
    cameraView: {
      position: [13.5, 6.2, 21.5],
      target: [0, 3.6, 9.0],
    },
  },
];
