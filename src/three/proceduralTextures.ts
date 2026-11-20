import * as THREE from 'three';

export interface ProceduralTexturePack {
  claddingMap: THREE.CanvasTexture;
  claddingBump: THREE.CanvasTexture;
  stuccoBump: THREE.CanvasTexture;
  conblockMap: THREE.CanvasTexture;
  conblockBump: THREE.CanvasTexture;
  lawnMap: THREE.CanvasTexture;
  curbMap: THREE.CanvasTexture;
  bpsSignMap: THREE.CanvasTexture;
  fenceSignMap: THREE.CanvasTexture;
  securitySignMap: THREE.CanvasTexture;
  flagMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  asphaltMap: THREE.CanvasTexture;
  dispose: () => void;
}

function configureTexture(
  tex: THREE.CanvasTexture,
  anisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTexturePack(
  maxAnisotropy: number,
): ProceduralTexturePack {
  const anisotropy = Math.max(1, Math.min(maxAnisotropy || 4, 8));

  // 1. Slate-Blue ACP Cladding Panels (Color + Bump)
  const cladCanvas = document.createElement('canvas');
  cladCanvas.width = 512;
  cladCanvas.height = 512;
  const cctx = cladCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bctx = bumpCanvas.getContext('2d')!;

  cctx.fillStyle = '#3F4B68';
  cctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#D8D8D8';
  bctx.fillRect(0, 0, 512, 512);

  // Subtle panel-by-panel tonal variation + fine metallic grain
  const cols = 4;
  const rows = 8;
  const pw = 512 / cols;
  const ph = 512 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const delta = ((r * 7 + c * 13) % 5) - 2;
      const baseR = 62 + delta * 2;
      const baseG = 75 + delta * 2;
      const baseB = 104 + delta * 3;
      cctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
      cctx.fillRect(c * pw + 2, r * ph + 2, pw - 4, ph - 4);

      // Subtle sheen gradient per ACP tile
      const grad = cctx.createLinearGradient(c * pw, r * ph, c * pw + pw, r * ph + ph);
      grad.addColorStop(0, 'rgba(255,255,255,0.05)');
      grad.addColorStop(1, 'rgba(15,23,42,0.08)');
      cctx.fillStyle = grad;
      cctx.fillRect(c * pw + 2, r * ph + 2, pw - 4, ph - 4);
    }
  }

  // Crisp ACP seam lines
  cctx.strokeStyle = '#252E42';
  cctx.lineWidth = 3;
  bctx.strokeStyle = '#303030';
  bctx.lineWidth = 4;
  for (let c = 0; c <= cols; c++) {
    const x = c * pw;
    cctx.beginPath();
    cctx.moveTo(x, 0);
    cctx.lineTo(x, 512);
    cctx.stroke();

    bctx.beginPath();
    bctx.moveTo(x, 0);
    bctx.lineTo(x, 512);
    bctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = r * ph;
    cctx.beginPath();
    cctx.moveTo(0, y);
    cctx.lineTo(512, y);
    cctx.stroke();

    bctx.beginPath();
    bctx.moveTo(0, y);
    bctx.lineTo(512, y);
    bctx.stroke();
  }

  const claddingMap = configureTexture(new THREE.CanvasTexture(cladCanvas), anisotropy, true, 3, 2);
  const claddingBump = configureTexture(new THREE.CanvasTexture(bumpCanvas), anisotropy, false, 3, 2);

  // 2. White Architectural Stucco Bump
  const stuccoCanvas = document.createElement('canvas');
  stuccoCanvas.width = 256;
  stuccoCanvas.height = 256;
  const sctx = stuccoCanvas.getContext('2d')!;
  const sImg = sctx.createImageData(256, 256);
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < sImg.data.length; i += 4) {
    const v = 185 + Math.floor(rand() * 55);
    sImg.data[i] = v;
    sImg.data[i + 1] = v;
    sImg.data[i + 2] = v;
    sImg.data[i + 3] = 255;
  }
  sctx.putImageData(sImg, 0, 0);
  const stuccoBump = configureTexture(new THREE.CanvasTexture(stuccoCanvas), anisotropy, false, 4, 4);

  // 3. Conblock Paving Block Plaza (Color + Bump)
  const paveCanvas = document.createElement('canvas');
  paveCanvas.width = 512;
  paveCanvas.height = 512;
  const pctx = paveCanvas.getContext('2d')!;

  const paveBumpCanvas = document.createElement('canvas');
  paveBumpCanvas.width = 512;
  paveBumpCanvas.height = 512;
  const pbctx = paveBumpCanvas.getContext('2d')!;

  pctx.fillStyle = '#CBD2DC';
  pctx.fillRect(0, 0, 512, 512);
  pbctx.fillStyle = '#505050';
  pbctx.fillRect(0, 0, 512, 512);

  const brickW = 64;
  const brickH = 32;
  for (let row = 0; row < 512 / brickH; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 512 / brickW + 1; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;
      const shade = 200 + Math.floor(rand() * 22);
      pctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      pctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);

      pbctx.fillStyle = '#DCDCDC';
      pbctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
    }
  }
  const conblockMap = configureTexture(new THREE.CanvasTexture(paveCanvas), anisotropy, true, 12, 12);
  const conblockBump = configureTexture(new THREE.CanvasTexture(paveBumpCanvas), anisotropy, false, 12, 12);

  // 4. Lawn Grass Texture
  const lawnCanvas = document.createElement('canvas');
  lawnCanvas.width = 256;
  lawnCanvas.height = 256;
  const lctx = lawnCanvas.getContext('2d')!;
  lctx.fillStyle = '#4B8B43';
  lctx.fillRect(0, 0, 256, 256);
  // Subtle mowed bands
  for (let i = 0; i < 8; i++) {
    lctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    lctx.fillRect(i * 32, 0, 32, 256);
  }
  for (let i = 0; i < 900; i++) {
    const gx = Math.floor(rand() * 256);
    const gy = Math.floor(rand() * 256);
    lctx.fillStyle = rand() > 0.5 ? 'rgba(134, 239, 172, 0.18)' : 'rgba(20, 83, 45, 0.18)';
    lctx.fillRect(gx, gy, 2, 4);
  }
  const lawnMap = configureTexture(new THREE.CanvasTexture(lawnCanvas), anisotropy, true, 4, 4);

  // 5. Kanstin Black & White Curb Stripes
  const curbCanvas = document.createElement('canvas');
  curbCanvas.width = 256;
  curbCanvas.height = 64;
  const kctx = curbCanvas.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    kctx.fillStyle = i % 2 === 0 ? '#F8FAFC' : '#1E293B';
    kctx.fillRect(i * 32, 0, 32, 64);
  }
  const curbMap = configureTexture(new THREE.CanvasTexture(curbCanvas), anisotropy, true, 6, 1);

  // 6. BPS Provinsi Gorontalo Crown Logo & Signage (using official /assets/aistudio/image_7240f3d0.png)
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 384;
  const gctx = signCanvas.getContext('2d')!;

  const drawCrownBackgroundAndText = () => {
    // Match facade slate-blue background
    gctx.fillStyle = '#3C4865';
    gctx.fillRect(0, 0, 512, 384);

    // Subtle architectural panel border
    gctx.strokeStyle = 'rgba(255,255,255,0.14)';
    gctx.lineWidth = 4;
    gctx.strokeRect(8, 8, 496, 368);

    // Crisp White Italic Lettering matching BPS Provinsi Gorontalo identity
    gctx.fillStyle = '#F8FAFC';
    gctx.textAlign = 'center';
    gctx.font = 'italic 800 30px "Plus Jakarta Sans", system-ui, sans-serif';
    gctx.fillText('BADAN PUSAT STATISTIK', 256, 294);

    gctx.fillStyle = '#E2E8F0';
    gctx.font = 'italic 700 24px "Plus Jakarta Sans", system-ui, sans-serif';
    gctx.fillText('PROVINSI GORONTALO', 256, 332);
  };

  // Helper to draw a slanted stepped Z-bar matching the official BPS emblem
  const drawSteppedBar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    color: string,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    // Upper vertical-slanted leg + middle step + lower vertical-slanted leg
    ctx.moveTo(14, 0);
    ctx.lineTo(48, 0);
    ctx.lineTo(36, 52);
    ctx.lineTo(72, 52);
    ctx.lineTo(54, 128);
    ctx.lineTo(18, 128);
    ctx.lineTo(32, 68);
    ctx.lineTo(0, 68);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Immediate synchronous render of the authentic 3-stepped-bar BPS emblem
  drawCrownBackgroundAndText();
  gctx.save();
  // Tilted orbital swooshes (Blue lower-left, Orange upper-right)
  gctx.translate(256, 134);
  gctx.rotate(-0.32);
  gctx.beginPath();
  gctx.strokeStyle = '#0093DD';
  gctx.lineWidth = 10;
  gctx.arc(0, 0, 96, Math.PI * 0.15, Math.PI * 1.08);
  gctx.stroke();

  gctx.beginPath();
  gctx.strokeStyle = '#F39200';
  gctx.lineWidth = 10;
  gctx.arc(0, 0, 96, Math.PI * 1.15, Math.PI * 2.05);
  gctx.stroke();
  gctx.restore();

  drawSteppedBar(gctx, 162, 34, 0.95, '#0093DD'); // Blue left stepped bar
  drawSteppedBar(gctx, 214, 96, 0.95, '#6AB023'); // Green center-bottom stepped bar
  drawSteppedBar(gctx, 268, 34, 0.95, '#F39200'); // Orange right stepped bar

  const bpsSignMap = new THREE.CanvasTexture(signCanvas);
  bpsSignMap.colorSpace = THREE.SRGBColorSpace;
  bpsSignMap.anisotropy = anisotropy;
  bpsSignMap.needsUpdate = true;

  // 6b. Front Fence Dark-Granite Monument Sign Wall (matching image_8713374b.png)
  const fenceSignCanvas = document.createElement('canvas');
  fenceSignCanvas.width = 1024;
  fenceSignCanvas.height = 384;
  const fsctx = fenceSignCanvas.getContext('2d')!;

  const drawFenceSignBackgroundAndText = () => {
    // Dark charcoal-black granite stone background
    const stoneGrad = fsctx.createLinearGradient(0, 0, 1024, 384);
    stoneGrad.addColorStop(0, '#1C2128');
    stoneGrad.addColorStop(0.5, '#252B34');
    stoneGrad.addColorStop(1, '#181C22');
    fsctx.fillStyle = stoneGrad;
    fsctx.fillRect(0, 0, 1024, 384);

    // Subtle granite speckle grain
    for (let i = 0; i < 1600; i++) {
      const gx = (i * 73) % 1024;
      const gy = (i * 137) % 384;
      fsctx.fillStyle =
        i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.18)';
      fsctx.fillRect(gx, gy, 2, 2);
    }

    // Subtle inner bevel line
    fsctx.strokeStyle = 'rgba(255,255,255,0.16)';
    fsctx.lineWidth = 4;
    fsctx.strokeRect(14, 14, 996, 356);

    // Metallic white institutional typography matching upper building crown & fence photo
    fsctx.fillStyle = '#F8FAFC';
    fsctx.textAlign = 'center';
    fsctx.font = 'italic 800 44px "Plus Jakarta Sans", Arial, sans-serif';
    fsctx.fillText('BADAN PUSAT STATISTIK', 512, 258);
    fsctx.font = 'italic 800 38px "Plus Jakarta Sans", Arial, sans-serif';
    fsctx.fillText('PROVINSI GORONTALO', 512, 308);
    fsctx.fillStyle = '#CBD5E1';
    fsctx.font = '600 22px "DM Sans", Arial, sans-serif';
    fsctx.fillText('Jl. Prof. Dr. Aloei Saboe No. 117', 512, 348);
  };

  drawFenceSignBackgroundAndText();
  // Immediate synchronous render of authentic 3-stepped-bar BPS emblem on fence sign
  fsctx.save();
  fsctx.translate(512, 114);
  fsctx.rotate(-0.32);
  fsctx.beginPath();
  fsctx.strokeStyle = '#0093DD';
  fsctx.lineWidth = 9;
  fsctx.arc(0, 0, 82, Math.PI * 0.15, Math.PI * 1.08);
  fsctx.stroke();

  fsctx.beginPath();
  fsctx.strokeStyle = '#F39200';
  fsctx.lineWidth = 9;
  fsctx.arc(0, 0, 82, Math.PI * 1.15, Math.PI * 2.05);
  fsctx.stroke();
  fsctx.restore();

  drawSteppedBar(fsctx, 430, 26, 0.82, '#0093DD');
  drawSteppedBar(fsctx, 474, 80, 0.82, '#6AB023');
  drawSteppedBar(fsctx, 520, 26, 0.82, '#F39200');

  const fenceSignMap = new THREE.CanvasTexture(fenceSignCanvas);
  fenceSignMap.colorSpace = THREE.SRGBColorSpace;
  fenceSignMap.anisotropy = anisotropy;
  fenceSignMap.needsUpdate = true;

  // 6c. Pos Security Sign Plaque Texture
  const secCanvas = document.createElement('canvas');
  secCanvas.width = 512;
  secCanvas.height = 128;
  const sctx2 = secCanvas.getContext('2d')!;
  sctx2.fillStyle = '#1E293B';
  sctx2.fillRect(0, 0, 512, 128);
  sctx2.fillStyle = '#F97316';
  sctx2.fillRect(0, 0, 18, 128);
  sctx2.fillStyle = '#FFFFFF';
  sctx2.textAlign = 'center';
  sctx2.font = '800 44px "Plus Jakarta Sans", Arial, sans-serif';
  sctx2.fillText('POS SECURITY', 264, 62);
  sctx2.fillStyle = '#94A3B8';
  sctx2.font = '600 22px "DM Sans", Arial, sans-serif';
  sctx2.fillText('GERBANG MASUK UTAMA', 264, 100);
  const securitySignMap = new THREE.CanvasTexture(secCanvas);
  securitySignMap.colorSpace = THREE.SRGBColorSpace;
  securitySignMap.anisotropy = anisotropy;
  securitySignMap.needsUpdate = true;

  // Load the exact user-provided BPS Provinsi Gorontalo logo image and key out the white background
  const logoImg = new Image();
  logoImg.crossOrigin = 'anonymous';
  logoImg.onload = () => {
    try {
      const off = document.createElement('canvas');
      off.width = logoImg.width;
      off.height = logoImg.height;
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.drawImage(logoImg, 0, 0);

      // Extract the emblem portion (top 73% of image_7240f3d0.png) and remove white background
      const emblemH = Math.floor(logoImg.height * 0.735);
      const imgData = octx.getImageData(0, 0, logoImg.width, emblemH);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const minC = Math.min(r, g, b);
        const maxC = Math.max(r, g, b);
        const sat = maxC - minC;
        if (minC > 225 && sat < 28) {
          d[i + 3] = 0;
        } else if (minC > 195 && sat < 45) {
          const factor = Math.max(0, Math.min(1, (225 - minC) / 30));
          d[i + 3] = Math.round(d[i + 3] * factor);
        }
      }
      octx.putImageData(imgData, 0, 0);

      drawCrownBackgroundAndText();
      const targetW = 240;
      const targetH = Math.round((emblemH / logoImg.width) * targetW);
      gctx.drawImage(
        off,
        0,
        0,
        logoImg.width,
        emblemH,
        256 - targetW / 2,
        22,
        targetW,
        targetH,
      );
      bpsSignMap.needsUpdate = true;

      // Also draw the keyed official BPS emblem onto the Front Fence Monument Sign Wall
      drawFenceSignBackgroundAndText();
      const fenceLogoW = 220;
      const fenceLogoH = Math.round((emblemH / logoImg.width) * fenceLogoW);
      fsctx.drawImage(
        off,
        0,
        0,
        logoImg.width,
        emblemH,
        512 - fenceLogoW / 2,
        16,
        fenceLogoW,
        fenceLogoH,
      );
      fenceSignMap.needsUpdate = true;
    } catch {
      // Fallback already rendered
    }
  };
  logoImg.src = '/assets/aistudio/image_7240f3d0.png';

  // 7. Indonesian Merah-Putih Flag Texture
  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 256;
  flagCanvas.height = 160;
  const fctx = flagCanvas.getContext('2d')!;
  fctx.fillStyle = '#DC2626';
  fctx.fillRect(0, 0, 256, 80);
  fctx.fillStyle = '#F8FAFC';
  fctx.fillRect(0, 80, 256, 80);
  // Subtle fabric weave shadow gradient
  const fGrad = fctx.createLinearGradient(0, 0, 256, 0);
  fGrad.addColorStop(0, 'rgba(0,0,0,0.08)');
  fGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  fGrad.addColorStop(1, 'rgba(0,0,0,0.12)');
  fctx.fillStyle = fGrad;
  fctx.fillRect(0, 0, 256, 160);
  const flagMap = new THREE.CanvasTexture(flagCanvas);
  flagMap.colorSpace = THREE.SRGBColorSpace;
  flagMap.anisotropy = anisotropy;
  flagMap.needsUpdate = true;

  // 8. High-Contrast Radial Contact Shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shctx = shadowCanvas.getContext('2d')!;
  const rad = shctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  rad.addColorStop(0, 'rgba(9, 14, 26, 0.85)');
  rad.addColorStop(0.5, 'rgba(9, 14, 26, 0.48)');
  rad.addColorStop(0.82, 'rgba(9, 14, 26, 0.16)');
  rad.addColorStop(1, 'rgba(9, 14, 26, 0)');
  shctx.fillStyle = rad;
  shctx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);
  contactShadowMap.needsUpdate = true;

  // 9. Clean Asphalt / Driveway Edge
  const aspCanvas = document.createElement('canvas');
  aspCanvas.width = 256;
  aspCanvas.height = 256;
  const actx = aspCanvas.getContext('2d')!;
  actx.fillStyle = '#334155';
  actx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const ax = Math.floor(rand() * 256);
    const ay = Math.floor(rand() * 256);
    actx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.14)';
    actx.fillRect(ax, ay, 2, 2);
  }
  const asphaltMap = configureTexture(new THREE.CanvasTexture(aspCanvas), anisotropy, true, 4, 4);

  return {
    claddingMap,
    claddingBump,
    stuccoBump,
    conblockMap,
    conblockBump,
    lawnMap,
    curbMap,
    bpsSignMap,
    fenceSignMap,
    securitySignMap,
    flagMap,
    contactShadowMap,
    asphaltMap,
    dispose: () => {
      claddingMap.dispose();
      claddingBump.dispose();
      stuccoBump.dispose();
      conblockMap.dispose();
      conblockBump.dispose();
      lawnMap.dispose();
      curbMap.dispose();
      bpsSignMap.dispose();
      fenceSignMap.dispose();
      securitySignMap.dispose();
      flagMap.dispose();
      contactShadowMap.dispose();
      asphaltMap.dispose();
    },
  };
}
