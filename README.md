# Look Behind You

A Halloween night: the room behind you turns dark under a big moon with fog rolling along the
floor, little ghosts circle your head, and you're a monster. Turn your head away (a glance to
the side or all the way round) and turn back as the next one: a pumpkin head, a vampire, a
witch, a devil. Lightning strikes and a swarm of bats bursts out from behind you with every
change. Tap the screen to change too. No text on screen: a ghost face by your shoulder looks
away and back to show the move.

- The pieces are vincentt.studio head accessories on the SDK's canonical head fit, steadied by a
  speed-adaptive spring with the head occluder in the same group; the bat wings hide wherever the
  portrait mask says you are, so they stay behind your body. The pieces react as their author
  built them (smile and the wings spread, open your mouth and they beat).
- The look-away (`src/halloween/turn.ts`, unit-tested): past about 24° of head turn, or the face
  lost for a moment, then facing the camera again; small wobbles and a turn held away don't count.
- The night behind you is one shader over the camera (`src/halloween/Grade.tsx`), split by the
  portrait mask. The sounds are synthesised (`src/halloween/audio.ts`) and stay off until you tap
  the speaker.
- Thumbnail: `public/images/look-behind-you-thumbnail.jpg` (the share image).
- Models: `public/models/vincentt-*.glb` (monsters and fit in `src/halloween/monsters.ts`); the
  hint face is `face-v1.glb`. Credits in `CREDITS.md`.
- Dev preview without a camera: the media switcher starts on `dev-media/halloween.mp4` if you add
  one, else the SDK's sample video; 1–4 pick a monster, → or space change to the next one as a
  look-back does; `?occ` draws the occluders. How it works: `PLAN.md`.

---

# v2-template

The Vincentt starter app: a real React + R3F + Vincentt XR SDK (`@vincentt-xr/sdk`)
WebXR app, bundled by esbuild.

## Shape

```
src/
  main.tsx            mount — never edited
  App.tsx             protected shell: XRProvider + AspectRatioContainer +
                      XRScene + media-source binding, camera, lighting,
                      VideoBackground, PreviewAnchors — never edited
  Scene.tsx           the agent's surface: add SDK components and R3F
                      primitives here
  PreviewAnchors.tsx  editor-preview integration — never edited
```

See `AGENTS.md` and `GROUNDING.md` for the API reference and how to author scenes.

## Develop

```
pnpm install
pnpm dev          # esbuild dev server on localhost:5173 (output in .dev/)
pnpm preview      # on-device preview over a secure tunnel (needs `vincentt login`)
pnpm typecheck
pnpm build        # production bundle to dist/
```

## Release

`vincentt init` scaffolds from the **`latest` tag**, not from `main`. Merging to `main` does
not ship a template to creators — cutting a release does.

```
git tag 1.1.0 <sha>      # bare semver, no `v` prefix
git push origin 1.1.0    # the Release workflow verifies the tag, then moves `latest`
```

The Release workflow (`.github/workflows/release.yml`) installs from the frozen lockfile,
builds, and typechecks **the tagged tree** before force-updating `latest` to it. A tag that
fails leaves `latest` where it was, so a broken release cannot reach a new creator.

The job runs in the `release` environment, which accepts bare-semver tags only. To re-run it by
hand, dispatch it from the tag itself ("Use workflow from: 1.1.0"); a dispatch from `main` is
refused.

**Never move `latest` by hand.** It is force-updated by that workflow and nowhere else; moving
it manually decouples the pointer from the version it claims to be.

Creators can pin a specific version — `vincentt init --template 1.0.0` — which is the escape
hatch when a release turns out to be bad. That is why the version tags are immutable and only
`latest` moves.

### `MIGRATION.md` and the platform release row

Root `MIGRATION.md` carries one entry per released tag, newest first, authored in the same
PR as the change: `required: true|false`, a one-line summary, and optional notes bullets.
`required: false` means no consumer action is needed, never that the entry was skipped. The
Release workflow refuses to move `latest` for a tag with no valid entry, then — once `latest`
has moved — posts that entry as this release's row to the platform (`POST
/platform/releases`, component `template`), via `scripts/release-row.mjs`. Both steps read
`MIGRATION.md` from `main`, not from the tagged tree: the note is reviewed via PR into `main`
and is append-only per version, so `main`'s copy is the reviewed source for any tag, including
one cut before this file existed. That row is what `vincentt outdated` reads back to tell a
creator's agent what changed and what to do about it.
