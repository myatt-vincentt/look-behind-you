// The bat swarm that bursts out with every change: the bat wings' little
// bat (a flat silhouette facing the camera) copied into a swarm that bursts
// from behind the head and swoops out past the camera, flapping as it goes.
// The lightning that comes with each change silhouettes them. Model frame:
// metres in the Spark AR face frame (see monsters.ts FRAME).
import { Group, MeshBasicMaterial, Vector3, type Mesh } from "three";

import { live } from "./live";
import { Part, type Arrange } from "./Part";
import type { Part as PartSpec } from "./monsters";

const BATS: PartSpec = { id: "wings-devil-bat", preset: "Midnight Bat" };

const SWARM = {
  count: 18,
  /** Where they burst from: behind the middle of the head. */
  from: [0, 0.08, -0.12] as const,
  /** Seconds a bat flies; the last one leaves up to `stagger` later. */
  life: 1.3,
  stagger: 0.3,
  /** Speed (m/s): out to the sides, up, and toward the camera. */
  side: [0.25, 0.6] as const,
  up: [-0.05, 0.45] as const,
  toward: [0.55, 1.1] as const,
  /** Size against the bat as modelled, and wing beats per second. */
  size: [1.4, 2.4] as const,
  beats: 9,
  /** Flat silhouettes: unlit, near black with a purple cast. */
  color: "#140a1c",
};

const between = ([a, b]: readonly [number, number]) =>
  a + Math.random() * (b - a);

type Bat = {
  mesh: Mesh;
  delay: number;
  velocity: Vector3;
  size: number;
  phase: number;
};

const arrangeBats: Arrange = (root, mixer) => {
  // Only the swarm here: no wings, no wing flap.
  mixer.stopAllAction();
  root.traverse((o) => {
    // eslint-disable-next-line no-param-reassign
    if (/_wing_[LR]|_burst_/.test(o.name)) o.visible = false;
  });
  const model = root.getObjectByName("wings_devil_bat_burst_00") as
    | Mesh
    | undefined;
  if (!model) return () => {};
  const material = new MeshBasicMaterial({ color: SWARM.color });
  const swarm = new Group();
  swarm.position.set(...SWARM.from);
  root.add(swarm);
  const bats: Bat[] = Array.from({ length: SWARM.count }, () => {
    const mesh = model.clone();
    mesh.material = material;
    mesh.position.set(0, 0, 0);
    mesh.scale.setScalar(0);
    mesh.visible = false;
    swarm.add(mesh);
    return { mesh, delay: 0, velocity: new Vector3(), size: 1, phase: 0 };
  });

  let seen = live.changes;
  let start = -1;
  return (t) => {
    if (live.changes !== seen) {
      seen = live.changes;
      start = t;
      for (let i = 0; i < bats.length; i += 1) {
        const b = bats[i];
        // Half to each side, fanning out round the head.
        const side = i % 2 ? 1 : -1;
        b.delay = Math.random() * SWARM.stagger;
        b.velocity.set(
          side * between(SWARM.side),
          between(SWARM.up),
          between(SWARM.toward),
        );
        b.size = between(SWARM.size);
        b.phase = Math.random() * Math.PI * 2;
      }
    }
    bats.forEach((b) => {
      const age = start < 0 ? -1 : t - start - b.delay;
      const { mesh } = b;
      if (age < 0 || age > SWARM.life) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.copy(b.velocity).multiplyScalar(age);
      // A little climb and dive as they go.
      mesh.position.y += Math.sin(age * 7 + b.phase) * 0.015;
      const beat = Math.abs(Math.sin(age * SWARM.beats * Math.PI + b.phase));
      const grow = Math.min(1, age / 0.12);
      mesh.scale.set(
        b.size * grow * (0.35 + 0.65 * beat),
        b.size * grow,
        b.size * grow,
      );
      mesh.rotation.z =
        Math.sign(b.velocity.x) * 0.25 + Math.sin(age * 5 + b.phase) * 0.2;
    });
  };
};

export const Bats = () => <Part part={BATS} arrange={arrangeBats} />;
