import * as THREE from 'three';
import { POI_AREAS } from '../data/poiData';
import type { ProceduralTexturePack } from './proceduralTextures';

export interface BpsCampusHandle {
  root: THREE.Group;
  interactables: THREE.Object3D[];
  hotspotRings: Map<string, THREE.Mesh>;
  hotspotCores: Map<string, THREE.Mesh>;
  interiorGlowMaterials: THREE.MeshStandardMaterial[];
  lampPoolMaterials: THREE.MeshBasicMaterial[];
  spotLights: THREE.PointLight[];
  updateAnimations: (elapsed: number, activePoiId: string | null) => void;
  dispose: () => void;
}

export function buildBpsGorontaloCampus(
  textures: ProceduralTexturePack,
): BpsCampusHandle {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const interactables: THREE.Object3D[] = [];
  const hotspotRings = new Map<string, THREE.Mesh>();
  const hotspotCores = new Map<string, THREE.Mesh>;
  const interiorGlowMaterials: THREE.MeshStandardMaterial[] = [];
  const lampPoolMaterials: THREE.MeshBasicMaterial[] = [];
  const spotLights: THREE.PointLight[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // --- Shared PBR Material Palette (contrasting roughness & metalness) ---
  const claddingMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.claddingMap,
      bumpMap: textures.claddingBump,
      bumpScale: 0.045,
      roughness: 0.42,
      metalness: 0.35,
    }),
  );

  const whiteStuccoMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf4f6f9,
      bumpMap: textures.stuccoBump,
      bumpScale: 0.015,
      roughness: 0.78,
      metalness: 0.04,
    }),
  );

  const warmTrimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe5eaf2,
      roughness: 0.65,
      metalness: 0.08,
    }),
  );

  const darkGlassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x10243d,
      roughness: 0.08,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.9,
    }),
  );

  const blueAccentGlassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x1e4d8c,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    }),
  );

  const lobbyWarmGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: new THREE.Color(0xffb86c),
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.05,
    }),
  );
  interiorGlowMaterials.push(lobbyWarmGlowMat);

  const steelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdbe2ec,
      roughness: 0.2,
      metalness: 0.92,
    }),
  );

  const darkMetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75,
    }),
  );

  const plinthMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.72,
      metalness: 0.04,
    }),
  );

  const plinthBaseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdbe3ee,
      roughness: 0.68,
      metalness: 0.08,
    }),
  );

  const conblockMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.conblockMap,
      bumpMap: textures.conblockBump,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );

  const lawnMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lawnMap,
      roughness: 0.92,
      metalness: 0.0,
    }),
  );

  const curbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.curbMap,
      roughness: 0.8,
      metalness: 0.03,
    }),
  );

  const signMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.bpsSignMap,
      roughness: 0.35,
      metalness: 0.25,
    }),
  );

  const contactShadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    }),
  );

  const lampBulbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: new THREE.Color(0xffb74d),
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.05,
    }),
  );
  interiorGlowMaterials.push(lampBulbMat);

  const lampPoolMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      color: 0xffa726,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  lampPoolMaterials.push(lampPoolMat);

  // --- 1. Architectural Diorama Plinth & Ground Plaza ---
  // Inspired by Reference 3's clean beveled exhibition base
  const plinthGroup = new THREE.Group();

  const plinthLower = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(39.0, 1.0, 38.0)),
    plinthBaseMat,
  );
  plinthLower.position.set(0, -0.75, 5.0);
  plinthLower.receiveShadow = true;
  plinthGroupAdd(plinthGroupShadowSetup(plinthLower));

  const plinthTop = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(40.0, 0.5, 39.0)),
    plinthMat,
  );
  plinthTop.position.set(0, -0.25, 5.0);
  plinthTop.receiveShadow = true;
  plinthTop.castShadow = true;
  plinthGroupAdd(plinthTop);

  // Conblock courtyard floor (offset +0.02 above plinthTop y=0)
  const courtyard = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(38.4, 0.08, 37.4)),
    conblockMat,
  );
  courtyard.position.set(0, 0.02, 5.0);
  courtyard.receiveShadow = true;
  plinthGroupAdd(courtyard);

  function plinthGroupAdd(mesh: THREE.Object3D) {
    plinthGroup.add(mesh);
  }
  function plinthGroupShadowSetup(mesh: THREE.Mesh) {
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Front manicured grass lawn island (curved-front style via beveled ExtrudeGeometry)
  const lawnShape = new THREE.Shape();
  lawnShape.moveTo(-7.2, -3.4);
  lawnShape.lineTo(7.2, -3.4);
  lawnShape.quadraticCurveTo(7.8, 3.2, 0, 3.8);
  lawnShape.quadraticCurveTo(-7.8, 3.2, -7.2, -3.4);

  const lawnGeo = trackGeo(
    new THREE.ExtrudeGeometry(lawnShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.05,
      bevelSegments: 2,
    }),
  );
  lawnGeo.rotateX(Math.PI / 2);
  const lawnMesh = new THREE.Mesh(lawnGeo, lawnMat);
  lawnMesh.position.set(0, 0.2, 16.4);
  lawnMesh.receiveShadow = true;
  plinthGroup.add(lawnMesh);

  // Kanstin black & white curb border around front lawn
  const curbGeo = trackGeo(
    new THREE.ExtrudeGeometry(lawnShape, {
      depth: 0.16,
      bevelEnabled: false,
    }),
  );
  curbGeo.rotateX(Math.PI / 2);
  const curbMesh = new THREE.Mesh(curbGeo, curbMat);
  curbMesh.scale.set(1.035, 1, 1.045);
  curbMesh.position.set(0, 0.18, 16.4);
  curbMesh.receiveShadow = true;
  plinthGroup.add(curbMesh);

  root.add(plinthGroup);

  // --- 2. Ground-Floor White Modernist Podium Lobby ---
  const buildingGroup = new THREE.Group();

  // Ground contact shadow beneath entire podium footprint
  const podiumContactShadow = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(22.4, 15.6)),
    contactShadowMat,
  );
  podiumContactShadow.rotation.x = -Math.PI / 2;
  podiumContactShadow.position.set(0, 0.068, -0.4);
  buildingGroup.add(podiumContactShadow);

  // Podium base slab
  const podiumStep = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(20.4, 0.34, 13.6)),
    warmTrimMat,
  );
  podiumStep.position.set(0, 0.21, -0.4);
  podiumStep.receiveShadow = true;
  podiumStep.castShadow = true;
  buildingGroup.add(podiumStep);

  // Lobby dark glass enclosure
  const lobbyGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(18.6, 3.1, 11.8)),
    darkGlassMat,
  );
  lobbyGlass.position.set(0, 1.9, -0.4);
  lobbyGlass.castShadow = true;
  lobbyGlass.receiveShadow = true;
  buildingGroup.add(lobbyGlass);

  // Warm illuminated interior reception volume (seen subtly behind glass)
  const receptionLightBox = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(9.6, 2.2, 5.4)),
    lobbyWarmGlowMat,
  );
  receptionLightBox.position.set(0, 1.55, 1.6);
  buildingGroup.add(receptionLightBox);

  // Vertical white window mullions along podium front & sides
  const podiumMullionGeo = trackGeo(new THREE.BoxGeometry(0.18, 3.15, 0.22));
  const mullionPositionsX = [-8.6, -5.2, -2.1, 2.1, 5.2, 8.6];
  mullionPositionsX.forEach((mx) => {
    const m = new THREE.Mesh(podiumMullionGeo, whiteStuccoMat);
    m.position.set(mx, 1.92, 5.52);
    m.castShadow = true;
    buildingGroup.add(m);
  });

  // Main entrance dark double-door frame centered under portico
  const doorFrame = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.4, 2.65, 0.35)),
    darkMetalMat,
  );
  doorFrame.position.set(0, 1.7, 5.55);
  buildingGroup.add(doorFrame);

  // Podium overhanging white fascia roof (with subtle upper parapet for rooftop planters)
  const podiumRoof = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(20.2, 0.95, 13.4)),
    whiteStuccoMat,
  );
  podiumRoof.position.set(0, 3.92, -0.35);
  podiumRoof.castShadow = true;
  podiumRoof.receiveShadow = true;
  buildingGroup.add(podiumRoof);

  // Podium roof parapet lip
  const podiumParapet = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(20.3, 0.25, 13.5)),
    warmTrimMat,
  );
  podiumParapet.position.set(0, 4.42, -0.35);
  podiumParapet.castShadow = true;
  podiumParapet.receiveShadow = true;
  buildingGroup.add(podiumParapet);

  // --- 3. Upper 3-Story Main Tower (Slate-Blue ACP Cladding) ---
  // Main tower core (Floors 2, 3, 4)
  const towerCore = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(17.4, 9.6, 10.6)),
    claddingMat,
  );
  towerCore.position.set(0, 9.2, -1.6);
  towerCore.castShadow = true;
  towerCore.receiveShadow = true;
  buildingGroup.add(towerCore);

  // Upper cornice / parapet frame around top of building
  const topCornice = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(18.0, 0.55, 11.2)),
    claddingMat,
  );
  topCornice.position.set(0, 14.1, -1.6);
  topCornice.castShadow = true;
  topCornice.receiveShadow = true;
  buildingGroup.add(topCornice);

  const corniceTrim = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(18.15, 0.16, 11.35)),
    warmTrimMat,
  );
  corniceTrim.position.set(0, 14.42, -1.6);
  buildingGroup.add(corniceTrim);

  // Raised Central Crown Tower bearing the BPS Logo & Title
  const crownBox = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.8, 11.8, 1.35)),
    claddingMat,
  );
  crownBox.position.set(0, 10.35, 3.65);
  crownBox.castShadow = true;
  crownBox.receiveShadow = true;
  buildingGroup.add(crownBox);

  // Crown top white cap trim
  const crownCap = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.05, 0.22, 1.55)),
    whiteStuccoMat,
  );
  crownCap.position.set(0, 16.3, 3.65);
  buildingGroup.add(crownCap);

  // BPS Provinsi Gorontalo Signage Plaque on upper crown
  const signPlaque = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(4.1, 2.95)),
    signMat,
  );
  signPlaque.position.set(0, 14.65, 4.34);
  buildingGroup.add(signPlaque);

  // --- 4. Central Geometric X-Lattice (Krawang) Bay ---
  // White rectangular recess frame (3 stories tall)
  const krawangFrameOuter = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.45, 8.7, 0.38)),
    whiteStuccoMat,
  );
  krawangFrameOuter.position.set(0, 8.75, 4.28);
  krawangFrameOuter.castShadow = true;
  buildingGroup.add(krawangFrameOuter);

  // Dark reflective curtain-wall backing behind krawang lattice
  const krawangGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.85, 8.15, 0.18)),
    darkGlassMat,
  );
  krawangGlass.position.set(0, 8.75, 4.4);
  buildingGroup.add(krawangGlass);

  // Warm interior vertical strip behind central krawang (illuminates at senja/malam)
  const krawangGlow = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.55, 7.8, 0.08)),
    lobbyWarmGlowMat,
  );
  krawangGlow.position.set(0, 8.75, 4.33);
  buildingGroup.add(krawangGlow);

  // Instanced diagonal X-lattice bars (krawang) matching image 1 & 2
  const latticeCols = 3;
  const latticeRows = 9;
  const latW = 2.7;
  const latH = 7.95;
  const cellW = latW / latticeCols;
  const cellH = latH / latticeRows;
  const diagLen = Math.hypot(cellW, cellH);
  const diagAngle = Math.atan2(cellH, cellW);

  const barGeo = trackGeo(new THREE.BoxGeometry(diagLen, 0.085, 0.15));
  const totalBars = latticeCols * latticeRows * 2 + (latticeRows + 1);
  const latticeInstanced = new THREE.InstancedMesh(
    barGeo,
    whiteStuccoMat,
    totalBars,
  );
  latticeInstanced.castShadow = true;
  latticeInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let idx = 0;
  const startX = -latW / 2 + cellW / 2;
  const startY = 8.75 - latH / 2 + cellH / 2;
  for (let r = 0; r < latticeRows; r++) {
    for (let c = 0; c < latticeCols; c++) {
      const cx = startX + c * cellW;
      const cy = startY + r * cellH;

      // Forward slash
      dummy.position.set(cx, cy, 4.52);
      dummy.rotation.set(0, 0, diagAngle);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      latticeInstanced.setMatrixAt(idx++, dummy.matrix);

      // Back slash
      dummy.position.set(cx, cy, 4.52);
      dummy.rotation.set(0, 0, -diagAngle);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      latticeInstanced.setMatrixAt(idx++, dummy.matrix);
    }
  }
  // Horizontal divider bars across lattice
  for (let r = 0; r <= latticeRows; r++) {
    const hy = 8.75 - latH / 2 + r * cellH;
    dummy.position.set(0, hy, 4.52);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(latW / diagLen, 0.85, 1);
    dummy.updateMatrix();
    latticeInstanced.setMatrixAt(idx++, dummy.matrix);
  }
  latticeInstanced.instanceMatrix.needsUpdate = true;
  latticeInstanced.computeBoundingSphere();
  buildingGroup.add(latticeInstanced);

  // --- 5. Flanking Left & Right Curtain-Wall Window Bays ---
  const buildWingWindowBay = (centerX: number) => {
    const bayGroup = new THREE.Group();

    // Recessed dark glass wall
    const glass = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(3.8, 8.2, 0.25)),
      darkGlassMat,
    );
    glass.position.set(centerX, 8.8, 3.68);
    bayGroup.add(glass);

    // Subtle warm interior light planes per floor
    [6.1, 8.8, 11.5].forEach((fy) => {
      const glow = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(3.5, 1.5, 0.08)),
        lobbyWarmGlowMat,
      );
      glow.position.set(centerX, fy, 3.58);
      bayGroup.add(glow);
    });

    // Crisp white outer frame
    const topFrame = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(4.1, 0.24, 0.48)),
      whiteStuccoMat,
    );
    topFrame.position.set(centerX, 13.02, 3.78);
    bayGroup.add(topFrame);

    const botFrame = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(4.1, 0.24, 0.48)),
      whiteStuccoMat,
    );
    botFrame.position.set(centerX, 4.65, 3.78);
    bayGroup.add(botFrame);

    // 5 vertical white fins / mullions
    const vFinGeo = trackGeo(new THREE.BoxGeometry(0.14, 8.5, 0.46));
    for (let i = 0; i < 5; i++) {
      const fx = centerX - 1.9 + i * 0.95;
      const fin = new THREE.Mesh(vFinGeo, whiteStuccoMat);
      fin.position.set(fx, 8.82, 3.8);
      fin.castShadow = true;
      bayGroup.add(fin);
    }

    // 2 horizontal white spandrel floor bands
    const hBandGeo = trackGeo(new THREE.BoxGeometry(3.95, 0.34, 0.44));
    [7.4, 10.2].forEach((hy) => {
      const band = new THREE.Mesh(hBandGeo, whiteStuccoMat);
      band.position.set(centerX, hy, 3.78);
      band.castShadow = true;
      bayGroup.add(band);
    });

    buildingGroup.add(bayGroup);
  };

  buildWingWindowBay(-5.05);
  buildWingWindowBay(5.05);

  // Far-left & far-right narrow blue-glass accent strips (clearly visible in Image 2)
  const buildEdgeStrip = (edgeX: number) => {
    const stripFrame = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.95, 8.55, 0.36)),
      whiteStuccoMat,
    );
    stripFrame.position.set(edgeX, 8.82, 3.74);
    buildingGroup.add(stripFrame);

    const stripGlass = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.68, 8.2, 0.42)),
      blueAccentGlassMat,
    );
    stripGlass.position.set(edgeX, 8.82, 3.76);
    buildingGroup.add(stripGlass);
  };
  buildEdgeStrip(-7.95);
  buildEdgeStrip(7.95);

  // --- 6. Side Facade Architectural Details (Right & Left Elevations from Image 1) ---
  const buildSideElevation = (sideSign: 1 | -1) => {
    const sideX = sideSign * 8.75;
    // Tall white vertical pilaster ribs toward front corner
    const ribGeo = trackGeo(new THREE.BoxGeometry(0.28, 9.2, 0.32));
    [1.8, 0.95].forEach((rz) => {
      const rib = new THREE.Mesh(ribGeo, whiteStuccoMat);
      rib.position.set(sideX + sideSign * 0.08, 9.2, rz);
      rib.castShadow = true;
      buildingGroup.add(rib);
    });

    // 3 stacked projecting square-framed window boxes (floors 2, 3, 4)
    const boxFrameGeo = trackGeo(new THREE.BoxGeometry(0.42, 1.9, 1.9));
    const boxGlassGeo = trackGeo(new THREE.BoxGeometry(0.46, 1.42, 1.42));
    [-1.4, -4.4].forEach((wz) => {
      [6.3, 9.1, 11.9].forEach((wy) => {
        const wf = new THREE.Mesh(boxFrameGeo, whiteStuccoMat);
        wf.position.set(sideX + sideSign * 0.12, wy, wz);
        wf.castShadow = true;
        buildingGroup.add(wf);

        const wg = new THREE.Mesh(boxGlassGeo, darkGlassMat);
        wg.position.set(sideX + sideSign * 0.14, wy, wz);
        buildingGroup.add(wg);
      });
    });
  };
  buildSideElevation(1);
  buildSideElevation(-1);

  // Rooftop service penthouse & mast antennas (visible on right roof in Images 1 & 2)
  const roofPenthouse = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.6, 1.45, 2.8)),
    whiteStuccoMat,
  );
  roofPenthouse.position.set(4.5, 15.05, -2.2);
  roofPenthouse.castShadow = true;
  buildingGroup.add(roofPenthouse);

  const antennaGeo = trackGeo(new THREE.CylinderGeometry(0.03, 0.05, 1.4, 8));
  [3.9, 4.5, 5.1].forEach((ax) => {
    const ant = new THREE.Mesh(antennaGeo, steelMat);
    ant.position.set(ax, 16.4, -2.2);
    buildingGroup.add(ant);
  });

  // --- 7. Iconic Curved White Porte-Cochère Canopy Arch & Columns ---
  const porticoGroup = new THREE.Group();

  // Sweeping curved arch fascia (ExtrudeGeometry arc spanning x = -10.5 .. +10.5)
  const archSpan = 10.6;
  const archShape = new THREE.Shape();
  archShape.moveTo(-archSpan, 3.65);
  archShape.quadraticCurveTo(0, 4.55, archSpan, 3.65);
  archShape.lineTo(archSpan, 4.75);
  archShape.quadraticCurveTo(0, 5.1, -archSpan, 4.75);
  archShape.closePath();

  const archGeo = trackGeo(
    new THREE.ExtrudeGeometry(archShape, {
      depth: 1.55,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 2,
    }),
  );
  const frontArch = new THREE.Mesh(archGeo, whiteStuccoMat);
  frontArch.position.set(0, 0, 9.1);
  frontArch.castShadow = true;
  frontArch.receiveShadow = true;
  porticoGroup.add(frontArch);

  // Flat canopy soffit connecting the curved arch back to the podium lobby
  const canopyRoof = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(11.6, 0.42, 4.6)),
    whiteStuccoMat,
  );
  canopyRoof.position.set(0, 4.18, 7.35);
  canopyRoof.castShadow = true;
  canopyRoof.receiveShadow = true;
  porticoGroup.add(canopyRoof);

  // Warm recessed downlight glow underneath the porte-cochère soffit
  const soffitGlow = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(8.4, 2.8)),
    lobbyWarmGlowMat,
  );
  soffitGlow.rotation.x = Math.PI / 2;
  soffitGlow.position.set(0, 3.95, 7.6);
  porticoGroup.add(soffitGlow);

  // 4 Tall White Front Columns + 2 Inner Columns supporting the arch
  const frontColGeo = trackGeo(new THREE.BoxGeometry(0.72, 4.45, 0.72));
  const innerColGeo = trackGeo(new THREE.BoxGeometry(0.62, 4.1, 0.62));
  const colPlinthGeo = trackGeo(new THREE.BoxGeometry(0.9, 0.25, 0.9));

  const colShadowGeo = trackGeo(new THREE.PlaneGeometry(2.1, 2.1));
  [-9.8, -3.55, 3.55, 9.8].forEach((cx) => {
    const col = new THREE.Mesh(frontColGeo, whiteStuccoMat);
    col.position.set(cx, 2.25, 9.9);
    col.castShadow = true;
    col.receiveShadow = true;
    porticoGroup.add(col);

    const base = new THREE.Mesh(colPlinthGeo, warmTrimMat);
    base.position.set(cx, 0.14, 9.9);
    base.castShadow = true;
    base.receiveShadow = true;
    porticoGroup.add(base);

    const colShadow = new THREE.Mesh(colShadowGeo, contactShadowMat);
    colShadow.rotation.x = -Math.PI / 2;
    colShadow.position.set(cx, 0.068, 9.9);
    porticoGroup.add(colShadow);
  });

  [-3.55, 3.55].forEach((cx) => {
    const col = new THREE.Mesh(innerColGeo, whiteStuccoMat);
    col.position.set(cx, 2.08, 6.9);
    col.castShadow = true;
    col.receiveShadow = true;
    porticoGroup.add(col);

    const colShadow = new THREE.Mesh(colShadowGeo, contactShadowMat);
    colShadow.rotation.x = -Math.PI / 2;
    colShadow.position.set(cx, 0.068, 6.9);
    porticoGroup.add(colShadow);
  });

  // Left & Right Curved Driveway Ramps + Stainless Handrails (seen in Image 2)
  const rampGeo = trackGeo(new THREE.BoxGeometry(4.2, 0.22, 1.3));
  [-6.8, 6.8].forEach((rx) => {
    const ramp = new THREE.Mesh(rampGeo, warmTrimMat);
    ramp.position.set(rx, 0.22, 6.35);
    ramp.rotation.z = rx < 0 ? 0.06 : -0.06;
    ramp.receiveShadow = true;
    porticoGroup.add(ramp);

    const rail = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(3.8, 0.07, 0.06)),
      steelMat,
    );
    rail.position.set(rx, 0.92, 6.9);
    rail.rotation.z = rx < 0 ? 0.06 : -0.06;
    porticoGroup.add(rail);
  });

  buildingGroup.add(porticoGroup);

  root.add(buildingGroup);

  // --- 9. Indonesian Merah-Putih Flagpole (Animated Waving Cloth) ---
  const flagGroup = new THREE.Group();
  const poleBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.32, 0.38, 0.45, 16)),
    whiteStuccoMat,
  );
  poleBase.position.set(0, 0.45, 14.8);
  poleBase.castShadow = true;
  flagGroup.add(poleBase);

  const flagpole = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.095, 9.6, 12)),
    steelMat,
  );
  flagpole.position.set(0, 5.25, 14.8);
  flagpole.castShadow = true;
  flagGroup.add(flagpole);

  const finial = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.14, 12, 12)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.22,
        metalness: 0.88,
      }),
    ),
  );
  finial.position.set(0, 10.1, 14.8);
  flagGroup.add(finial);

  const flagGeo = trackGeo(new THREE.PlaneGeometry(2.3, 1.45, 16, 8));
  const flagBasePositions = new Float32Array(flagGeo.attributes.position.array);
  const flagMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.flagMap,
      roughness: 0.72,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(1.18, 9.2, 14.8);
  flagMesh.castShadow = true;
  flagGroup.add(flagMesh);

  root.add(flagGroup);

  // --- 10. Covered Carport & Motorcycle Shelters (From Image 2) ---
  const buildShelter = (x: number, z: number, lenZ: number, isCarport: boolean) => {
    const shelter = new THREE.Group();
    const w = isCarport ? 4.2 : 3.2;
    const h = isCarport ? 2.55 : 2.25;

    const roof = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(w, 0.14, lenZ)),
      whiteStuccoMat,
    );
    roof.position.set(x, h, z);
    roof.rotation.z = isCarport ? -0.08 : 0.08;
    roof.castShadow = true;
    roof.receiveShadow = true;
    shelter.add(roof);

    const postGeo = trackGeo(new THREE.CylinderGeometry(0.07, 0.07, h, 8));
    [-lenZ / 2 + 0.6, 0, lenZ / 2 - 0.6].forEach((pz) => {
      const post = new THREE.Mesh(postGeo, darkMetalMat);
      post.position.set(x + (isCarport ? -w / 2 + 0.35 : w / 2 - 0.35), h / 2, z + pz);
      post.castShadow = true;
      shelter.add(post);
    });

    root.add(shelter);
  };
  buildShelter(-14.2, 3.0, 12.0, true);
  buildShelter(14.5, 4.5, 10.5, false);

  // --- 11. Miniature Stylized Service SUVs (3-5 part Composite Groups) ---
  const buildServiceSuv = (
    bodyColor: number,
    x: number,
    y: number,
    z: number,
    rotY: number,
  ) => {
    const car = new THREE.Group();
    const bodyMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: bodyColor,
        roughness: 0.22,
        metalness: 0.65,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
    );
    const cabinGlassMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.08,
        metalness: 0.3,
      }),
    );
    const tireMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.85,
        metalness: 0.05,
      }),
    );

    const chassis = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(3.2, 0.7, 1.55)),
      bodyMat,
    );
    chassis.position.y = 0.56;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    car.add(chassis);

    const cabin = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.85, 0.58, 1.38)),
      cabinGlassMat,
    );
    cabin.position.set(-0.2, 1.15, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    car.add(cabin);

    const roofCap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.75, 0.08, 1.34)),
      bodyMat,
    );
    roofCap.position.set(-0.2, 1.46, 0);
    roofCap.castShadow = true;
    roofCap.receiveShadow = true;
    car.add(roofCap);

    // Glowing Headlights (+X front) & Taillights (-X rear)
    const headLightGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.16, 0.32));
    [-0.52, 0.52].forEach((hz) => {
      const hl = new THREE.Mesh(headLightGeo, lampBulbMat);
      hl.position.set(1.61, 0.58, hz);
      car.add(hl);
    });

    // 4 wheels
    const wheelGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 16));
    wheelGeo.rotateX(Math.PI / 2);
    [
      [-0.95, 0.32, 0.76],
      [0.95, 0.32, 0.76],
      [-0.95, 0.32, -0.76],
      [0.95, 0.32, -0.76],
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      car.add(wheel);
    });

    // Crisp contact shadow disc beneath car
    const shadow = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(4.3, 2.5)),
      contactShadowMat,
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.025;
    car.add(shadow);

    car.position.set(x, y, z);
    car.rotation.y = rotY;
    root.add(car);
    return car;
  };

  // White SUV parked neatly under the left carport
  buildServiceSuv(0xf1f5f9, -14.0, 0.06, 5.2, 0);
  // Orange SUV parked right next to the white SUV inside the left carport
  buildServiceSuv(0xf97316, -14.0, 0.06, 2.4, 0);
  // Black SUV starting further back (-11.5) and driving forward across the porte-cochère drop-off lane
  const cruisingBlackCar = buildServiceSuv(0x1e293b, -11.5, 0.06, 8.2, 0);

  // --- 12. Tropical Palms & Instanced Ornamental Shrubs ---
  const palmCrowns: THREE.Group[] = [];
  const trunkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7c5c44,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  const frondMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2f7d32,
      roughness: 0.65,
      metalness: 0.05,
    }),
  );

  const addPalmTree = (x: number, y: number, z: number, height: number) => {
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.11, 0.2, height, 10)),
      trunkMat,
    );
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    palm.add(trunk);

    const crown = new THREE.Group();
    crown.position.y = height;
    const frondGeo = trackGeo(new THREE.ConeGeometry(0.45, 2.0, 5));
    frondGeo.scale(0.35, 1, 0.95);
    for (let i = 0; i < 6; i++) {
      const frond = new THREE.Mesh(frondGeo, frondMat);
      const ang = (i / 6) * Math.PI * 2;
      frond.rotation.y = ang;
      frond.rotation.z = Math.PI / 2.6;
      frond.position.set(Math.cos(ang) * 0.72, -0.1, Math.sin(ang) * 0.72);
      frond.castShadow = true;
      frond.receiveShadow = true;
      crown.add(frond);
    }
    palm.add(crown);
    palmCrowns.push(crown);

    const shadow = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(1.55, 16)),
      contactShadowMat,
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.025;
    palm.add(shadow);

    palm.position.set(x, y, z);
    root.add(palm);
  };

  addPalmTree(-9.8, 0.06, 15.2, 4.4);
  addPalmTree(-12.2, 0.06, 13.0, 3.8);
  addPalmTree(11.6, 0.06, 13.8, 4.2);

  // Instanced trimmed spherical shrubs (along ground-level lawn curve & borders only)
  const shrubCoords: Array<[number, number, number]> = [
    [-5.8, 0.45, 14.5],
    [-4.1, 0.45, 16.5],
    [-2.2, 0.45, 18.2],
    [0.0, 0.45, 19.0],
    [2.2, 0.45, 18.2],
    [4.1, 0.45, 16.5],
    [5.8, 0.45, 14.5],
    [-11.8, 0.45, 16.4],
    [-13.5, 0.45, 14.8],
    [-9.4, 0.45, 7.4],
    [-11.2, 0.45, 8.8],
    [11.4, 0.45, 8.2],
  ];

  const shrubGeo = trackGeo(new THREE.IcosahedronGeometry(0.46, 1));
  const shrubMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.02,
    }),
  );
  const shrubInstanced = new THREE.InstancedMesh(
    shrubGeo,
    shrubMat,
    shrubCoords.length,
  );
  shrubInstanced.castShadow = true;
  shrubInstanced.receiveShadow = true;

  const palette = [
    new THREE.Color(0x4d7c0f),
    new THREE.Color(0x65a30d),
    new THREE.Color(0x15803d),
    new THREE.Color(0xb45309),
  ];

  const shrubShadowGeo = trackGeo(new THREE.PlaneGeometry(1.35, 1.35));
  shrubCoords.forEach(([sx, sy, sz], i) => {
    const s = 0.85 + ((i * 17) % 30) * 0.01;
    dummy.position.set(sx, sy, sz);
    dummy.rotation.set(0, i * 0.7, 0);
    dummy.scale.set(s * 1.1, s * 0.88, s * 1.1);
    dummy.updateMatrix();
    shrubInstanced.setMatrixAt(i, dummy.matrix);
    shrubInstanced.setColorAt(i, palette[i % palette.length]);

    const sh = new THREE.Mesh(shrubShadowGeo, contactShadowMat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(sx, sy > 0.3 ? 0.22 : 0.07, sz);
    root.add(sh);
  });
  shrubInstanced.instanceMatrix.needsUpdate = true;
  if (shrubInstanced.instanceColor) shrubInstanced.instanceColor.needsUpdate = true;
  shrubInstanced.computeBoundingSphere();
  root.add(shrubInstanced);

  // --- 13. Architectural & Courtyard Lamp Fixtures & Night Point Lights ---
  const lampGroup = new THREE.Group();
  const lampPostGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.08, 2.35, 10));
  const lampHeadGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.14, 0.28, 12));
  const lampCapGeo = trackGeo(new THREE.ConeGeometry(0.28, 0.14, 12));
  const lampPoolGeo = trackGeo(new THREE.PlaneGeometry(4.8, 4.8));

  // 6 Courtyard & Driveway Street/Garden Lamps
  const gardenLampCoords: Array<[number, number]> = [
    [-9.4, 14.0],
    [9.4, 14.0],
    [-4.8, 13.0],
    [4.8, 13.0],
    [-11.8, 6.8],
    [11.8, 6.8],
  ];

  gardenLampCoords.forEach(([lx, lz]) => {
    const post = new THREE.Mesh(lampPostGeo, darkMetalMat);
    post.position.set(lx, 1.22, lz);
    post.castShadow = true;
    lampGroup.add(post);

    const bulb = new THREE.Mesh(lampHeadGeo, lampBulbMat);
    bulb.position.set(lx, 2.48, lz);
    lampGroup.add(bulb);

    const cap = new THREE.Mesh(lampCapGeo, darkMetalMat);
    cap.position.set(lx, 2.68, lz);
    cap.castShadow = true;
    lampGroup.add(cap);

    const pool = new THREE.Mesh(lampPoolGeo, lampPoolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(lx, 0.072, lz);
    lampGroup.add(pool);
  });

  // 4 Porte-Cochère Canopy Recessed Downlights + 4 Column Uplights
  const downlightGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 14));
  [-7.2, -2.4, 2.4, 7.2].forEach((dx) => {
    const dl = new THREE.Mesh(downlightGeo, lampBulbMat);
    dl.position.set(dx, 3.92, 8.8);
    lampGroup.add(dl);

    const pool = new THREE.Mesh(lampPoolGeo, lampPoolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(dx, 0.072, 8.8);
    lampGroup.add(pool);
  });

  const uplightGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.14, 0.26));
  [-9.8, -3.55, 3.55, 9.8].forEach((ux) => {
    const ul = new THREE.Mesh(uplightGeo, lampBulbMat);
    ul.position.set(ux, 0.3, 10.35);
    lampGroup.add(ul);
  });

  // 3 Podium Parapet Facade Floodlights + Flagpole Uplight
  [-5.05, 0, 5.05].forEach((fx) => {
    const fl = new THREE.Mesh(uplightGeo, lampBulbMat);
    fl.position.set(fx, 4.56, 4.95);
    lampGroup.add(fl);
  });
  const flagUplight = new THREE.Mesh(uplightGeo, lampBulbMat);
  flagUplight.position.set(0, 0.28, 15.22);
  lampGroup.add(flagUplight);

  // 3 Broad-Range Architectural PointLights (Optimized from 8 to reduce shader iterations while preserving visual warmth)
  const pointLightConfigs: Array<{
    pos: [number, number, number];
    color: number;
    distance: number;
  }> = [
    { pos: [0, 6.2, 7.5], color: 0xffcc80, distance: 26 }, // Main Building Facade, Porte-cochère Canopy & Upper Crown
    { pos: [0, 3.0, 18.2], color: 0xffdf8e, distance: 24 }, // Front Plaza, Flagpole & Front Perimeter Fence Monument Sign
    { pos: [-9.5, 3.4, 15.5], color: 0xffb74d, distance: 24 }, // Gate Masuk/Keluar, Pos Security & Driveway
  ];

  pointLightConfigs.forEach(({ pos, color, distance }) => {
    const pl = new THREE.PointLight(color, 0, distance, 1.5);
    pl.position.set(...pos);
    lampGroup.add(pl);
    spotLights.push(pl);
  });

  root.add(lampGroup);

  // --- 14. Full 360° Perimeter Fence (Front Grille Concept + Side/Back Solid Unified Wall), Front BPS Monument Sign, Sliding Gates & Pos Security ---
  const fenceGroup = new THREE.Group();

  const fenceStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2b313a,
      bumpMap: textures.stuccoBump,
      bumpScale: 0.025,
      roughness: 0.72,
      metalness: 0.08,
    }),
  );
  const fenceBaseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x22272e,
      roughness: 0.82,
      metalness: 0.05,
    }),
  );
  const ironGrilleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x14171c,
      roughness: 0.4,
      metalness: 0.78,
    }),
  );
  const gateTrackMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.82,
    }),
  );
  const fenceSignMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.fenceSignMap,
      roughness: 0.32,
      metalness: 0.2,
    }),
  );
  const securitySignMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.securitySignMap,
      roughness: 0.35,
      metalness: 0.15,
    }),
  );
  const hedgeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3f7d20,
      bumpMap: textures.stuccoBump,
      bumpScale: 0.04,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );
  const asphaltDriveMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.asphaltMap,
      roughness: 0.88,
      metalness: 0.04,
    }),
  );

  const fenceFrontZ = 21.8;
  const fenceBackZ = -12.6;
  const fenceSideX = 18.2;

  // Helper: Build signature dark-stone front fence pillar with vertical white rectangular frame relief (from image_8713374b.png)
  const pillarBodyGeo = trackGeo(new THREE.BoxGeometry(0.92, 1.96, 0.48));
  const pillarCapGeo = trackGeo(new THREE.BoxGeometry(1.04, 0.1, 0.58));
  const pillarWhiteFrameGeo = trackGeo(new THREE.BoxGeometry(0.52, 1.12, 0.54));
  const pillarInnerRecessGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.86, 0.58));
  const pillarShadowGeo = trackGeo(new THREE.PlaneGeometry(1.55, 1.15));

  const addFencePillar = (
    x: number,
    z: number,
    rotY = 0,
    withTopLamp = false,
  ) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, 0.06, z);
    pGroup.rotation.y = rotY;

    const body = new THREE.Mesh(pillarBodyGeo, fenceStoneMat);
    body.position.y = 0.98;
    body.castShadow = true;
    body.receiveShadow = true;
    pGroup.add(body);

    const cap = new THREE.Mesh(pillarCapGeo, whiteStuccoMat);
    cap.position.y = 2.01;
    cap.castShadow = true;
    cap.receiveShadow = true;
    pGroup.add(cap);

    // Signature vertical white rectangular frame relief on both faces
    const whiteFrame = new THREE.Mesh(pillarWhiteFrameGeo, whiteStuccoMat);
    whiteFrame.position.y = 1.04;
    whiteFrame.castShadow = true;
    pGroup.add(whiteFrame);

    const innerRecess = new THREE.Mesh(pillarInnerRecessGeo, fenceStoneMat);
    innerRecess.position.y = 1.04;
    pGroup.add(innerRecess);

    const pShadow = new THREE.Mesh(pillarShadowGeo, contactShadowMat);
    pShadow.rotation.x = -Math.PI / 2;
    pShadow.position.y = 0.01;
    pGroup.add(pShadow);

    if (withTopLamp) {
      const lampBase = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.28, 0.08, 0.28)),
        darkMetalMat,
      );
      lampBase.position.y = 2.1;
      pGroup.add(lampBase);

      const lantern = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.16, 12, 12)),
        lampBulbMat,
      );
      lantern.position.y = 2.24;
      pGroup.add(lantern);

      const pool = new THREE.Mesh(lampPoolGeo, lampPoolMat);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(0, 0.015, 0.4);
      pGroup.add(pool);
    }

    fenceGroup.add(pGroup);
  };

  // Helper: Build secondary white rectangular portal frame accent (seen flanking front grilles in image_8713374b.png)
  const portalOuterGeo = trackGeo(new THREE.BoxGeometry(0.76, 1.76, 0.36));
  const portalInnerGeo = trackGeo(new THREE.BoxGeometry(0.46, 1.46, 0.4));
  const addWhitePortalAccent = (x: number, z: number, rotY = 0) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(x, 0.06, z);
    wGroup.rotation.y = rotY;

    const outer = new THREE.Mesh(portalOuterGeo, whiteStuccoMat);
    outer.position.y = 0.88;
    outer.castShadow = true;
    outer.receiveShadow = true;
    wGroup.add(outer);

    const inner = new THREE.Mesh(portalInnerGeo, fenceStoneMat);
    inner.position.y = 0.84;
    wGroup.add(inner);

    fenceGroup.add(wGroup);
  };

  // Helper: Build a front fence span (continuous dark lower plinth wall + white cap + black vertical iron grille bars)
  const barThickness = 0.035;
  const barTransforms: THREE.Matrix4[] = [];
  const barDummy = new THREE.Object3D();

  const addFenceSpan = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    includeWhitePortal = false,
  ) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const totalLen = Math.hypot(dx, dz);
    if (totalLen < 0.4) return;
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;

    const spanGroup = new THREE.Group();
    spanGroup.position.set(midX, 0.06, midZ);
    spanGroup.rotation.y = -Math.atan2(dz, dx);

    // 1. Continuous dark-charcoal lower masonry plinth wall (height 0.48m)
    const baseWall = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(totalLen, 0.48, 0.34)),
      fenceBaseMat,
    );
    baseWall.position.y = 0.24;
    baseWall.castShadow = true;
    baseWall.receiveShadow = true;
    spanGroup.add(baseWall);

    // Crisp white horizontal cap ledge on top of lower base wall
    const baseCap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(totalLen, 0.07, 0.38)),
      whiteStuccoMat,
    );
    baseCap.position.y = 0.515;
    baseCap.castShadow = true;
    baseCap.receiveShadow = true;
    spanGroup.add(baseCap);

    // Optional secondary white rectangular portal accent on one side of the front bay (matching photo rhythm)
    let grilleWidth = totalLen - 0.85;
    let grilleOffsetX = 0;
    if (includeWhitePortal && totalLen > 2.4) {
      addWhitePortalAccent(
        x1 + (dx / totalLen) * 0.9,
        z1 + (dz / totalLen) * 0.9,
        -Math.atan2(dz, dx),
      );
      grilleWidth = totalLen - 1.55;
      grilleOffsetX = 0.38;
    }

    if (grilleWidth > 0.35) {
      // Top & bottom horizontal iron rails
      const railGeo = trackGeo(
        new THREE.BoxGeometry(grilleWidth, 0.045, 0.055),
      );
      const topRail = new THREE.Mesh(railGeo, ironGrilleMat);
      topRail.position.set(grilleOffsetX, 1.72, 0);
      topRail.castShadow = true;
      spanGroup.add(topRail);

      const botRail = new THREE.Mesh(railGeo, ironGrilleMat);
      botRail.position.set(grilleOffsetX, 0.64, 0);
      spanGroup.add(botRail);

      // Vertical black wrought-iron bars (front fence only) - collected for InstancedMesh (1 Draw Call)
      const barSpacing = 0.16;
      const barCount = Math.max(2, Math.floor(grilleWidth / barSpacing));
      const startBarX =
        grilleOffsetX - ((barCount - 1) * barSpacing) / 2;
      const rotY = -Math.atan2(dz, dx);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      for (let b = 0; b < barCount; b++) {
        const lx = startBarX + b * barSpacing;
        const ly = 1.18;
        const lz = 0;
        const wx = midX + (lx * cosY + lz * sinY);
        const wy = 0.06 + ly;
        const wz = midZ + (-lx * sinY + lz * cosY);

        barDummy.position.set(wx, wy, wz);
        barDummy.rotation.set(0, rotY, 0);
        barDummy.scale.set(barThickness, 1.16, barThickness);
        barDummy.updateMatrix();
        barTransforms.push(barDummy.matrix.clone());
      }
    }

    // Contact shadow along fence base
    const spanShadow = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(totalLen, 0.95)),
      contactShadowMat,
    );
    spanShadow.rotation.x = -Math.PI / 2;
    spanShadow.position.y = 0.01;
    spanGroup.add(spanShadow);

    fenceGroup.add(spanGroup);
  };

  // --- A. FRONT CENTRAL BPS PROVINSI GORONTALO MONUMENT SIGN WALL (x = -2.8 .. +2.8, z = 21.8) ---
  const monumentGroup = new THREE.Group();
  monumentGroup.position.set(0, 0.06, fenceFrontZ);

  // Dark base plinth under central monument wall
  const monBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.6, 0.5, 0.48)),
    fenceBaseMat,
  );
  monBase.position.y = 0.25;
  monBase.castShadow = true;
  monBase.receiveShadow = true;
  monumentGroup.add(monBase);

  const monBaseCap = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.72, 0.08, 0.54)),
    whiteStuccoMat,
  );
  monBaseCap.position.y = 0.54;
  monumentGroup.add(monBaseCap);

  // White outer architectural frame around the dark granite sign wall
  const monWhiteFrame = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.56, 1.38, 0.42)),
    whiteStuccoMat,
  );
  monWhiteFrame.position.y = 1.24;
  monWhiteFrame.castShadow = true;
  monWhiteFrame.receiveShadow = true;
  monumentGroup.add(monWhiteFrame);

  // Dark granite monument core block
  const monCore = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.28, 1.22, 0.46)),
    fenceStoneMat,
  );
  monCore.position.y = 1.22;
  monCore.castShadow = true;
  monCore.receiveShadow = true;
  monumentGroup.add(monCore);

  // High-resolution front nameplate plaque with official BPS Logo + BADAN PUSAT STATISTIK PROVINSI GORONTALO
  const monPlaque = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(5.18, 1.16)),
    fenceSignMat,
  );
  monPlaque.position.set(0, 1.22, 0.24);
  monumentGroup.add(monPlaque);

  // Manicured green boxwood hedge planter right in front of the monument sign wall (as seen in image_8713374b.png)
  const hedgeCurb = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.9, 0.22, 0.72)),
    fenceBaseMat,
  );
  hedgeCurb.position.set(0, 0.11, 0.52);
  hedgeCurb.castShadow = true;
  hedgeCurb.receiveShadow = true;
  monumentGroup.add(hedgeCurb);

  const hedgeBox = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.65, 0.48, 0.56)),
    hedgeMat,
  );
  hedgeBox.position.set(0, 0.38, 0.52);
  hedgeBox.castShadow = true;
  hedgeBox.receiveShadow = true;
  monumentGroup.add(hedgeBox);

  // Warm night uplight illuminating the front fence BPS monument sign
  const fenceSignUplight = new THREE.Mesh(uplightGeo, lampBulbMat);
  fenceSignUplight.position.set(0, 0.64, 0.56);
  monumentGroup.add(fenceSignUplight);

  const monShadow = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(6.2, 1.8)),
    contactShadowMat,
  );
  monShadow.rotation.x = -Math.PI / 2;
  monShadow.position.set(0, 0.01, 0.25);
  monumentGroup.add(monShadow);

  fenceGroup.add(monumentGroup);

  // --- B. FRONT FENCE PILLARS & BAYS (Left & Right of Monument Sign, plus Outer Front Corners) ---
  // Left of monument sign: pillars at x = -2.95, -6.15, -9.35 (Gate Masuk Inner/Right Pillar)
  addFencePillar(-2.95, fenceFrontZ, 0, false);
  addFenceSpan(-6.15, fenceFrontZ, -2.95, fenceFrontZ, true);
  addFencePillar(-6.15, fenceFrontZ, 0, false);
  addFenceSpan(-9.35, fenceFrontZ, -6.15, fenceFrontZ, true);
  addFencePillar(-9.35, fenceFrontZ, 0, true); // Gate Masuk right pillar

  // Gate Masuk opening is x = -13.85 .. -9.35 (width 4.5m)
  addFencePillar(-13.85, fenceFrontZ, 0, true); // Gate Masuk left pillar
  addFenceSpan(-fenceSideX, fenceFrontZ, -13.85, fenceFrontZ, true);
  addFencePillar(-fenceSideX, fenceFrontZ, 0, false); // Front-left corner pillar

  // Right of monument sign: pillars at x = +2.95, +6.15, +9.35 (Gate Keluar Inner/Left Pillar)
  addFencePillar(2.95, fenceFrontZ, 0, false);
  addFenceSpan(2.95, fenceFrontZ, 6.15, fenceFrontZ, true);
  addFencePillar(6.15, fenceFrontZ, 0, false);
  addFenceSpan(6.15, fenceFrontZ, 9.35, fenceFrontZ, true);
  addFencePillar(9.35, fenceFrontZ, 0, true); // Gate Keluar left pillar

  // Gate Keluar opening is x = +9.35 .. +13.85 (width 4.5m)
  addFencePillar(13.85, fenceFrontZ, 0, true); // Gate Keluar right pillar
  addFenceSpan(13.85, fenceFrontZ, fenceSideX, fenceFrontZ, true);
  addFencePillar(fenceSideX, fenceFrontZ, 0, false); // Front-right corner pillar

  // --- C. SINGLE SLIDING GATE (SATU PINTU DIGESER) FOR GERBANG MASUK (LEFT) & GERBANG KELUAR (RIGHT) ---
  const wheelRollerGeo = trackGeo(
    new THREE.CylinderGeometry(0.065, 0.065, 0.055, 14),
  );
  wheelRollerGeo.rotateX(Math.PI / 2);

  const buildSingleSlidingGate = (
    centerX: number,
    slideDir: -1 | 1,
  ) => {
    const gateSub = new THREE.Group();
    gateSub.position.set(centerX, 0.06, fenceFrontZ);

    // Asphalt driveway apron passing through the gate opening
    const apron = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(4.2, 0.03, 3.6)),
      asphaltDriveMat,
    );
    apron.position.set(0, 0.01, 0.1);
    apron.receiveShadow = true;
    gateSub.add(apron);

    // Continuous steel floor sliding rail (rel pagar geser) behind the front fence line (z = -0.34)
    const trackLen = 8.4;
    const trackOffsetX = slideDir * 1.85;
    const groundRail = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(trackLen, 0.035, 0.11)),
      gateTrackMat,
    );
    groundRail.position.set(trackOffsetX, 0.025, -0.34);
    groundRail.receiveShadow = true;
    gateSub.add(groundRail);

    // Single one-piece sliding gate leaf (satu pintu geser, width 4.65m, height 1.56m)
    // Slid open horizontally along the rail by 2.65m in slideDir so vehicles can pass while the single panel & rollers are clearly visible
    const gateW = 4.65;
    const gateH = 1.56;
    const slidCenterX = slideDir * 2.65;

    const slidingLeaf = new THREE.Group();
    slidingLeaf.position.set(slidCenterX, 0, -0.34);

    // Top horizontal outer frame beam
    const topBeam = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(gateW, 0.065, 0.065)),
      ironGrilleMat,
    );
    topBeam.position.set(0, 0.14 + gateH, 0);
    topBeam.castShadow = true;
    slidingLeaf.add(topBeam);

    // Bottom heavy wheel-carrier horizontal rail beam
    const botBeam = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(gateW, 0.09, 0.075)),
      ironGrilleMat,
    );
    botBeam.position.set(0, 0.16, 0);
    botBeam.castShadow = true;
    slidingLeaf.add(botBeam);

    // Middle horizontal reinforcement bar
    const midBeam = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(gateW, 0.045, 0.055)),
      ironGrilleMat,
    );
    midBeam.position.set(0, 0.62, 0);
    midBeam.castShadow = true;
    slidingLeaf.add(midBeam);

    // Left, center, and right vertical structural frame stiles
    const stileGeo = trackGeo(new THREE.BoxGeometry(0.065, gateH, 0.065));
    [-gateW / 2, 0, gateW / 2].forEach((sx) => {
      const stile = new THREE.Mesh(stileGeo, ironGrilleMat);
      stile.position.set(sx, 0.14 + gateH / 2, 0);
      stile.castShadow = true;
      slidingLeaf.add(stile);
    });

    // Vertical black wrought-iron bars across the single sliding gate panel - collected for InstancedMesh (1 Draw Call)
    const numBars = 28;
    for (let i = 1; i < numBars; i++) {
      if (i === numBars / 2) continue; // center stile already placed
      const bx = -gateW / 2 + (i / numBars) * gateW;
      barDummy.position.set(
        centerX + slidCenterX + bx,
        0.06 + 0.14 + gateH / 2,
        fenceFrontZ - 0.34,
      );
      barDummy.rotation.set(0, 0, 0);
      barDummy.scale.set(0.032, gateH - 0.04, 0.032);
      barDummy.updateMatrix();
      barTransforms.push(barDummy.matrix.clone());
    }

    // 4 bottom steel sliding wheels riding on the floor rail
    [-gateW * 0.42, -gateW * 0.14, gateW * 0.14, gateW * 0.42].forEach(
      (wx) => {
        const wheel = new THREE.Mesh(wheelRollerGeo, gateTrackMat);
        wheel.position.set(wx, 0.08, 0);
        wheel.castShadow = true;
        slidingLeaf.add(wheel);
      },
    );

    gateSub.add(slidingLeaf);

    // Upper guide roller bracket attached to the back of the slide-side gate pillar
    const guideBracket = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.18, 0.12, 0.24)),
      ironGrilleMat,
    );
    guideBracket.position.set(slideDir * 2.18, 1.68, -0.24);
    gateSub.add(guideBracket);

    fenceGroup.add(gateSub);
  };

  // Left = Gerbang Masuk (-11.6, slides left toward Pos Security), Right = Gerbang Keluar (+11.6, slides right)
  buildSingleSlidingGate(-11.6, -1);
  buildSingleSlidingGate(11.6, 1);

  // Combine all vertical iron bars from fence spans and sliding gates into 1 InstancedMesh (1 Draw Call)
  if (barTransforms.length > 0) {
    const vBarInstancedGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
    const vBarInstancedMesh = new THREE.InstancedMesh(
      vBarInstancedGeo,
      ironGrilleMat,
      barTransforms.length,
    );
    vBarInstancedMesh.castShadow = true;
    vBarInstancedMesh.receiveShadow = true;
    for (let i = 0; i < barTransforms.length; i++) {
      vBarInstancedMesh.setMatrixAt(i, barTransforms[i]);
    }
    vBarInstancedMesh.instanceMatrix.needsUpdate = true;
    fenceGroup.add(vBarInstancedMesh);
  }

  // --- D. POS SECURITY (GUARDHOUSE) ON THE LEFT SIDE OF GERBANG MASUK ---
  const securityGroup = new THREE.Group();
  // Positioned on the LEFT side of Gerbang Masuk (x = -15.85, z = 18.9), facing the entrance driveway (+X) and front gate (+Z)
  securityGroup.position.set(-15.85, 0.06, 18.9);

  // Contact shadow beneath Pos Security
  const secShadow = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(3.6, 3.4)),
    contactShadowMat,
  );
  secShadow.rotation.x = -Math.PI / 2;
  secShadow.position.y = 0.015;
  securityGroup.add(secShadow);

  // Dark stone base plinth
  const secPlinth = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.55, 0.24, 2.35)),
    fenceBaseMat,
  );
  secPlinth.position.y = 0.12;
  secPlinth.castShadow = true;
  secPlinth.receiveShadow = true;
  securityGroup.add(secPlinth);

  // White stucco main guardhouse cabin walls
  const secCabin = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.35, 2.15, 2.15)),
    whiteStuccoMat,
  );
  secCabin.position.y = 1.31;
  secCabin.castShadow = true;
  secCabin.receiveShadow = true;
  securityGroup.add(secCabin);

  // Wrap-around dark glass observation windows facing the entrance gate (+Z) and incoming driveway on its right (+X)
  const secSideGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.41, 1.12, 1.75)),
    darkGlassMat,
  );
  secSideGlass.position.set(0.03, 1.42, 0.1);
  securityGroup.add(secSideGlass);

  const secFrontGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.95, 1.12, 2.21)),
    darkGlassMat,
  );
  secFrontGlass.position.set(0.1, 1.42, 0.03);
  securityGroup.add(secFrontGlass);

  // Warm interior guard desk glow inside Pos Security
  const secInteriorGlow = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.65, 0.9, 1.45)),
    lobbyWarmGlowMat,
  );
  secInteriorGlow.position.set(0.08, 1.32, 0.05);
  securityGroup.add(secInteriorGlow);

  // Slate-blue upper fascia crown matching the main BPS building
  const secFascia = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.75, 0.38, 2.55)),
    claddingMat,
  );
  secFascia.position.y = 2.55;
  secFascia.castShadow = true;
  secFascia.receiveShadow = true;
  securityGroup.add(secFascia);

  // Overhanging white flat roof cap
  const secRoofCap = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.95, 0.12, 2.75)),
    whiteStuccoMat,
  );
  secRoofCap.position.y = 2.8;
  secRoofCap.castShadow = true;
  secRoofCap.receiveShadow = true;
  securityGroup.add(secRoofCap);

  // "POS SECURITY — GERBANG MASUK UTAMA" plaque on front (+Z) & driveway (+X, right face) sides
  const secSignFront = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.65, 0.34)),
    securitySignMat,
  );
  secSignFront.position.set(0, 2.55, 1.29);
  securityGroup.add(secSignFront);

  const secSignDriveway = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.55, 0.34)),
    securitySignMat,
  );
  secSignDriveway.rotation.y = Math.PI / 2;
  secSignDriveway.position.set(1.39, 2.55, 0);
  securityGroup.add(secSignDriveway);

  fenceGroup.add(securityGroup);

  // --- E. LEFT, RIGHT & BACK UNIFIED SOLID PERIMETER WALLS (Tembok Menyatu Tanpa Besi Garis-Garis) ---
  const addUnifiedPerimeterWall = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
  ) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const totalLen = Math.hypot(dx, dz);
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;

    const wallGroup = new THREE.Group();
    wallGroup.position.set(midX, 0.06, midZ);
    wallGroup.rotation.y = -Math.atan2(dz, dx);

    // 1. Continuous dark lower masonry plinth base (height 0.48m)
    const lowerBase = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(totalLen + 0.36, 0.48, 0.38)),
      fenceBaseMat,
    );
    lowerBase.position.y = 0.24;
    lowerBase.castShadow = true;
    lowerBase.receiveShadow = true;
    wallGroup.add(lowerBase);

    // Lower white horizontal trim line
    const lowerTrim = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(totalLen + 0.4, 0.07, 0.42)),
      whiteStuccoMat,
    );
    lowerTrim.position.y = 0.515;
    lowerTrim.castShadow = true;
    lowerTrim.receiveShadow = true;
    wallGroup.add(lowerTrim);

    // 2. Continuous solid masonry wall body (tembok menyatu, replacing all iron grille bars on sides & back)
    const solidWallBody = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(totalLen + 0.34, 1.38, 0.34)),
      fenceStoneMat,
    );
    solidWallBody.position.y = 1.24;
    solidWallBody.castShadow = true;
    solidWallBody.receiveShadow = true;
    wallGroup.add(solidWallBody);

    // 3. Continuous crisp white top coping cap along the unified wall
    const topCap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(totalLen + 0.44, 0.09, 0.44)),
      whiteStuccoMat,
    );
    topCap.position.y = 1.975;
    topCap.castShadow = true;
    topCap.receiveShadow = true;
    wallGroup.add(topCap);

    // Contact shadow along the solid perimeter wall
    const wallShadow = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(totalLen + 0.5, 0.95)),
      contactShadowMat,
    );
    wallShadow.rotation.x = -Math.PI / 2;
    wallShadow.position.y = 0.01;
    wallGroup.add(wallShadow);

    fenceGroup.add(wallGroup);
  };

  // Left continuous solid wall (x = -18.2, from front-left corner z = +21.8 to back-left corner z = -12.6)
  addUnifiedPerimeterWall(-fenceSideX, fenceFrontZ, -fenceSideX, fenceBackZ);
  // Right continuous solid wall (x = +18.2, from front-right corner z = +21.8 to back-right corner z = -12.6)
  addUnifiedPerimeterWall(fenceSideX, fenceFrontZ, fenceSideX, fenceBackZ);
  // Back continuous solid wall (z = -12.6, from back-left corner x = -18.2 to back-right corner x = +18.2)
  addUnifiedPerimeterWall(-fenceSideX, fenceBackZ, fenceSideX, fenceBackZ);

  root.add(fenceGroup);

  // --- 14. Invisible 3D Raycast Hit Proxies for POIs (No floating orb/ring meshes) ---
  const hitProxyGeo = trackGeo(new THREE.SphereGeometry(1.05, 12, 12));
  const hitProxyMat = trackMat(
    new THREE.MeshBasicMaterial({ visible: false }),
  );

  POI_AREAS.forEach((poi) => {
    const markerGroup = new THREE.Group();
    markerGroup.position.set(...poi.hotspotPosition);

    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitProxy.userData.poiId = poi.id;
    hitProxy.layers.set(1);
    markerGroup.add(hitProxy);
    interactables.push(hitProxy);

    root.add(markerGroup);
  });

  // --- Freeze Transformation Matrices of Static Objects (matrixAutoUpdate = false) ---
  const dynamicObjects = new Set<THREE.Object3D>();
  cruisingBlackCar.traverse((obj) => dynamicObjects.add(obj));
  palmCrowns.forEach((crown) => {
    crown.traverse((obj) => dynamicObjects.add(obj));
  });

  root.updateMatrixWorld(true);

  root.traverse((obj) => {
    if (!dynamicObjects.has(obj)) {
      obj.matrixAutoUpdate = false;
    }
  });

  // --- Per-Frame Smooth Animation Updater (Zero GC Allocation) ---
  const updateAnimations = (elapsed: number, _activePoiId: string | null) => {
    // 1. Waving Indonesian Flag (cloth sine wave pinned at x = -1.15)
    const posAttr = flagGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const bx = flagBasePositions[i * 3];
      const by = flagBasePositions[i * 3 + 1];
      const normalizedX = (bx + 1.15) / 2.3; // 0 at pole, 1 at trailing edge
      const wave =
        Math.sin(normalizedX * 4.5 - elapsed * 3.6) * 0.14 * normalizedX +
        Math.cos(by * 2.2 - elapsed * 2.4) * 0.04 * normalizedX;
      posAttr.setZ(i, wave);
    }
    posAttr.needsUpdate = true;

    // 2. Gentle Tropical Palm Breeze Sway
    for (let i = 0; i < palmCrowns.length; i++) {
      const crown = palmCrowns[i];
      crown.rotation.z = Math.sin(elapsed * 1.1 + i * 1.4) * 0.035;
      crown.rotation.x = Math.cos(elapsed * 0.85 + i * 0.9) * 0.025;
    }

    // 3. Black SUV Repeated Forward Drive starting further back (-11.5 to +5.2 at z = 8.2)
    const loopT = (elapsed * 0.115) % 1;
    const carX = -11.5 + loopT * 16.7;
    cruisingBlackCar.position.set(
      carX,
      0.06 + Math.sin(elapsed * 9.0) * 0.008,
      8.2,
    );
    cruisingBlackCar.rotation.y = 0;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    root,
    interactables,
    hotspotRings,
    hotspotCores,
    interiorGlowMaterials,
    lampPoolMaterials,
    spotLights,
    updateAnimations,
    dispose,
  };
}
