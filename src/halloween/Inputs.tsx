// What changes the monster: looking behind you (turn.ts reads the head's
// yaw, every frame) or a tap on the screen.
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { live } from "./live";
import { changeMonster } from "./state";
import { stepTurn, turnState } from "./turn";

/** A press that moves less than this (px) is a tap. */
const TAP_SLOP = 12;

export const Inputs = () => {
  const turn = useRef(useMemo(turnState, []));
  useFrame(() => {
    const { state, fired } = stepTurn(
      turn.current,
      performance.now() / 1000,
      live.tracked ? live.yaw : null,
    );
    turn.current = state;
    if (fired) changeMonster();
  });

  const canvas = useThree((s) => s.gl.domElement);
  useEffect(() => {
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < TAP_SLOP)
        changeMonster();
      down = null;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [canvas]);
  return null;
};
