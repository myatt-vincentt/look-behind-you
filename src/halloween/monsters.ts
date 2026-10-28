// The four monsters, in the order a look-away steps through them, and the
// ghosts that circle every one. vincentt.studio head accessories
// (public/models/vincentt-*.glb), authored in metres in the "Complete 3D
// Reference - Spark AR" face frame (origin at the front of the face, +Y up,
// +Z out of the face) — see FRAME.

export type Part = {
  /** File name in public/models without `vincentt-` / `.glb`. */
  id: string;
  /**
   * One of the file's own presets, by name: its finish, and its colour
   * variant of every material that has one (`mat_x` → `mat_x__<preset>`).
   * The first preset when unset.
   */
  preset?: string;
  /** Material swaps by name, to another material in the same file. */
  materials?: Record<string, string>;
  /** Tints by material name (on this part's own copy of the material). */
  colors?: Record<string, string>;
  /** Fine placement: `x` / `y` / `z` canonical cm, `scale` about its middle. */
  fit?: { x?: number; y?: number; z?: number; scale?: number };
  /** Always behind you: hidden wherever the portrait mask is (personMask.ts). */
  behindPerson?: boolean;
};

export type Monster = { id: string; parts: readonly Part[] };

export const MONSTERS: readonly Monster[] = [
  {
    id: "pumpkin",
    // Worn as a mask: big enough to swallow the head, the carved face over
    // the face.
    parts: [
      {
        id: "jack-o-lantern-hat",
        preset: "Spooky Night",
        fit: { y: -10, z: 1, scale: 1.3 },
      },
    ],
  },
  {
    id: "vampire",
    parts: [
      { id: "mouth-vampire-fangs" },
      { id: "wings-devil-bat", preset: "Vampire Purple", behindPerson: true },
    ],
  },
  {
    id: "witch",
    parts: [
      { id: "wizard-hat", preset: "Witching Hour" },
      { id: "nose-witch" },
    ],
  },
  {
    id: "devil",
    parts: [
      { id: "horns-devil" },
      { id: "wings-devil-bat", behindPerson: true },
    ],
  },
];

/** The circling ghosts: the ghost bopper's two ghosts, off their springs. */
export const GHOSTS: Part = {
  id: "bopper-cute-ghosts",
  preset: "Glow-in-the-Dark",
};

/** A part's identity: the same model in another preset is another piece. */
export const partKey = (p: Part) => `${p.id}:${p.preset ?? ""}`;

export const modelUrl = (id: string) => `/models/vincentt-${id}.glb`;

/** The SDK's v3 head occluder, hosted here until the SDK CDN serves it. */
export const OCCLUDER_URL = "/models/head-occluder-v3.glb";

/** The SDK's neck-and-shoulders bust occluder (same story). */
export const NECK_OCCLUDER_URL = "/models/neck-occluder-bust-v1.glb";

/**
 * The models' frame → the SDK's canonical head frame (centimetres): ×100,
 * then the same shift the SDK used to move the Spark AR reference into the
 * canonical frame (chins and nose tips aligned; vincentt-xr-sdk
 * assets-src/head-occluder/README.md).
 */
export const FRAME = {
  scale: 100,
  position: [0, -1.03, 7.3] as const,
};
