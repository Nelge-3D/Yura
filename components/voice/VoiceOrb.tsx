"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type OrbMode = "listening" | "thinking" | "speaking" | "idle";

// Même effet lumineux que la landing page (ShaderAnimation), contenu dans un cercle
// et piloté par l'intensité de la voix : les vagues accélèrent et s'épaississent quand YURA parle.
const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float energy;

  void main(void) {
    // Même formule que la landing ; on « dézoome » pour retrouver ses reflets irisés sur le bord du cercle
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float zoom = 1.45 + energy * 0.25;
    uv *= zoom;
    float r = length(uv);
    float t = time * 0.05;
    float lineWidth = 0.002 + energy * 0.004;

    // Trois vagues décalées d'un tiers de période : l'orbe n'est jamais éteint entre deux cycles
    vec3 color = vec3(0.0);
    for (int k = 0; k < 3; k++) {
      float phase = float(k) / 3.0;
      for (int j = 0; j < 3; j++) {
        for (int i = 0; i < 5; i++) {
          color[j] += lineWidth * float(i * i) /
            abs(fract(t + phase - 0.01 * float(j) + float(i) * 0.01) * 5.0 - r + mod(uv.x + uv.y, 0.2));
        }
      }
    }

    // Bord du cercle adouci
    float mask = 1.0 - smoothstep(zoom * 0.9, zoom, r);
    gl_FragColor = vec4(color * mask, 1.0);
  }
`;

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

// Niveau « au repos » de chaque mode quand il n'y a pas de voix à suivre
function baseEnergy(mode: OrbMode, t: number): number {
  switch (mode) {
    case "listening":
      return 0.12 + 0.06 * Math.sin(t * 2.2); // respiration lente
    case "thinking":
      return 0.08 + 0.04 * Math.sin(t * 6); // frémissement
    case "idle":
      return 0.03;
    default:
      return 0.1;
  }
}

export default function VoiceOrb({
  mode,
  getLevel,
  size,
}: {
  mode: OrbMode;
  getLevel: () => number;
  size: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  // Redimensionne le canvas quand l'orbe change de taille (rotation, fenêtre redimensionnée)
  const resizeRef = useRef<(px: number) => void>(() => {});
  // Lus à chaque image sans relancer la scène WebGL
  const modeRef = useRef(mode);
  const getLevelRef = useRef(getLevel);
  useEffect(() => {
    modeRef.current = mode;
    getLevelRef.current = getLevel;
  }, [mode, getLevel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      time: { value: 1.0 },
      energy: { value: 0.0 },
      resolution: { value: new THREE.Vector2() },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    scene.add(new THREE.Mesh(geometry, material));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    resizeRef.current = (px: number) => {
      renderer.setSize(px, px);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    resizeRef.current(container.clientWidth);
    container.appendChild(renderer.domElement);

    let energy = 0;
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = performance.now() / 1000;
      const m = modeRef.current;
      const target = m === "speaking" ? Math.max(getLevelRef.current(), 0.08) : baseEnergy(m, t);
      // Lissage : montée rapide, descente plus douce
      energy += (target - energy) * (target > energy ? 0.35 : 0.12);
      uniforms.energy.value = energy;
      uniforms.time.value += reducedMotion ? 0.01 : 0.03 + energy * 0.12;
      renderer.render(scene, camera);
      if (glowRef.current) {
        glowRef.current.style.transform = `scale(${1 + energy * 0.12})`;
        glowRef.current.style.opacity = String(0.35 + energy * 0.65);
      }
    };
    animate();

    return () => {
      resizeRef.current = () => {};
      cancelAnimationFrame(frame);
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    resizeRef.current(size);
  }, [size]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* Halo lumineux qui respire avec la voix */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -size * 0.12,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(82,183,136,0.35) 0%, rgba(82,183,136,0) 70%)",
          pointerEvents: "none",
          transition: "opacity 0.1s linear",
        }}
      />
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#000",
        }}
      />
    </div>
  );
}
