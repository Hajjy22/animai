#!/usr/bin/env node
// Scaffolds a new registry/<id>/ folder that passes `npm run vet` out of the
// box: manifest.json + a minimal component.tsx/loader.tsx following whichever
// archetype you pick. Fill in the scene/markup, then re-run `npm run vet`.
//
// Usage:
//   node scripts/new-component.mjs <template-id> --kind webgl|gsap|css [options]
//
// Options:
//   --title "..."       (default: derived from id)
//   --summary "..."     (default: placeholder — please fill in)
//   --tier free|pro      (default: free)
//   --tags a,b,c
//   --pascal PascalName  (default: derived from id)

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = path.join(rootDir, "registry");

function fail(message) {
  console.error(`new-component: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const [id, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    if (!item.startsWith("--")) continue;
    const name = item.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith("--")) {
      flags[name] = true;
      continue;
    }
    flags[name] = next;
    i += 1;
  }
  return { id, flags };
}

function toPascalCase(id) {
  return id
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toTitleCase(id) {
  return id
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const WEBGL_COMPONENT = (pascal) => `"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, MeshStandardMaterial } from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

function ${pascal}Scene() {
  const { scene } = useThree();
  const material = useMemo(
    () => new MeshStandardMaterial({ color: new Color("#38bdf8") }),
    [],
  );

  useEffect(() => {
    return () => {
      const disposedMaterials = new Set<Material>();
      const disposedTextures = new Set<Texture>();

      const disposeMaterial = (mat: Material) => {
        if (disposedMaterials.has(mat)) {
          return;
        }
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

  // TODO: replace with the real scene content.
  return (
    <mesh material={material}>
      <icosahedronGeometry args={[1, 1]} />
    </mesh>
  );
}

export default function ${pascal}() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-950">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <${pascal}Scene />
      </Canvas>
    </section>
  );
}
`;

const WEBGL_LOADER = (pascal) => `"use client";

import dynamic from "next/dynamic";

const ${pascal} = dynamic(() => import("./${pascal}"), { ssr: false });

export function ${pascal}Slot() {
  return <${pascal} />;
}
`;

const GSAP_COMPONENT = (pascal) => `"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function ${pascal}() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // TODO: replace with the real animation.
      gsap.from("[data-reveal]", { autoAlpha: 0, y: 24, stagger: 0.08 });
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="w-full bg-slate-950 px-6 py-24 text-white">
      <h2 data-reveal className="text-4xl font-semibold">
        Replace this content.
      </h2>
    </section>
  );
}
`;

const GSAP_LOADER = (pascal) => `"use client";

import ${pascal} from "./${pascal}";

export function ${pascal}Slot() {
  return <${pascal} />;
}
`;

// CSS archetype: no useEffect/GSAP/Three — pure Tailwind + inline keyframes.
// No GPU resources and no client-only APIs, so it needs neither a dispose
// cleanup nor an SSR gate; the loader is a plain passthrough (still required
// because read-registry.mjs expects both files for every component).
const CSS_COMPONENT = (pascal) => `export default function ${pascal}() {
  return (
    <section className="relative w-full overflow-hidden bg-slate-950 px-6 py-24 text-white">
      {/* TODO: replace with the real markup + <style> keyframes. */}
      <h2 className="text-4xl font-semibold">Replace this content.</h2>
    </section>
  );
}
`;

const CSS_LOADER = (pascal) => `import ${pascal} from "./${pascal}";

export function ${pascal}Slot() {
  return <${pascal} />;
}
`;

// Interactive-UI archetype (css kind + a forms/overlays/navigation/feedback
// category): a client component with a native focusable control, focus-visible
// styling, token-driven motion, and a prefers-reduced-motion guard — so it
// passes the accessibility tier out of the box. Replace the body with the real
// component while keeping those affordances.
const UI_COMPONENT = (pascal) => `"use client";

import { useState } from "react";

export default function ${pascal}() {
  const [on, setOn] = useState(false);

  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center bg-slate-950 p-8">
      {/* TODO: replace with the real component (keep it keyboard-accessible). */}
      <button
        type="button"
        onClick={() => setOn((value) => !value)}
        aria-pressed={on}
        className="${pascal.toLowerCase()}-control rounded-[var(--ai-radius,0.5rem)] bg-[var(--ai-primary,#0ea5e9)] px-4 py-2 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ai-ring,#38bdf8)]"
      >
        {on ? "On" : "Off"}
      </button>
      <style>{\`
        .${pascal.toLowerCase()}-control {
          transition: background-color var(--ai-duration, 200ms) var(--ai-ease, ease);
        }
        @media (prefers-reduced-motion: reduce) {
          .${pascal.toLowerCase()}-control {
            transition: none;
          }
        }
      \`}</style>
    </section>
  );
}
`;

function manifest({ id, pascal, kind, category, title, summary, tier, tags }) {
  const isWebgl = kind === "webgl";
  const isGsap = kind === "gsap";
  const framework = isWebgl ? "nextjs-r3f" : isGsap ? "nextjs-gsap" : "nextjs-css";
  return {
    template_id: id,
    version: "1.0.0",
    tier,
    category,
    title,
    summary,
    framework,
    framework_targets: ["nextjs-app-router"],
    component_filename: `${pascal}.tsx`,
    loader_filename: `${pascal}Slot.tsx`,
    loader_export: `${pascal}Slot`,
    dependencies: isWebgl ? ["three", "@react-three/fiber"] : isGsap ? ["gsap", "@gsap/react"] : [],
    peer_dep_ranges: isWebgl
      ? {
          react: ">=18.2.0",
          next: ">=14.0.0",
          three: ">=0.160.0",
          "@react-three/fiber": ">=8.15.0",
        }
      : isGsap
      ? {
          react: ">=18.2.0",
          next: ">=14.0.0",
          gsap: ">=3.12.0",
          "@gsap/react": ">=2.1.0",
        }
      : {
          react: ">=18.2.0",
          next: ">=14.0.0",
        },
    integration_instructions: [
      `Write the returned target_code to app/components/${pascal}.tsx.`,
      `Write loader_code to app/components/${pascal}Slot.tsx.`,
      `Import ${pascal}Slot into the route where the component should appear.`,
      `Render <${pascal}Slot /> inside the page body.`,
      "Install peer dependencies before running the dev server.",
    ],
    preview_url: `https://animai.dev/preview/${id}`,
    vetting_report: {
      dispose_audit: "pending",
      ssr_safe: false,
      vram_leak: false,
      fps_budget: 60,
      measured_fps: null,
      method: "static",
      verified_at: null,
      harness_version: null,
    },
    tags,
  };
}

function main() {
  const { id, flags } = parseArgs(process.argv.slice(2));
  if (!id) {
    fail(
      "usage: node scripts/new-component.mjs <template-id> --kind webgl|gsap|css [--category forms|overlays|navigation|feedback|recipe|showcase|design-system]",
    );
  }
  if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    fail(`template-id "${id}" must be kebab-case (lowercase letters, digits, hyphens).`);
  }
  const kind = flags.kind;
  if (kind !== "webgl" && kind !== "gsap" && kind !== "css") {
    fail('--kind must be "webgl", "gsap", or "css"');
  }
  const tier = flags.tier === "pro" ? "pro" : "free";
  const CATEGORIES = ["showcase", "forms", "overlays", "navigation", "feedback", "recipe", "design-system"];
  const category = typeof flags.category === "string" ? flags.category : "showcase";
  if (!CATEGORIES.includes(category)) {
    fail(`--category must be one of: ${CATEGORIES.join(", ")}`);
  }
  const pascal = typeof flags.pascal === "string" ? flags.pascal : toPascalCase(id);
  const title = typeof flags.title === "string" ? flags.title : toTitleCase(id);
  const summary = typeof flags.summary === "string" ? flags.summary : "TODO: describe this component.";
  const tags = typeof flags.tags === "string" ? flags.tags.split(",").map((t) => t.trim()) : [];

  const dir = path.join(registryDir, id);
  if (existsSync(dir)) {
    fail(`registry/${id} already exists.`);
  }
  mkdirSync(dir, { recursive: true });

  const UI_CATEGORIES = ["forms", "overlays", "navigation", "feedback", "recipe"];
  const isUi = kind === "css" && UI_CATEGORIES.includes(category);
  const componentTemplate =
    kind === "webgl"
      ? WEBGL_COMPONENT
      : kind === "gsap"
      ? GSAP_COMPONENT
      : isUi
      ? UI_COMPONENT
      : CSS_COMPONENT;
  const loaderTemplate =
    kind === "webgl" ? WEBGL_LOADER : kind === "gsap" ? GSAP_LOADER : CSS_LOADER;

  writeFileSync(path.join(dir, "component.tsx"), componentTemplate(pascal), "utf8");
  writeFileSync(path.join(dir, "loader.tsx"), loaderTemplate(pascal), "utf8");
  writeFileSync(
    path.join(dir, "manifest.json"),
    `${JSON.stringify(manifest({ id, pascal, kind, category, title, summary, tier, tags }), null, 2)}\n`,
    "utf8",
  );

  console.error(`new-component: scaffolded registry/${id}/ (kind=${kind}, tier=${tier}, category=${category})`);
  console.error(`Next: edit component.tsx, then run \`npm run vet\` and \`npm run build\`.`);
}

main();
