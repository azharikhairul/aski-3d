import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  type CameraView,
  HERO_CAMERA_VIEW,
  LIGHTING_PRESETS,
  type LightingPresetId,
  POI_AREAS,
} from '../data/poiData';
import { buildBpsGorontaloCampus } from './bpsBuilding';
import { createProceduralTexturePack } from './proceduralTextures';

export interface BpsSceneCanvasHandle {
  captureSnapshot: () => string | null;
  flyToView: (view: CameraView) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  resetView: () => void;
}

interface BpsSceneCanvasProps {
  cameraView: CameraView;
  lightingPreset: LightingPresetId;
  activePoiId: string | null;
  showHotspots: boolean;
  onSelectPoi: (poiId: string) => void;
  onUserOrbitStart?: () => void;
}

// Pre-allocated scratch math objects (zero GC in render loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _targetSkyColor = new THREE.Color();
const _targetSunColor = new THREE.Color();
const _targetHemiSky = new THREE.Color();
const _targetHemiGround = new THREE.Color();
const _targetSunPos = new THREE.Vector3();
const _panForward = new THREE.Vector3();
const _panRight = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function adaptViewForViewport(
  view: CameraView,
  width: number,
  height: number,
): CameraView {
  const aspect = width / Math.max(height, 1);
  if (width >= 768 && aspect >= 0.9) {
    return view;
  }
  // Portrait mobile/tablet adaptation
  // 1. Hero split-screen view (target[0] < -2 on desktop): center building in upper half of mobile viewport
  if (view.target[0] < -2) {
    return {
      position: [19.5, 15.2, 50.0],
      target: [0, 1.2, 2.0],
    };
  }
  // 2. Explore / Tour / Preset views: scale camera distance so full facade fits narrow horizontal FOV
  const scale = Math.min(1.62, Math.max(1.15, 0.92 / Math.max(aspect, 0.42)));
  const dx = view.position[0] - view.target[0];
  const dy = view.position[1] - view.target[1];
  const dz = view.position[2] - view.target[2];
  return {
    position: [
      view.target[0] * 0.5 + dx * scale,
      view.target[1] + dy * Math.min(scale, 1.35),
      view.target[2] + dz * scale,
    ],
    target: [view.target[0] * 0.5, view.target[1] - 0.9, view.target[2]],
  };
}

export const BpsSceneCanvas = forwardRef<
  BpsSceneCanvasHandle,
  BpsSceneCanvasProps
