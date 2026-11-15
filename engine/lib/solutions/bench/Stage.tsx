"use client";

/**
 * Shared stage for every lab bench: textbook page, lights, orthographic camera,
 * demand frameloop and imperative view controls.
 */
import { Line, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import type { Group, OrthographicCamera as OrthographicCameraImpl } from "three";
import { Vector3 } from "three";
import type { DirectionalLight as DirectionalLightImpl } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { Vec3 } from "@/lib/solutions/types";

import { Box, tone } from "./ink";

const DEG = Math.PI / 180;
const CAM_AZ = 20 * DEG;
const CAM_EL = 23 * DEG;
const CAM_DIST = 30;

export interface BenchCanvasHandle {
  frontView(): void;
  turntable(on: boolean): void;
  nudge(dAzimuthDeg: number, dPolarDeg: number): void;
}

export interface BenchCanvasProps {
  view: { width: number; height: number };
  focus: { target: Vec3; zoom: number };
  page: { x0: number; x1: number; depth: number; top: number };
  ariaLabel: string;
  children: ReactNode;
  onLost?(): void;
  onReady?(): void;
  handleRef?: Ref<BenchCanvasHandle>;
}

/** Invalidate every frame while `active`, so `frameloop="demand"` keeps animating. */
export function useKeepDrawing(active: boolean) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  useFrame(() => {
    if (active) invalidate();
  });
}

/** Spring-up scale on first paint; keeps the demand loop alive while rising. */
export function useRise(delay: number) {
  const ref = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const [rising, setRising] = useState(true);
  useKeepDrawing(rising);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    start.current ??= clock.elapsedTime;
    const k = Math.min(1, Math.max(0, (clock.elapsedTime - start.current - delay) / 0.8));
    const c = 1.9;
    const e = k === 0 ? 0.001 : 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
    ref.current.scale.set(1, Math.max(0.001, e), 1);
    if (k >= 1 && rising) setRising(false);
  });
  return ref;
}

/** The open textbook page the bench sits on. */
export function BookPage({ page }: { page: { x0: number; x1: number; depth: number; top: number } }) {
  const { x0, x1, depth: zd, top } = page;
  const line = (x: number, z: number, len: number): [number, number, number][] => [
    [x, top + 0.003, z],
    [x + len, top + 0.003, z],
  ];
  // Printed text on the page, placed relative to its left edge and depth.
  const tx = x0 + 2.2;
  const caption = [line(tx, zd - 0.65, 1.4), line(tx + 1.6, zd - 0.65, 3.6), line(tx, zd - 0.38, 4.4), line(tx + 4.6, zd - 0.38, 2.2)];
  const heading = [line(tx, -zd + 0.45, 2.6), line(tx + 2.8, -zd + 0.45, 1.2), line(tx, -zd + 0.7, 5.4), line(tx + 5.6, -zd + 0.7, 3.0)];
  const fx0 = x0 + 0.5;
  const fz0 = zd - 0.8;
  const pageW = x1 - x0;
  const pageZ = zd * 2;
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, top - 0.2, 0]}>
        <boxGeometry args={[pageW + 0.5, 0.1, pageZ + 0.5]} />
        <meshStandardMaterial color={tone.board} roughness={0.7} />
      </mesh>
      <Box size={[pageW, 0.14, pageZ]} position={[(x0 + x1) / 2, top - 0.08, 0]} color="#EFE6CF" line="none" />
      {[0.035, 0.07, 0.105].map((dy) => (
        <Line
          key={dy}
          points={[
            [x0 + 0.02, top - dy, zd + 0.002],
            [x1 - 0.02, top - dy, zd + 0.002],
          ]}
          color={tone.pageLine}
          lineWidth={1}
        />
      ))}
      <mesh position={[(x0 + x1) / 2, top - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[pageW - 0.02, pageZ - 0.02]} />
        <meshStandardMaterial color={tone.page} roughness={0.95} />
      </mesh>
      {[...caption, ...heading].map((pts, i) => (
        <Line key={i} points={pts} color={i === caption.length ? "#8D8470" : tone.pageLine} lineWidth={i === caption.length ? 4 : 2.4} />
      ))}
      <Line
        points={[
          [fx0, top + 0.003, fz0],
          [fx0 + 1.4, top + 0.003, fz0],
          [fx0 + 1.4, top + 0.003, fz0 + 0.55],
          [fx0, top + 0.003, fz0 + 0.55],
          [fx0, top + 0.003, fz0],
        ]}
        color="#8D8470"
        lineWidth={1.6}
      />
      {/* Flat blue cast shadow on the cream page (parts still use soft shadows). */}
      <mesh position={[(x0 + x1) / 2, top + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[pageW - 0.02, pageZ - 0.02]} />
        <shadowMaterial color="#41538F" opacity={0.35} transparent />
      </mesh>
    </group>
  );
}

