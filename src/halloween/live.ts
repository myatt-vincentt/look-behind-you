// Live face readings, written every frame by FaceSignals (no re-renders).
export const live = {
  blendshapes: {} as Readonly<Record<string, number | undefined>>,
  /** A face is being tracked (FilteredHead). */
  tracked: false,
  /** Head yaw, radians (eased). */
  yaw: 0,
  /** When (performance.now() s) the monster last changed; 0 = never. */
  lastChange: 0,
  /** Bumps on each change: the lightning, the bats and the sounds follow it. */
  changes: 0,
  /** Bumps on each head shake: the pieces play their wobble. */
  shakes: 0,
  /** Dev only (window.__halloween): stands in for the face's readings. */
  override: null as Readonly<Record<string, number | undefined>> | null,
};
