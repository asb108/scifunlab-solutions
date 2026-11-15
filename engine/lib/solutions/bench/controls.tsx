"use client";

/**
 * Invisible hit volumes that let a student drag or press a bench part in 3D.
 * Every control disables `OrbitControls` while dragging, captures the
 * pointer, and sets the hover cursor. Extracted from the prototype's
 * `GuessTarget`/`Controls3D` (`app/solutions/prototype-bench/BenchScene.tsx`).
 */
import type { ThreeEvent } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

function useOrbitControls() {
  return useThree((state) => state.controls) as OrbitControlsImpl | null;
}

/**
 * A line a student can drag along, in the local frame of the group it is
 * placed in (which may itself be rotated, e.g. onto a slope). The hit box
 * spans local x `from..from+length`, z `±width/2`; the reported value is the
 * hit point's local x, clamped to `[min, max]`.
 */
export function PathHandle({
  from,
  length,
  width,
  min,
  max,
  enabled,
  onChange,
  onDragStart,
  onDragEnd,
}: {
  from: number;
  length: number;
  width: number;
  min: number;
  max: number;
  enabled: boolean;
  onChange(value: number): void;
  onDragStart?(): void;
  onDragEnd?(): void;
}) {
  const controls = useOrbitControls();
  const dragging = useRef(false);
  const local = useMemo(() => new Vector3(), []);
  const report = (event: ThreeEvent<PointerEvent>) => {
    local.copy(event.point);
    (event.object.parent ?? event.object).worldToLocal(local);
    onChange(Math.min(max, Math.max(min, local.x)));
  };
  const endDrag = (target: EventTarget | null, pointerId: number) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (controls) controls.enabled = true;
    (target as Element | null)?.releasePointerCapture?.(pointerId);
    document.body.style.cursor = "";
    onDragEnd?.();
  };
  return (
    <mesh
      position={[from + length / 2, 0, 0]}
      onPointerDown={(event) => {
        if (!enabled) return;
        event.stopPropagation();
        dragging.current = true;
        if (controls) controls.enabled = false;
        (event.target as unknown as Element).setPointerCapture?.(event.pointerId);
        onDragStart?.();
        report(event);
      }}
      onPointerMove={(event) => {
        if (dragging.current) report(event);
      }}
      // A vertical swipe may be taken over by page scrolling (touch-action: pan-y), which sends
      // pointercancel instead of pointerup: end the drag on all three so orbiting is never left off.
      onPointerUp={(event) => endDrag(event.target, event.pointerId)}
      onPointerCancel={(event) => endDrag(event.target, event.pointerId)}
      onLostPointerCapture={(event) => endDrag(event.target, event.pointerId)}
      onPointerOver={() => {
        if (enabled) document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <boxGeometry args={[length, 0.04, width]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/**
 * A dial a student turns by dragging up or down: up increases the value by
 * `perPx` per pixel of drag, rounded to `step` and clamped to `[min, max]`.
 */
export function DialHandle({
  position,
  rotation,
  radius,
  value,
  min,
  max,
  step,
  perPx = 0.3,
  enabled,
  onChange,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius: number;
  value: number;
  min: number;
  max: number;
  step: number;
  perPx?: number;
  enabled: boolean;
  onChange(value: number): void;
}) {
  const controls = useOrbitControls();
  const drag = useRef<{ y: number; value: number } | null>(null);
  const endDrag = (target: EventTarget | null, pointerId: number) => {
    if (!drag.current) return;
    drag.current = null;
    if (controls) controls.enabled = true;
    (target as Element | null)?.releasePointerCapture?.(pointerId);
    document.body.style.cursor = "";
  };
  return (
    <mesh
      position={position}
      rotation={rotation ?? [Math.PI / 2, 0, 0]}
      onPointerDown={(event) => {
        if (!enabled) return;
        event.stopPropagation();
        drag.current = { y: event.nativeEvent.clientY, value };
        if (controls) controls.enabled = false;
        (event.target as unknown as Element).setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const next = drag.current.value + (drag.current.y - event.nativeEvent.clientY) * perPx;
        const rounded = Math.round(next / step) * step;
        onChange(Math.min(max, Math.max(min, rounded)));
      }}
      onPointerUp={(event) => endDrag(event.target, event.pointerId)}
      onPointerCancel={(event) => endDrag(event.target, event.pointerId)}
      onLostPointerCapture={(event) => endDrag(event.target, event.pointerId)}
      onPointerOver={() => {
        if (enabled) document.body.style.cursor = "ns-resize";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <cylinderGeometry args={[radius, radius, 0.08, 24]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** A button a student presses. */
export function PressButton({
  position,
  size,
  enabled,
  onPress,
}: {
  position: [number, number, number];
  size: [number, number, number];
  enabled: boolean;
  onPress(): void;
}) {
  return (
    <mesh
      position={position}
      onClick={(event) => {
        if (!enabled) return;
        event.stopPropagation();
        onPress();
      }}
      onPointerOver={() => {
        if (enabled) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
