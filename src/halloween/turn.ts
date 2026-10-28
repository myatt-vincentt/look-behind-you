// Looking behind you — pure, unit-tested (turn.test.ts).
//
// Facing the camera arms it; turning the head away (a glance to either side
// past `away`, or all the way round so the face is lost) and coming back to
// face the camera fires once. The change happens on the way back, so you
// turn back as the next monster. A flick shorter than `minAway`, the face
// dropping out for a moment while you face the camera, and small wobbles
// don't count.

const deg = (d: number) => (d * Math.PI) / 180;

export const TURN = {
  /** Yaw (rad) past which you're looking away, and back under which you face us. */
  away: deg(24),
  back: deg(12),
  /** Seconds away before coming back counts. */
  minAway: 0.12,
  /** Seconds the face must be lost (after facing us) to count as turned round. */
  lostAway: 0.3,
  /** Seconds between two changes at least. */
  cooldown: 0.6,
};

export type TurnState = {
  phase: "unseen" | "front" | "away";
  /** When the current phase started (s). */
  since: number;
  /** When the face was lost while facing us (s); −1 = it isn't. */
  lostAt: number;
  /** When it last fired (s). */
  firedAt: number;
};

export const turnState = (): TurnState => ({
  phase: "unseen",
  since: 0,
  lostAt: -1,
  firedAt: -Infinity,
});

/**
 * One frame: `yaw` (rad, either sign) while a face is tracked, null when
 * it isn't. Returns the next state and whether you just turned back.
 */
export const stepTurn = (
  s: TurnState,
  t: number,
  yaw: number | null,
  cfg = TURN,
): { state: TurnState; fired: boolean } => {
  if (yaw === null) {
    if (s.phase !== "front") return { state: s, fired: false };
    const lostAt = s.lostAt < 0 ? t : s.lostAt;
    if (t - lostAt < cfg.lostAway)
      return { state: { ...s, lostAt }, fired: false };
    // Gone long enough: you turned right round.
    return {
      state: { ...s, phase: "away", since: lostAt, lostAt: -1 },
      fired: false,
    };
  }
  const a = Math.abs(yaw);
  const seen = { ...s, lostAt: -1 };
  if (s.phase === "unseen")
    return {
      state: a < cfg.back ? { ...seen, phase: "front", since: t } : seen,
      fired: false,
    };
  if (s.phase === "front")
    return {
      state: a > cfg.away ? { ...seen, phase: "away", since: t } : seen,
      fired: false,
    };
  // Away: wait to face us again.
  if (a >= cfg.back) return { state: seen, fired: false };
  const fired = t - s.since >= cfg.minAway && t - s.firedAt >= cfg.cooldown;
  return {
    state: {
      ...seen,
      phase: "front",
      since: t,
      firedAt: fired ? t : s.firedAt,
    },
    fired,
  };
};
