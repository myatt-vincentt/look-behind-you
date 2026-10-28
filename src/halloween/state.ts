// Which monster you are. One small store for the scene, the input and the
// dev keys.
import { useSyncExternalStore } from "react";

import { live } from "./live";
import { MONSTERS } from "./monsters";

let current = 0;
const listeners = new Set<() => void>();

const set = (next: number) => {
  current = next;
  listeners.forEach((l) => l());
};

export const getMonster = () => current;

export const useMonster = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getMonster,
    getMonster,
  );

export const monsterActions = {
  /** The next monster, round and round. */
  next() {
    set((current + 1) % MONSTERS.length);
  },
  /** Monster `i` (wraps). */
  pick(i: number) {
    const n = MONSTERS.length;
    const to = ((i % n) + n) % n;
    if (to !== current) set(to);
  },
};

/** You turned back (or tapped): the next monster, with lightning and bats. */
export const changeMonster = () => {
  monsterActions.next();
  live.lastChange = performance.now() / 1000;
  live.changes += 1;
};
