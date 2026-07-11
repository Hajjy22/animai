"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Line,
  MeshBasicMaterial,
  MeshStandardMaterial,
  QuadraticBezierCurve3,
  ShaderMaterial,
  Vector3,
} from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

const ARC_VERTEX_SHADER = `
  attribute float aDistance;
  varying float vDistance;
  void main() {
    vDistance = aDistance;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Draws a flowing dash pattern along the arc's cumulative distance — plain
// LineDashedMaterial has no time-animatable offset (that only exists on the
// newer, WebGPU-only Line2NodeMaterial), so a small custom shader is the
// straightforward way to animate the flow on a standard WebGLRenderer.
const ARC_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColor;
  varying float vDistance;
  void main() {
    float dash = fract(vDistance * 5.0 - uTime * 0.6);
    float visible = step(dash, 0.5);
    gl_FragColor = vec4(uColor, visible * 0.85);
  }
`;

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

const GLOBE_RADIUS = 1.6;

// Fixed lat/lon "cities" (degrees) — a small, deliberate set rather than a
// random scatter, to read as real data points.
const MARKERS = [
  { lat: 40.7, lon: -74.0 }, // New York
  { lat: 51.5, lon: -0.1 }, // London
  { lat: 35.7, lon: 139.7 }, // Tokyo
  { lat: -33.9, lon: 151.2 }, // Sydney
  { lat: 1.35, lon: 103.8 }, // Singapore
  { lat: 37.8, lon: -122.4 }, // San Francisco
];

const ARC_PAIRS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 4],
  [4, 3],
  [0, 5],
  [5, 2],
];

function latLonToVector3(lat: number, lon: number, radius: number): Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function GlobeArc({ from, to }: { from: Vector3; to: Vector3 }) {
  const geometry = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(GLOBE_RADIUS * 1.35);
    const curve = new QuadraticBezierCurve3(from, mid, to);
    const points = curve.getPoints(48);
    const geo = new BufferGeometry().setFromPoints(points);

    let cumulative = 0;
    const distances = new Float32Array(points.length);
    for (let i = 1; i < points.length; i += 1) {
      cumulative += points[i].distanceTo(points[i - 1]);
      distances[i] = cumulative;
    }
    geo.setAttribute("aDistance", new Float32BufferAttribute(distances, 1));
    return geo;
  }, [from, to]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: ARC_VERTEX_SHADER,
        fragmentShader: ARC_FRAGMENT_SHADER,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new Color("#38bdf8") },
        },
      }),
    [],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  // R3F's <line> JSX intrinsic collides with the built-in SVG <line> element
  // under React 19's JSX types, so the Line object is constructed directly
  // and mounted via <primitive> instead.
  const line = useMemo(() => new Line(geometry, material), [geometry, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <primitive object={line} />;
}

function InteractiveGlobeMarkersScene() {
  const { scene } = useThree();
  const globeGroupRef = useRef<Group>(null);

  const wireMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color("#38bdf8"),
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      }),
    [],
  );
  const markerMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#e2e8f0"),
        emissive: new Color("#38bdf8"),
        emissiveIntensity: 0.8,
      }),
    [],
  );

  const markerPositions = useMemo(
    () => MARKERS.map((m) => latLonToVector3(m.lat, m.lon, GLOBE_RADIUS)),
    [],
  );

  useFrame((_, delta) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.08;
    }
  });

  useEffect(() => {
    return () => {
      const disposedMaterials = new Set<Material>();
      const disposedTextures = new Set<Texture>();

      const disposeMaterial = (mat: Material) => {
        if (disposedMaterials.has(mat)) return;
        for (const value of Object.values(mat as unknown as Record<string, unknown>)) {
          if (isTexture(value) && !disposedTextures.has(value)) {
            value.dispose();
            disposedTextures.add(value);
          }
        }
        mat.dispose();
        disposedMaterials.add(mat);
      };

      scene.traverse((object: Object3D) => {
        const mesh = object as Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(disposeMaterial);
        } else if (mesh.material) {
          disposeMaterial(mesh.material);
        }
      });
    };
  }, [scene]);

  return (
    <group ref={globeGroupRef}>
      <mesh material={wireMaterial}>
        <sphereGeometry args={[GLOBE_RADIUS, 32, 24]} />
      </mesh>
      {markerPositions.map((position, index) => (
        <mesh key={index} position={position} material={markerMaterial}>
          <sphereGeometry args={[0.035, 8, 8]} />
        </mesh>
      ))}
      {ARC_PAIRS.map(([a, b], index) => (
        <GlobeArc key={index} from={markerPositions[a]} to={markerPositions[b]} />
      ))}
    </group>
  );
}

export default function InteractiveGlobeMarkers() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-950">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.8} />
        <InteractiveGlobeMarkersScene />
      </Canvas>
    </section>
  );
}
