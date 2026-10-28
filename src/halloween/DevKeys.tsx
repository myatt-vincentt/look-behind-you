// Dev only: 1–4 pick a monster, → or space change to the next one as a look
// back does (lightning, bats, sound); window.__halloween
// exposes the store and the live face readings for debugging. Scene.tsx
// lazy-imports this behind an inline NODE_ENV check, so it never reaches
// production.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { live } from "./live";
import { changeMonster, getMonster, monsterActions } from "./state";

const DevKeys = () => {
  const scene = useThree((st) => st.scene);
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__halloween = {
      actions: monsterActions,
      change: changeMonster,
      get: getMonster,
      live,
      scene,
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "9") monsterActions.pick(Number(e.key) - 1);
      else if (e.key === "ArrowRight" || e.key === " ") changeMonster();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene]);
  return null;
};

export default DevKeys;
