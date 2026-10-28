// The monster: its pieces on the filtered head (FilteredHead.tsx: the SDK's
// canonical head fit through a spring, with the depth-only head occluder in
// the same group), the ghosts circling it, and the Halloween night behind
// you. Look behind you (or tap) and you turn back as the next monster: its
// pieces pop in as the last one's go, with lightning and a burst of bats. The pieces are in metres in
// the Spark AR face frame; FRAME turns them into canonical centimetres.
import { Suspense, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
// eslint-disable-next-line import/extensions
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useFaceInfo, useGesture } from "@vincentt-xr/sdk/tracking";

import { Bats } from "./Bats";
import { FACE_FPS, FilteredHead } from "./FilteredHead";
import { Ghosts } from "./Ghosts";
import { Grade } from "./Grade";
import { Inputs } from "./Inputs";
import { live } from "./live";
import { FRAME, MONSTERS } from "./monsters";
import { Speaker } from "./Speaker";
import { useMonster } from "./state";
import { Swap } from "./Swap";
import { TurnHint } from "./TurnHint";

/** The blendshapes the pieces' face_triggers read (see rig.ts). */
const FACE_INPUTS = [
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "browInnerUp",
  "browDownLeft",
  "browDownRight",
];
/** Per-second easing of the readings (higher = snappier, noisier). */
const FACE_EASE = 14;

/** Copies the face's blendshapes and yaw into `live` and counts head shakes. */
const FaceSignals = () => {
  // Same options as FilteredHead's FaceTracker: the first consumer of the
  // shared face model sets its face count and rate.
  const face = useFaceInfo({ active: true, numFaces: 1, targetFps: FACE_FPS });
  const raw = useRef<Readonly<Record<string, number | undefined>>>({});
  raw.current = face?.blendshapes ?? {};
  const rawYaw = useRef(0);
  rawYaw.current = face?.pose.rotation.y ?? 0;
  // Raw blendshapes flicker a few percent frame to frame; ease toward them.
  const smooth = useRef<Record<string, number>>({});
  useFrame((_st, dt) => {
    const k = 1 - Math.exp(-FACE_EASE * Math.min(dt, 0.1));
    const out = smooth.current;
    FACE_INPUTS.forEach((name) => {
      const v = raw.current[name] ?? 0;
      out[name] = (out[name] ?? v) + (v - (out[name] ?? v)) * k;
    });
    live.blendshapes = out;
    live.yaw += (rawYaw.current - live.yaw) * k;
  }, -1);
  useGesture("headShake", {
    onBegin: () => {
      live.shakes += 1;
    },
  });
  return null;
};

/** Soft studio reflections, so the pieces' sheen reads in the dark room. */
const useStudioLight = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const before = scene.environment;
    scene.environment = tex;
    return () => {
      scene.environment = before;
      tex.dispose();
    };
  }, [gl, scene]);
};

/** Most pieces a monster wears at once. */
const SLOTS = Math.max(...MONSTERS.map((m) => m.parts.length));

export const HalloweenScene = () => {
  const monster = MONSTERS[useMonster()];
  useStudioLight();
  return (
    <>
      <Grade />
      <FaceSignals />
      <Inputs />
      <Speaker />
      <FilteredHead>
        <group
          name="halloween-frame"
          scale={FRAME.scale}
          position={FRAME.position}
        >
          <Ghosts />
          <Bats />
          {Array.from({ length: SLOTS }, (_, i) => (
            <Swap key={i} part={monster.parts[i] ?? null} />
          ))}
        </group>
        <Suspense fallback={null}>
          <TurnHint />
        </Suspense>
      </FilteredHead>
    </>
  );
};