function TouchPolicy() {
  const gl = useThree((state) => state.gl);
  const connected = useThree((state) => state.events.connected as HTMLElement | undefined);
  const controls = useThree((state) => state.controls);
  useEffect(() => {
    // One-finger vertical swipes must scroll the page. OrbitControls sets touch-action: none on the element it
    // listens to (R3F's wrapper div), and the browser applies the strictest value up the tree, so reset both.
    const apply = () => {
      gl.domElement.style.touchAction = "pan-y";
      if (connected?.style) connected.style.touchAction = "pan-y";
    };
    apply();
    const t = setTimeout(apply, 0);
    return () => clearTimeout(t);
  }, [gl, connected, controls]);
  return null;
}

function SceneLights({ page, shadowSize }: { page: BenchCanvasProps["page"]; shadowSize: number }) {
  const center = useMemo(() => new Vector3((page.x0 + page.x1) / 2, page.top, 0), [page]);
  const key = useRef<DirectionalLightImpl>(null);
  useLayoutEffect(() => {
    const light = key.current;
    if (!light?.target) return;
    light.target.position.copy(center);
    light.target.updateMatrixWorld();
  }, [center]);
  const half = Math.max(page.x1 - page.x0, page.depth * 2) / 2 + 2;
  return (
    <>
      <hemisphereLight args={["#FFF8EC", "#9FB4FF", 1.25]} />
      <directionalLight position={[center.x + 5, center.y + 4, -6]} intensity={0.55} color="#A9C4FF" />
      <directionalLight
        ref={key}
        position={[center.x - 7, center.y + 11, 7]}
        intensity={1.9}
        color="#FFF1DC"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
}

const BenchCamera = forwardRef<
  BenchCanvasHandle,
  {
    view: BenchCanvasProps["view"];
    focus: BenchCanvasProps["focus"];
    phone: boolean;
    initialFocus: { target: Vec3; zoom: number };
  }
>(function BenchCamera({ view, focus, phone, initialFocus }, ref) {
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera) as OrthographicCameraImpl;
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);

  const base = useMemo(
    () =>
      phone
        ? Math.min(size.width / (view.width * 0.875), size.height / (view.height * 0.84))
        : Math.min(size.width / view.width, size.height / view.height),
    [phone, size.width, size.height, view.width, view.height],
  );

  const homeTarget = useMemo(() => new Vector3(...initialFocus.target), [initialFocus.target]);
  const goal = useRef<{ target: Vector3; zoom: number; until: number } | null>(null);
  const turntable = useRef(false);
  const homeAzimuth = useRef(CAM_AZ);
  const homePolar = useRef(Math.PI / 2 - CAM_EL);
  const frontGoal = useRef<{ target: Vector3; zoom: number; until: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  useKeepDrawing(animating);

  const focusKey = `${focus.target.join()}|${focus.zoom}|${base}`;
  useEffect(() => {
    goal.current = {
      target: new Vector3(...focus.target),
      zoom: base * focus.zoom,
      until: performance.now() + 1100,
    };
    setAnimating(true);
  }, [focusKey, focus.target, focus.zoom, base]);

  useImperativeHandle(ref, () => ({
    frontView() {
      turntable.current = false;
      frontGoal.current = {
        target: homeTarget.clone(),
        zoom: base * initialFocus.zoom,
        until: performance.now() + 1100,
      };
      setAnimating(true);
      invalidate();
    },
    turntable(on: boolean) {
      turntable.current = on;
      if (on) {
        homeAzimuth.current = controls?.getAzimuthalAngle() ?? CAM_AZ;
        homePolar.current = controls?.getPolarAngle() ?? Math.PI / 2 - CAM_EL;
      }
      setAnimating(on);
      invalidate();
    },
    nudge(dAzimuthDeg: number, dPolarDeg: number) {
      if (!controls) return;
      controls.setAzimuthalAngle(controls.getAzimuthalAngle() + dAzimuthDeg * DEG);
      controls.setPolarAngle(Math.min(88 * DEG, Math.max(30 * DEG, controls.getPolarAngle() + dPolarDeg * DEG)));
      controls.update();
      turntable.current = false;
      invalidate();
    },
  }));

  useFrame((state, dt) => {
    if (!controls) return;
    let moving = false;
    const homePol = Math.PI / 2 - CAM_EL;

    if (turntable.current) {
      const sway = Math.sin(state.clock.elapsedTime * ((2 * Math.PI) / 8)) * 35 * DEG;
      controls.setAzimuthalAngle(homeAzimuth.current + sway);
      controls.setPolarAngle(homePolar.current);
      controls.update();
      moving = true;
    }

    const fg = frontGoal.current;
    if (fg) {
      const k = 1 - Math.exp(-dt * 5);
      const shift = fg.target.clone().sub(controls.target).multiplyScalar(k);
      controls.target.add(shift);
      camera.position.add(shift);
      controls.setAzimuthalAngle(controls.getAzimuthalAngle() + (CAM_AZ - controls.getAzimuthalAngle()) * k);
      controls.setPolarAngle(controls.getPolarAngle() + (homePol - controls.getPolarAngle()) * k);
      camera.zoom += (fg.zoom - camera.zoom) * k;
      camera.updateProjectionMatrix();
      controls.update();
      moving = true;
      if (performance.now() > fg.until) frontGoal.current = null;
    }

    const g = goal.current;
    if (g) {
      const k = 1 - Math.exp(-dt * 5);
      const shift = g.target.clone().sub(controls.target).multiplyScalar(k);
      controls.target.add(shift);
      camera.position.add(shift);
      camera.zoom += (g.zoom - camera.zoom) * k;
      camera.updateProjectionMatrix();
      controls.update();
      moving = true;
      if (performance.now() > g.until) goal.current = null;
    }

    const still = moving || goal.current !== null || frontGoal.current !== null || turntable.current;
    if (still !== animating) setAnimating(still);
  });

  const startPos = useMemo(() => {
    const t = homeTarget;
    return new Vector3(
      t.x + CAM_DIST * Math.sin(CAM_AZ) * Math.cos(CAM_EL),
      t.y + CAM_DIST * Math.sin(CAM_EL),
      t.z + CAM_DIST * Math.cos(CAM_AZ) * Math.cos(CAM_EL),
    );
  }, [homeTarget]);

  return (
    <>
      <OrthographicCamera makeDefault zoom={base * initialFocus.zoom} near={0.1} far={100} position={startPos.toArray()} />
      <OrbitControls
        makeDefault
        target={initialFocus.target}
        enablePan={false}
        minZoom={base * 0.8}
        maxZoom={base * 3.5}
        minPolarAngle={30 * DEG}
        maxPolarAngle={88 * DEG}
        minAzimuthAngle={-70 * DEG}
        maxAzimuthAngle={70 * DEG}
        onStart={() => {
          turntable.current = false;
          setAnimating(goal.current !== null || frontGoal.current !== null);
        }}
      />
    </>
  );
});

