import { describe, expect, it } from "vitest";

import { stepTurn, turnState, TURN } from "./turn";

const deg = (d: number) => (d * Math.PI) / 180;
const FPS = 30;

/** Runs `track(t)` (yaw in degrees, or null for no face) for `seconds`. */
const run = (seconds: number, track: (t: number) => number | null) => {
  let s = turnState();
  let fires = 0;
  for (let i = 0; i <= seconds * FPS; i += 1) {
    const t = i / FPS;
    const y = track(t);
    const r = stepTurn(s, t, y === null ? null : deg(y));
    s = r.state;
    if (r.fired) fires += 1;
  }
  return fires;
};

describe("stepTurn", () => {
  it("a glance to the side and back fires once, on the way back", () => {
    expect(run(3, (t) => (t > 1 && t < 1.6 ? 35 : 0))).toBe(1);
  });

  it("works to either side", () => {
    expect(
      run(5, (t) => (t > 1 && t < 1.6 ? -35 : t > 3 && t < 3.6 ? 40 : 0)),
    ).toBe(2);
  });

  it("turning right round (face lost) fires when the face comes back", () => {
    expect(run(4, (t) => (t > 1 && t < 2.5 ? null : 0))).toBe(1);
  });

  it("a flick shorter than minAway doesn't count", () => {
    expect(run(3, (t) => (t > 1 && t < 1 + TURN.minAway / 2 ? 35 : 0))).toBe(0);
  });

  it("a face dropping out for a moment doesn't count", () => {
    expect(run(3, (t) => (t > 1 && t < 1 + TURN.lostAway / 2 ? null : 0))).toBe(
      0,
    );
  });

  it("small wobbles don't count", () => {
    expect(run(5, (t) => 15 * Math.sin(t * 6))).toBe(0);
  });

  it("staying turned away fires nothing until you look back", () => {
    expect(run(3, (t) => (t > 1 ? 40 : 0))).toBe(0);
  });

  it("two quick looks closer than the cooldown change once", () => {
    expect(
      run(3, (t) => ((t > 1 && t < 1.2) || (t > 1.3 && t < 1.5) ? 35 : 0)),
    ).toBe(1);
  });

  it("starting turned away waits for the face to face us first", () => {
    expect(run(3, (t) => (t < 1 ? 40 : 0))).toBe(0);
  });
});
