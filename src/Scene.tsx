// Scene.tsx — Look Behind You: turn your head away and turn back as a
// Halloween monster (pumpkin, vampire, witch, devil), with ghosts circling
// your head in a spooky room. See PLAN.md.
import { lazy, Suspense } from "react";

import { HalloweenScene } from "./halloween/HalloweenScene";

// Dev-only helpers for previewing without a camera. Lazy and behind a
// constant esbuild folds to false in production. Two rules:
// `process.env.NODE_ENV`, not `import.meta.env.DEV` (vincentt-xr/v2-template#112);
// and write the check INSIDE the ternary — hoisted into a `const`, esbuild
// keeps the dead branch.
const DevMediaSwitcher =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./DevMediaSwitcher"))
    : null;
const DevKeys =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./halloween/DevKeys"))
    : null;

export const Scene = () => (
  <>
    <HalloweenScene />
    {DevMediaSwitcher && DevKeys ? (
      <Suspense fallback={null}>
        <DevMediaSwitcher />
        <DevKeys />
      </Suspense>
    ) : null}
  </>
);