function ReadyReporter({ onReady }: { onReady?(): void }) {
  const reported = useRef(false);
  useFrame(() => {
    if (!reported.current) {
      reported.current = true;
      onReady?.();
    }
  });
  return null;
}

function WebGLLoss({ onLost }: { onLost?(): void }) {
  const gl = useThree((s) => s.gl);
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    const el = gl.domElement;
    const handler = (e: Event) => {
      e.preventDefault();
      // Stop drawing at once: rendering on a lost context throws inside three.js.
      setFrameloop("never");
      onLost?.();
    };
    el.addEventListener("webglcontextlost", handler);
    return () => el.removeEventListener("webglcontextlost", handler);
  }, [gl, onLost, setFrameloop]);
  return null;
}

function BenchInner({
  view,
  focus,
  page,
  ariaLabel,
  children,
  onLost,
  onReady,
  handleRef,
  phone,
  shadowSize,
}: BenchCanvasProps & { phone: boolean; shadowSize: number }) {
  const initialFocus = useRef(focus);

  return (
    <Canvas
      flat
      frameloop="demand"
      shadows="soft"
      dpr={[1, phone ? 1.5 : 2]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        // three.js reads the shader log on first use; on a just-lost context the log is null and it throws
        // before the contextlost event arrives. Our shaders are stock materials, so skip that check.
        gl.debug.checkShaderErrors = false;
      }}
      aria-label={ariaLabel}
    >
      <BenchCamera ref={handleRef} view={view} focus={focus} phone={phone} initialFocus={initialFocus.current} />
      <TouchPolicy />
      <WebGLLoss onLost={onLost} />
      <ReadyReporter onReady={onReady} />
      <SceneLights page={page} shadowSize={shadowSize} />
      <BookPage page={page} />
      {children}
    </Canvas>
  );
}

export function BenchCanvas(props: BenchCanvasProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setPhone(el.clientWidth < 600);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const start = () => setShowCanvas(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(start, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(start, 1500);
    return () => clearTimeout(t);
  }, []);

  const shadowSize = phone ? 1024 : 2048;

  return (
    <div ref={wrap} className="h-full w-full">
      {showCanvas ? <BenchInner {...props} phone={phone} shadowSize={shadowSize} /> : null}
    </div>
  );
}