>(function BpsSceneCanvas(
  {
    cameraView,
    lightingPreset,
    activePoiId,
    showHotspots,
    onSelectPoi,
    onUserOrbitStart,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [contextLost, setContextLost] = useState(false);

  // Mutable refs so React prop updates never tear down WebGLRenderer
  const activePoiRef = useRef<string | null>(activePoiId);
  const lightingIdRef = useRef<LightingPresetId>(lightingPreset);
  const showHotspotsRef = useRef<boolean>(showHotspots);
  const onSelectPoiRef = useRef(onSelectPoi);
  const onUserOrbitStartRef = useRef(onUserOrbitStart);
  const rawViewRef = useRef<CameraView>(cameraView);

  activePoiRef.current = activePoiId;
  lightingIdRef.current = lightingPreset;
  showHotspotsRef.current = showHotspots;
  onSelectPoiRef.current = onSelectPoi;
  onUserOrbitStartRef.current = onUserOrbitStart;
  rawViewRef.current = cameraView;

  const initW = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const initH = typeof window !== 'undefined' ? window.innerHeight : 900;
  const viewportRef = useRef({ width: initW, height: initH });
  const initialAdapted = adaptViewForViewport(cameraView, initW, initH);

  const transitionRef = useRef<{
    active: boolean;
    camPos: THREE.Vector3;
    lookAt: THREE.Vector3;
  }>({
    active: false,
    camPos: new THREE.Vector3(...initialAdapted.position),
    lookAt: new THREE.Vector3(...initialAdapted.target),
  });

  const sceneApiRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
  } | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      captureSnapshot: () => {
        const api = sceneApiRef.current;
        if (!api) return null;
        // Ensure shadow map is up to date and render fresh frame immediately before extracting DataURL
        api.renderer.shadowMap.needsUpdate = true;
        api.renderer.render(api.scene, api.camera);
        try {
          return api.renderer.domElement.toDataURL('image/jpeg', 0.88);
        } catch {
          return null;
        }
      },
      flyToView: (view: CameraView) => {
        rawViewRef.current = view;
        const { width: w, height: h } = viewportRef.current;
        const adapted = adaptViewForViewport(view, w, h);
        transitionRef.current.camPos.set(...adapted.position);
        transitionRef.current.lookAt.set(...adapted.target);
        transitionRef.current.active = true;
      },
      zoomIn: () => {
        const controls = controlsRef.current;
        const api = sceneApiRef.current;
        if (!controls || !api) return;
        transitionRef.current.active = false;
        const offset = new THREE.Vector3().subVectors(api.camera.position, controls.target);
        if (offset.length() > controls.minDistance + 1) {
          offset.multiplyScalar(0.82);
          api.camera.position.addVectors(controls.target, offset);
          controls.update();
        }
      },
      zoomOut: () => {
        const controls = controlsRef.current;
        const api = sceneApiRef.current;
        if (!controls || !api) return;
        transitionRef.current.active = false;
        const offset = new THREE.Vector3().subVectors(api.camera.position, controls.target);
        if (offset.length() < controls.maxDistance - 1) {
          offset.multiplyScalar(1.22);
          api.camera.position.addVectors(controls.target, offset);
          controls.update();
        }
      },
      rotateLeft: () => {
        const controls = controlsRef.current;
        const api = sceneApiRef.current;
        if (!controls || !api) return;
        transitionRef.current.active = false;
        const offset = new THREE.Vector3().subVectors(api.camera.position, controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-15));
        api.camera.position.addVectors(controls.target, offset);
        controls.update();
      },
      rotateRight: () => {
        const controls = controlsRef.current;
        const api = sceneApiRef.current;
        if (!controls || !api) return;
        transitionRef.current.active = false;
        const offset = new THREE.Vector3().subVectors(api.camera.position, controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(15));
        api.camera.position.addVectors(controls.target, offset);
        controls.update();
      },
      resetView: () => {
        rawViewRef.current = HERO_CAMERA_VIEW;
        const { width: w, height: h } = viewportRef.current;
        const adapted = adaptViewForViewport(HERO_CAMERA_VIEW, w, h);
        transitionRef.current.camPos.set(...adapted.position);
        transitionRef.current.lookAt.set(...adapted.target);
        transitionRef.current.active = true;
      },
    }),
    [],
  );

  // Sync cameraView prop changes to smooth camera glide
  useEffect(() => {
    rawViewRef.current = cameraView;
    const { width: w, height: h } = viewportRef.current;
    const adapted = adaptViewForViewport(cameraView, w, h);
    transitionRef.current.camPos.set(...adapted.position);
    transitionRef.current.lookAt.set(...adapted.target);
    transitionRef.current.active = true;
  }, [cameraView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    viewportRef.current = { width, height };

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const initLight = LIGHTING_PRESETS[lightingIdRef.current];
    renderer.toneMappingExposure = initLight.exposure;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = isSoftwareGl
      ? THREE.PCFShadowMap
      : THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('data-testid', 'bps-3d-canvas');

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initLight.skyColor);
    scene.fog = new THREE.FogExp2(initLight.fogColor, 0.0082);

    // Mandatory studio environment reflection map on every device
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = initLight.envIntensity;
    pmremGenerator.dispose();

    const startView = adaptViewForViewport(rawViewRef.current, width, height);
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.25, 220);
    camera.position.set(...startView.position);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...startView.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 9.5;
    controls.maxDistance = 78;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI * 0.475;
    controls.panSpeed = 0.8;
    controls.rotateSpeed = 0.75;
    controls.update();
    controlsRef.current = controls;

    const onControlStart = () => {
      transitionRef.current.active = false;
      onUserOrbitStartRef.current?.();
    };
    controls.addEventListener('start', onControlStart);

    // 3-Point Warm/Cool Studio Architectural Lighting
    const hemiLight = new THREE.HemisphereLight(
      initLight.hemiSky,
      initLight.hemiGround,
      initLight.hemiIntensity,
    );
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(
      initLight.sunColor,
      initLight.sunIntensity,
    );
    keyLight.position.set(...initLight.sunPosition);
    keyLight.castShadow = true;
    const shadowRes = isSoftwareGl ? 1024 : 2048;
    keyLight.shadow.mapSize.width = shadowRes;
    keyLight.shadow.mapSize.height = shadowRes;
    keyLight.shadow.camera.near = 4;
    keyLight.shadow.camera.far = 95;
    keyLight.shadow.camera.left = -25;
    keyLight.shadow.camera.right = 25;
    keyLight.shadow.camera.top = 25;
    keyLight.shadow.camera.bottom = -22;
    keyLight.shadow.bias = -0.00025;
    keyLight.shadow.normalBias = 0.012;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xbfdbfe, 0.45);
    rimLight.position.set(-20, 14, -22);
    scene.add(rimLight);

    // Subtle ground studio horizon stage beneath plinth
    const stageMat = new THREE.MeshStandardMaterial({
      color: initLight.skyColor,
      roughness: 0.92,
      metalness: 0.0,
    });
    const stageFloor = new THREE.Mesh(
      new THREE.CircleGeometry(140, 48),
      stageMat,
    );
    stageFloor.rotation.x = -Math.PI / 2;
    stageFloor.position.y = -1.26;
    stageFloor.receiveShadow = true;
    stageFloor.updateMatrix();
    stageFloor.matrixAutoUpdate = false;
    scene.add(stageFloor);

    // Build Procedural Textures & BPS Provinsi Gorontalo 3D Campus
    const textures = createProceduralTexturePack(
      renderer.capabilities.getMaxAnisotropy(),
    );
    const campus = buildBpsGorontaloCampus(textures);
    scene.add(campus.root);

    sceneApiRef.current = { renderer, scene, camera };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycaster for 3D POI hotspot markers (Layer 1 only)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastHoverCheck = 0;

    const updateNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (dist > 6 || !showHotspotsRef.current) return;
      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(campus.interactables, false);
      if (hits.length > 0) {
        const poiId = hits[0].object.userData.poiId as string | undefined;
        if (poiId) {
          onSelectPoiRef.current(poiId);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 55) return;
      lastHoverCheck = now;
      if (!showHotspotsRef.current) {
        renderer.domElement.style.cursor = 'grab';
        return;
      }
      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(campus.interactables, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // Keyboard WASD / Arrow smooth pan
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // WebGL context loss safety
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      onContextRestored,
    );

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      viewportRef.current = { width: w, height: h };
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const adapted = adaptViewForViewport(rawViewRef.current, w, h);
      transitionRef.current.camPos.set(...adapted.position);
      transitionRef.current.lookAt.set(...adapted.target);
      transitionRef.current.active = true;
      forcePinUpdate = true;
    };
    window.addEventListener('resize', onResize);

    // Continuous paced render loop
    let frameId = 0;
    let disposed = false;
    const startMs = performance.now();
    let prevMs = startMs;
    let frameCount = 0;

    let lastLightingId: LightingPresetId = lightingIdRef.current;
    let lightingTransitionActive = false;

    let forcePinUpdate = true;
    const prevCamPos = new THREE.Vector3();
    const prevCamQuat = new THREE.Quaternion();
    let prevShowPins: boolean | null = null;
    let prevActivePoiId: string | null = null;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;

      const nowMs = performance.now();
      const rawDt = (nowMs - prevMs) / 1000;
      const dt = Math.min(rawDt, 0.1);
      prevMs = nowMs;
      const elapsed = (nowMs - startMs) / 1000;
      frameCount++;

      // Efficient shadow map scheduling:
      // Render shadow map every frame during active lighting transitions (sun moving),
      // otherwise schedule at a relaxed 20 FPS (every 3rd frame) for dynamic car/palm shadows
      if (lightingTransitionActive) {
        renderer.shadowMap.needsUpdate = true;
      } else if (frameCount % 3 === 0) {
        renderer.shadowMap.needsUpdate = true;
      }

      // 1. Exponentially damped camera transition (for presets, tour, POIs)
      if (transitionRef.current.active) {
        const dampAlpha = 1 - Math.exp(-4.6 * dt);
        _targetCamPos.copy(transitionRef.current.camPos);
        _targetLookAt.copy(transitionRef.current.lookAt);

        camera.position.lerp(_targetCamPos, dampAlpha);
        controls.target.lerp(_targetLookAt, dampAlpha);

        if (
          camera.position.distanceTo(_targetCamPos) < 0.04 &&
          controls.target.distanceTo(_targetLookAt) < 0.04
        ) {
          camera.position.copy(_targetCamPos);
          controls.target.copy(_targetLookAt);
          transitionRef.current.active = false;
        }
      }

      // 2. Keyboard WASD / Arrow movement
      const panSpeed = 12 * dt;
      let movedByKeys = false;
      if (keys['KeyW'] || keys['ArrowUp']) {
        camera.getWorldDirection(_panForward);
        _panForward.y = 0;
        _panForward.normalize().multiplyScalar(panSpeed);
        camera.position.add(_panForward);
        controls.target.add(_panForward);
        movedByKeys = true;
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        camera.getWorldDirection(_panForward);
        _panForward.y = 0;
        _panForward.normalize().multiplyScalar(-panSpeed);
        camera.position.add(_panForward);
        controls.target.add(_panForward);
        movedByKeys = true;
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        camera.getWorldDirection(_panForward);
        _panForward.y = 0;
        _panForward.normalize();
        _panRight.crossVectors(_panForward, camera.up).normalize().multiplyScalar(-panSpeed);
        camera.position.add(_panRight);
        controls.target.add(_panRight);
        movedByKeys = true;
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        camera.getWorldDirection(_panForward);
        _panForward.y = 0;
        _panForward.normalize();
        _panRight.crossVectors(_panForward, camera.up).normalize().multiplyScalar(panSpeed);
        camera.position.add(_panRight);
        controls.target.add(_panRight);
        movedByKeys = true;
      }
      if (movedByKeys) {
        transitionRef.current.active = false;
      }

      controls.update();

      // 3. Smooth dynamic lighting interpolation (Pagi / Senja / Malam)
      if (lightingIdRef.current !== lastLightingId) {
        lastLightingId = lightingIdRef.current;
        lightingTransitionActive = true;
      }

      if (lightingTransitionActive) {
        const lightCfg = LIGHTING_PRESETS[lightingIdRef.current];
        const wallDt = Math.min(rawDt, 0.5);
        const lightDamp = 1 - Math.exp(-9.5 * wallDt);

        _targetSkyColor.set(lightCfg.skyColor);
        if (scene.background instanceof THREE.Color) {
          scene.background.lerp(_targetSkyColor, lightDamp);
        }
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.lerp(_targetSkyColor, lightDamp);
        }
        stageMat.color.lerp(_targetSkyColor, lightDamp);

        _targetSunColor.set(lightCfg.sunColor);
        keyLight.color.lerp(_targetSunColor, lightDamp);
        keyLight.intensity = THREE.MathUtils.lerp(
          keyLight.intensity,
          lightCfg.sunIntensity,
          lightDamp,
        );
        _targetSunPos.set(...lightCfg.sunPosition);
        keyLight.position.lerp(_targetSunPos, lightDamp);

        _targetHemiSky.set(lightCfg.hemiSky);
        _targetHemiGround.set(lightCfg.hemiGround);
        hemiLight.color.lerp(_targetHemiSky, lightDamp);
        hemiLight.groundColor.lerp(_targetHemiGround, lightDamp);
        hemiLight.intensity = THREE.MathUtils.lerp(
          hemiLight.intensity,
          lightCfg.hemiIntensity,
          lightDamp,
        );
        scene.environmentIntensity = THREE.MathUtils.lerp(
          scene.environmentIntensity,
          lightCfg.envIntensity,
          lightDamp,
        );
        renderer.toneMappingExposure = THREE.MathUtils.lerp(
          renderer.toneMappingExposure,
          lightCfg.exposure,
          lightDamp,
        );

        const targetRimIntensity =
          lightCfg.id === 'malam' ? 0.14 : lightCfg.id === 'senja' ? 0.75 : 0.45;
        rimLight.intensity = THREE.MathUtils.lerp(
          rimLight.intensity,
          targetRimIntensity,
          lightDamp,
        );

        for (let i = 0; i < campus.interiorGlowMaterials.length; i++) {
          const gm = campus.interiorGlowMaterials[i];
          gm.emissiveIntensity = THREE.MathUtils.lerp(
            gm.emissiveIntensity,
            lightCfg.interiorGlow,
            lightDamp,
          );
        }

        const targetPoolOpacity =
          lightCfg.id === 'malam' ? 0.58 : lightCfg.id === 'senja' ? 0.22 : 0.0;
        for (let i = 0; i < campus.lampPoolMaterials.length; i++) {
          const pm = campus.lampPoolMaterials[i];
          pm.opacity = THREE.MathUtils.lerp(
            pm.opacity,
            targetPoolOpacity,
            lightDamp,
          );
        }

        for (let i = 0; i < campus.spotLights.length; i++) {
          const sl = campus.spotLights[i];
          sl.intensity = THREE.MathUtils.lerp(
            sl.intensity,
            lightCfg.spotIntensity,
            lightDamp,
          );
        }

        // Automatic stop when lighting interpolation has settled
        const sunPosDist = keyLight.position.distanceTo(_targetSunPos);
        const sunIntDist = Math.abs(keyLight.intensity - lightCfg.sunIntensity);
        const envDist = Math.abs(scene.environmentIntensity - lightCfg.envIntensity);
        const expDist = Math.abs(renderer.toneMappingExposure - lightCfg.exposure);

        if (sunPosDist < 0.04 && sunIntDist < 0.01 && envDist < 0.005 && expDist < 0.005) {
          if (scene.background instanceof THREE.Color) scene.background.copy(_targetSkyColor);
          if (scene.fog instanceof THREE.FogExp2) scene.fog.color.copy(_targetSkyColor);
          stageMat.color.copy(_targetSkyColor);
          keyLight.color.copy(_targetSunColor);
          keyLight.intensity = lightCfg.sunIntensity;
          keyLight.position.copy(_targetSunPos);
          hemiLight.color.copy(_targetHemiSky);
          hemiLight.groundColor.copy(_targetHemiGround);
          hemiLight.intensity = lightCfg.hemiIntensity;
          scene.environmentIntensity = lightCfg.envIntensity;
          renderer.toneMappingExposure = lightCfg.exposure;
          rimLight.intensity = targetRimIntensity;

          for (let i = 0; i < campus.interiorGlowMaterials.length; i++) {
            campus.interiorGlowMaterials[i].emissiveIntensity = lightCfg.interiorGlow;
          }
          for (let i = 0; i < campus.lampPoolMaterials.length; i++) {
            campus.lampPoolMaterials[i].opacity = targetPoolOpacity;
          }
          for (let i = 0; i < campus.spotLights.length; i++) {
            campus.spotLights[i].intensity = lightCfg.spotIntensity;
          }

          lightingTransitionActive = false;
          renderer.shadowMap.needsUpdate = true;
        }
      }

      // 4. Advance campus animations (flag wave, palms, cruising car, hotspot beacons)
      campus.updateAnimations(elapsed, activePoiRef.current);

      // 5. Render scene
      renderer.render(scene, camera);

      // 6. Project 3D POI hotspot coordinates onto DOM pin overlay (cached viewport, zero layout thrashing)
      const showPins = showHotspotsRef.current;
      const activePoi = activePoiRef.current;
      const cw = viewportRef.current.width;
      const ch = viewportRef.current.height;

      const camPosChanged = camera.position.distanceToSquared(prevCamPos) > 0.0001;
      const camQuatChanged = 1 - Math.abs(camera.quaternion.dot(prevCamQuat)) > 0.00005;
      const stateChanged =
        showPins !== prevShowPins ||
        activePoi !== prevActivePoiId ||
        forcePinUpdate;

      if (camPosChanged || camQuatChanged || stateChanged) {
        forcePinUpdate = false;
        prevCamPos.copy(camera.position);
        prevCamQuat.copy(camera.quaternion);
        prevShowPins = showPins;
        prevActivePoiId = activePoi;

        const isMobileViewport = cw < 640;
        const hasActivePoi = activePoi !== null;
        const topSafe = isMobileViewport ? 78 : 72;
        const bottomSafe = isMobileViewport
          ? hasActivePoi
            ? 360
            : 148
          : hasActivePoi
            ? 140
            : 112;
        const sideSafe = isMobileViewport ? 22 : 36;

        for (let i = 0; i < POI_AREAS.length; i++) {
          const poi = POI_AREAS[i];
          const el = pinRefs.current[poi.id];
          if (!el) continue;
          if (!showPins) {
            if (el.style.opacity !== '0') {
              el.style.opacity = '0';
              el.style.pointerEvents = 'none';
            }
            continue;
          }
          _projVec.set(
            poi.hotspotPosition[0],
            poi.hotspotPosition[1] + 0.9,
            poi.hotspotPosition[2],
          );
          _projVec.project(camera);

          if (_projVec.z > 1 || _projVec.z < -1) {
            if (el.style.opacity !== '0') {
              el.style.opacity = '0';
              el.style.pointerEvents = 'none';
            }
            continue;
          }

          const sx = (_projVec.x * 0.5 + 0.5) * cw;
          const sy = (-_projVec.y * 0.5 + 0.5) * ch;

          if (
            sy < topSafe ||
            sy > ch - bottomSafe ||
            sx < sideSafe ||
            sx > cw - sideSafe
          ) {
            if (el.style.opacity !== '0') {
              el.style.opacity = '0';
              el.style.pointerEvents = 'none';
            }
            continue;
          }

          el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
          if (el.style.opacity !== '1') {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
          }
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      controlsRef.current = null;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        onContextRestored,
      );

      campus.dispose();
      textures.dispose();
      stageFloor.geometry.dispose();
      stageMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneApiRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Dedicated WebGL Mount Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label="Kanvas 3D Interaktif Gedung BPS Provinsi Gorontalo"
      />

      {/* Projected 2D Hotspot Pins (Positioned directly via GPU transform in rAF) */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        {POI_AREAS.map((poi) => {
          const isActive = activePoiId === poi.id;
          return (
            <button
              key={poi.id}
              ref={(el) => {
                pinRefs.current[poi.id] = el;
              }}
              type="button"
              onClick={() => onSelectPoi(poi.id)}
              aria-label={`Fokus ke ${poi.name}`}
              style={{ opacity: 0, left: 0, top: 0 }}
              className={`absolute flex items-center gap-1.5 rounded-full sm:rounded-lg px-2.5 py-1 text-xs font-medium shadow-md transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 whitespace-nowrap ${
                isActive
                  ? 'bg-orange-600 text-white border border-orange-500 z-20'
                  : 'bg-[#FFFFFF]/92 text-slate-900 border border-slate-200 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="font-mono-tabular font-semibold opacity-90">
                0{poi.order}
              </span>
              <span className={isActive ? 'inline' : 'hidden sm:inline'}>
                {poi.shortName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Graceful WebGL Context Lost Fallback */}
      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-100 p-6 text-center">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Memulihkan Tampilan 3D
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Konteks grafis WebGL sedang disinkronkan ulang. Tampilan Gedung BPS Provinsi Gorontalo akan segera kembali.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
