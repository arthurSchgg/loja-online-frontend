import { Component, useRef, useState } from "react";
import type { ReactNode, PointerEvent } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import type { Group } from "three";
import { useReducedMotion } from "motion/react";
import { RotateCcw, RotateCw, Rotate3D } from "lucide-react";

type Finish = "rosé" | "âmbar";

function Bottle({ angle, finish, reduced }: { angle: number; finish: Finish; reduced: boolean }) {
  const color = finish === "rosé" ? "#dba9a3" : "#d3a268";
  const group = useRef<Group>(null);
  const initial = useRef(angle);
  useFrame((state, delta) => {
    if (!group.current) return;
    const current = group.current.rotation.y;
    const difference = Math.atan2(Math.sin(angle - current), Math.cos(angle - current));
    if (reduced || Math.abs(difference) < .003) group.current.rotation.y = angle;
    else {
      group.current.rotation.y = MathUtils.damp(current, current + difference, 14, Math.min(delta, .05));
      state.invalidate();
    }
  });
  return <group ref={group} rotation={[0, initial.current, 0]} position={[0, -0.15, 0]}>
    {/* Original geometric bottle concept, never a representation of an SKU. */}
    <mesh position={[0, -0.12, 0]}>
      <boxGeometry args={[1.48, 1.82, 0.72]} />
      <meshPhysicalMaterial color="#f3d8cd" roughness={0.18} metalness={0.08}
        transparent opacity={0.48} depthWrite={false} clearcoat={1} />
    </mesh>
    <mesh position={[0, -0.36, 0]}>
      <boxGeometry args={[1.30, 1.25, 0.59]} />
      <meshPhysicalMaterial color={color} roughness={0.25} metalness={0.15} clearcoat={0.9} />
    </mesh>
    <mesh position={[0, -0.13, 0.369]}>
      <boxGeometry args={[0.82, 0.95, 0.018]} />
      <meshStandardMaterial color="#f7e9db" roughness={0.7} />
    </mesh>
    <mesh position={[0, -0.1, 0.384]}>
      <torusGeometry args={[0.19, 0.012, 12, 42]} />
      <meshStandardMaterial color="#9b6555" metalness={0.55} roughness={0.25} />
    </mesh>
    <mesh position={[0, 0.89, 0]}>
      <cylinderGeometry args={[0.23, 0.24, 0.24, 32]} />
      <meshStandardMaterial color="#ba8a57" metalness={0.75} roughness={0.24} />
    </mesh>
    <mesh position={[0, 1.2, 0]}>
      <cylinderGeometry args={[0.41, 0.4, 0.42, 48]} />
      <meshPhysicalMaterial color="#be996a" metalness={0.8} roughness={0.23} clearcoat={0.8} />
    </mesh>
    <mesh position={[0, 1.43, 0]}>
      <cylinderGeometry args={[0.39, 0.41, 0.045, 48]} />
      <meshStandardMaterial color="#f4d3a2" metalness={0.58} roughness={0.21} />
    </mesh>
  </group>;
}

class StudioBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <StudioFallback /> : this.props.children;
  }
}

function StudioFallback() {
  return <div className="studio-fallback">
    <img src="assets/images/brand/hero-live-poster.webp" alt="Composição editorial de fragrâncias" width={900} height={1125} />
    <p role="status">A visualização 3D não está disponível neste dispositivo. A fotografia continua disponível.</p>
  </div>;
}

export function FragranceStudio() {
  const [angle, setAngle] = useState(25);
  const [finish, setFinish] = useState<Finish>("rosé");
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{pointer: number; x: number; angle: number} | null>(null);
  const reduced = useReducedMotion() || document.documentElement.dataset.motion === "off";
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.pointerType === "touch") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, x: event.clientX, angle };
    setDragging(true);
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const from = drag.current;
    if (!from || from.pointer !== event.pointerId) return;
    setAngle(((Math.round(from.angle + (event.clientX - from.x) * .65) % 360) + 360) % 360);
  };
  const stopDrag = () => { drag.current = null; setDragging(false); };
  return <div className="studio-interactive">
    <div className="studio-scene" aria-label="Frasco conceitual 3D em iluminação editorial" data-dragging={dragging}
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}>
      <StudioBoundary>
        <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [3.3, 2.3, 5.7], fov: 34 }}
          gl={{ antialias: true, alpha: true }} fallback={<StudioFallback />}>
          <ambientLight intensity={1.6} />
          <directionalLight color="#fff4e3" position={[3, 5, 5]} intensity={3} />
          <directionalLight color="#dbaca4" position={[-4, 1, -3]} intensity={2} />
          <pointLight color="#ffe1bf" intensity={18} position={[2, 1.5, -3]} />
          <Bottle angle={angle * Math.PI / 180} finish={finish} reduced={!!reduced} />
          <mesh position={[0, -1.23, 0]}>
            <cylinderGeometry args={[1.38, 1.5, 0.14, 48]} />
            <meshStandardMaterial color="#c6a99b" roughness={0.77} />
          </mesh>
        </Canvas>
      </StudioBoundary>
      <span className="studio-drag-hint" aria-hidden="true"><Rotate3D size={15} /> Arraste para girar</span>
    </div>
    <div className="studio-controls">
      <label htmlFor="studio-angle">Girar frasco <output>{angle}°</output></label>
      <div className="studio-rotation">
        <button type="button" className="icon-button" aria-label="Girar para a esquerda" onClick={() => setAngle(v => (v + 345) % 360)}><RotateCcw size={18} /></button>
        <input id="studio-angle" type="range" min="0" max="359" value={angle} onChange={e => setAngle(Number(e.target.value))} />
        <button type="button" className="icon-button" aria-label="Girar para a direita" onClick={() => setAngle(v => (v + 15) % 360)}><RotateCw size={18} /></button>
      </div>
      <fieldset className="studio-finishes"><legend>Acabamento conceitual</legend>
        {(["rosé", "âmbar"] as const).map(value => <button key={value} type="button" className="btn btn--secondary"
          aria-pressed={finish === value} onClick={() => setFinish(value)}><span className="studio-swatch" data-finish={value} aria-hidden="true" />{value}</button>)}
      </fieldset>
      <button type="button" className="text-link studio-reset" onClick={() => { setAngle(25); setFinish("rosé"); }}><Rotate3D size={16} /> Reiniciar visualização</button>
    </div>
  </div>;
}
