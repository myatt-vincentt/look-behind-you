// The only control on screen: a small glass speaker in the corner. Sound is
// off until it's tapped. Each change then plays thunder and a flutter of bats.
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { Overlay } from "../overlay";
import { sound } from "./audio";
import { live } from "./live";

const SIZE = 44;

const Icon = ({ on }: { on: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    {on ? (
      <path
        d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ) : (
      <path
        d="M16.5 9.5l5 5m0-5l-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    )}
  </svg>
);

/** Plays the change sounds when the monster changes. */
const ChangeSounds = () => {
  const seen = useRef(live.changes);
  useFrame(() => {
    if (live.changes === seen.current) return;
    seen.current = live.changes;
    sound.thunder();
    sound.flutter();
  });
  return null;
};

export const Speaker = () => {
  const [on, setOn] = useState(false);
  return (
    <>
      <ChangeSounds />
      <Overlay corner="bottom-right" margin={20} interactive>
        <button
          type="button"
          aria-label={on ? "Sound off" : "Sound on"}
          onClick={() => {
            sound.set(!on);
            setOn(!on);
          }}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background: "rgba(24, 12, 36, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Icon on={on} />
        </button>
      </Overlay>
    </>
  );
};
