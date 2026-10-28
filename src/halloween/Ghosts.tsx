// Little ghosts circling the head: the ghost bopper's two ghosts taken off
// their springs and set on a slow orbit round the head, bobbing as they go
// and always facing the camera. Behind the head the occluder hides them.
// Model frame: metres in the Spark AR face frame (see monsters.ts FRAME).
import { Group, type Object3D } from "three";

import { Part, type Arrange } from "./Part";
import { GHOSTS } from "./monsters";

const ORBIT = {
  /** Centre of the circle: above the brows, over the middle of the head. */
  centre: [0, 0.1, -0.085] as const,
  /** Radius (m): clear of the pumpkin and the hat brim. */
  radius: 0.25,
  /** Seconds per lap. */
  lap: 9,
  /** Bob height (m) and its period (s). */
  bob: 0.012,
  bobPeriod: 2.2,
  /** Ghost size against the bopper's. */
  scale: 1.5,
};

/** Bopper pieces that stay hidden: the band, the stalks, the springs. */
const HIDE = /_band$|_stalk_|_look_|_burst_/;

const arrangeGhosts: Arrange = (root) => {
  const ghosts = ["bop_ghosts_ghost_L", "bop_ghosts_ghost_R"]
    .map((n) => root.getObjectByName(n))
    .filter((o): o is Object3D => !!o);
  root.traverse((o) => {
    // eslint-disable-next-line no-param-reassign
    if (HIDE.test(o.name)) o.visible = false;
  });
  const pivot = new Group();
  pivot.position.set(...ORBIT.centre);
  root.add(pivot);
  const holders = ghosts.map((g, i) => {
    const h = new Group();
    pivot.add(h);
    h.add(g);
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    g.scale.setScalar(ORBIT.scale);
    return { h, phase: (i / ghosts.length) * Math.PI * 2 };
  });
  return (t) => {
    holders.forEach(({ h, phase }) => {
      const a = (t / ORBIT.lap) * Math.PI * 2 + phase;
      h.position.set(
        Math.sin(a) * ORBIT.radius,
        Math.sin((t / ORBIT.bobPeriod) * Math.PI * 2 + phase) * ORBIT.bob,
        Math.cos(a) * ORBIT.radius,
      );
    });
  };
};

export const Ghosts = () => <Part part={GHOSTS} arrange={arrangeGhosts} />;
