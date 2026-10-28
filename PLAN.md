# Plan — Look Behind You

A Halloween quick-change: look behind you and turn back as a monster. Built on SDK
2.0.0-alpha.9 with the vincentt.studio head accessories.

## Design

- Four monsters, in order: a pumpkin head (the jack-o'-lantern worn as a mask over the whole
  head), a vampire (fangs, purple bat wings), a witch (pointed hat, witch nose) and a devil
  (horns, red bat wings). Two little ghosts circle the head all the time.
- Turn your head away and back, or tap the screen, for the next monster. Each change strikes
  lightning, and a swarm of bats bursts out from behind the head and flies past the camera.
- Spooky, not cute: behind you the room becomes a dark night with a big moon, drifting cloud
  and fog along the floor; you stay lit, warmed from below; a heavy vignette frames it.
- Sound (synthesised): a low drone and wind, thunder and a flutter of bats on each change. Off
  until the speaker in the corner is tapped.
- No overlay: at the start and when idle, a small 3D ghost face by the shoulder looks away and
  back.

## How it works

- `monsters.ts`: the monsters, their pieces, each piece's preset (the file's own colour variant)
  and fit. `state.ts`: which monster, and `changeMonster` (next monster, lightning, bats, sound).
- `Part.tsx`: loads a piece (shared cache), applies its preset, plays its idle loops, mirrors
  the face through its authored face triggers (`rig.ts`), wobbles on a head shake, pops in and
  shrinks away; an `arrange` hook rebuilds a model (the ghosts, the bats). `Swap.tsx`: the new
  piece pops in as the old one shrinks away.
- `FilteredHead.tsx` + `headFilter.ts` (unit-tested): the SDK's canonical head fit through a
  speed-adaptive critically damped spring, the depth-only v3 head occluder in the same group, the
  SDK's `NeckOccluder` in the face tracker. Face model 20 Hz.
- `turn.ts` (unit-tested): facing the camera arms it; a turn past 24° (or the face lost for
  0.3 s) and back under 12° fires once, after at least 0.12 s away and 0.6 s since the last
  change. `Inputs.tsx` feeds it the head's yaw and turns a tap into a change.
- `Grade.tsx`: one full-screen shader over the camera texture, split by the portrait mask
  (`usePersonMaskTexture`): the night (desaturated, cold, the moon, cloud, fog) behind you, you
  as seen plus a warm glow from below, the vignette, and the lightning. It also shares the mask
  with `personMask.ts`, which hides the bat wings wherever you are.
- `Ghosts.tsx`: the ghost bopper's two ghosts on an orbit round the head. `Bats.tsx`: copies of
  the bat wings' little bat, flying out from behind the head on each change.
- `TurnHint.tsx`: the SDK's `FaceExpressionHint` (`face-v1.glb`) by the shoulder, 3 s after the
  face appears and after every 10 s without a change, looking away and back.
- `audio.ts` + `Speaker.tsx`: Web Audio synthesis and the speaker toggle.
- Dev only: `DevKeys.tsx` (1–4 pick, → / space change, `window.__halloween`),
  `DevMediaSwitcher.tsx`, `?occ`.

## Known limits

- A slow, small head turn (under about 24°) doesn't count; look clearly to the side.
- The bat wings are hidden by the portrait mask, so very fast movement can let their edges
  trail the body for a moment.
