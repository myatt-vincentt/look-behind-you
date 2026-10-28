// The only hint, wordless and in the scene: at the start, and when the
// monster hasn't changed for a while, a ghost face (the SDK's
// FaceExpressionHint) appears beside the head and looks over its shoulder
// and back. It fades in and out (strict ease-out). On the filtered head,
// canonical cm.
import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import type { Group } from "three";
// eslint-disable-next-line import/extensions
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
// eslint-disable-next-line import/extensions
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FaceExpressionHint } from "@vincentt-xr/sdk/instructions";

import { live } from "./live";

const HINT = {
  /** Seconds after the face appears, then after the last change, before it shows. */
  first: 3,
  idle: 10,
  /** Seconds it stays. */
  show: 3,
  /** By the shoulder (cm, under the pumpkin and the ghosts), turned in toward the camera. */
  at: [21, -17, 6] as const,
  turn: -0.4,
  height: 10,
  /** How far it looks away (degrees). */
  look: 75,
  renderOrder: 15,
};

const FACE_URL = "/models/face-v1.glb";
const EXPRESSION = { targets: { smile: 0.3 } };
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const smooth = (t: number) => t * t * (3 - 2 * t);

/** 0 → 1 → 0 over the show: look away, hold, look back. */
const lookAt = (age: number) => {
  const k = age / HINT.show;
  if (k < 0.15) return 0;
  if (k < 0.4) return smooth((k - 0.15) / 0.25);
  if (k < 0.55) return 1;
  if (k < 0.8) return 1 - smooth((k - 0.55) / 0.25);
  return 0;
};

export const TurnHint = () => {
  // face-v1.glb is meshopt-compressed: the loader needs the decoder.
  const face = useLoader(GLTFLoader, FACE_URL, (l) =>
    l.setMeshoptDecoder(MeshoptDecoder),
  );
  const g = useRef<Group>(null);
  const turner = useRef<Group>(null);
  const shownAt = useRef(-1);
  const seenAt = useRef(-1);
  const quietSince = useRef(0);
  const model = useMemo(() => face.scene, [face]);

  useFrame(() => {
    const o = g.current;
    if (!o) return;
    const t = performance.now() / 1000;
    if (!live.tracked) {
      seenAt.current = -1;
      shownAt.current = -1;
      o.visible = false;
      return;
    }
    if (seenAt.current < 0) seenAt.current = t;
    const since = Math.max(live.lastChange, quietSince.current, seenAt.current);
    const wait = live.lastChange > 0 ? HINT.idle : HINT.first;
    // Start one when it's been quiet long enough; stop at once on a change.
    if (shownAt.current < 0 && t - since > wait) shownAt.current = t;
    if (shownAt.current < 0) {
      o.visible = false;
      return;
    }
    const age = t - shownAt.current;
    if (age > HINT.show || live.lastChange > shownAt.current) {
      // Done (or someone played): wait the idle time again before the next.
      quietSince.current = t;
      shownAt.current = -1;
      o.visible = false;
      return;
    }
    o.visible = true;
    const fadeIn = easeOut(Math.min(1, age / 0.35));
    const fadeOut = easeOut(Math.min(1, (HINT.show - age) / 0.35));
    o.scale.setScalar(Math.max(1e-4, Math.min(fadeIn, fadeOut)));
    if (turner.current)
      turner.current.rotation.y =
        HINT.turn + (lookAt(age) * HINT.look * Math.PI) / 180;
  });

  return (
    <group ref={g} position={HINT.at} visible={false}>
      <group ref={turner} rotation-y={HINT.turn}>
        <FaceExpressionHint
          expression={EXPRESSION}
          model={model}
          height={HINT.height}
          orbit={0}
          renderOrder={HINT.renderOrder}
        />
      </group>
    </group>
  );
};
