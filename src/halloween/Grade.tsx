// The Halloween night behind you. The camera picture is drawn just above
// App.tsx's VideoBackground (GROUNDING.md, camera effects) and split by the
// portrait mask: the room turns into a dark, cold night with a big moon
// glowing through it and fog rolling along the floor, while you stay lit,
// warmed from below as if by a jack-o'-lantern. A heavy vignette frames it
// all. Each change strikes lightning. Until the mask is ready, the whole
// picture is the night.
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { Texture } from "three";
import { usePersonMaskTexture } from "@vincentt-xr/sdk";
import { useXRCameraTexture } from "@vincentt-xr/sdk/low-level";

import { live } from "./live";
import { personMask } from "./personMask";

const NIGHT = {
  /** Room: colour kept (0 grey … 1 as is), brightness, and its tint. */
  roomSaturation: 0.25,
  roomExposure: 0.42,
  roomTint: [0.55, 0.5, 1] as const,
  /** Moon: centre (screen uv, y up), radius (uv of the width), glow colour. */
  moon: [0.72, 0.78] as const,
  moonRadius: 0.11,
  moonColor: [1, 0.86, 0.62] as const,
  /** Fog: colour, how high up the screen it reaches, drift speed. */
  fogColor: [0.58, 0.52, 0.8] as const,
  fogHeight: 0.42,
  fogSpeed: 0.035,
  /** You: brightness, and the warm light from below. */
  personExposure: 1,
  glowColor: [1, 0.45, 0.12] as const,
  glow: 0.22,
  /** Brightness left in the corners, and the corners' colour. */
  vignette: 0.12,
  vignetteColor: [0.1, 0.03, 0.16] as const,
};

/** A lightning strike `age` seconds old: two quick flickers, then a fade. */
export const lightning = (age: number) => {
  if (age < 0 || age > 1) return 0;
  if (age < 0.07) return 1;
  if (age < 0.13) return 0.15;
  if (age < 0.2) return 0.8;
  return 0.6 * Math.exp(-(age - 0.2) * 6);
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D cameraTexture;
  uniform sampler2D maskTexture;
  uniform float hasMask;
  uniform vec2 texel;
  uniform float aspect;
  uniform float time;
  uniform float roomSaturation;
  uniform float roomExposure;
  uniform vec3 roomTint;
  uniform vec2 moon;
  uniform float moonRadius;
  uniform vec3 moonColor;
  uniform vec3 fogColor;
  uniform float fogHeight;
  uniform float fogSpeed;
  uniform float personExposure;
  uniform vec3 glowColor;
  uniform float glow;
  uniform float vignette;
  uniform vec3 vignetteColor;
  uniform float flash;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  // The person, softened: a small disc blur of the mask, then a smooth step.
  float person(vec2 uv) {
    if (hasMask < 0.5) return 0.0;
    float m = texture2D(maskTexture, uv).g * 0.2;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7854;
      m += texture2D(maskTexture, uv + vec2(cos(a), sin(a)) * texel * 3.0).g * 0.1;
    }
    return smoothstep(0.35, 0.75, m);
  }

  void main() {
    vec3 cam = texture2D(cameraTexture, vUv).rgb;
    float l = dot(cam, vec3(0.299, 0.587, 0.114));
    vec2 p = vec2(vUv.x * aspect, vUv.y);

    // The room at night.
    vec3 room = mix(vec3(l), cam, roomSaturation) * roomTint * roomExposure;
    // Moon: a pale disc with a wide halo, veiled by drifting cloud.
    float d = length(p - vec2(moon.x * aspect, moon.y)) / moonRadius;
    float cloud = fbm(p * 3.0 + vec2(time * 0.02, 0.0));
    float disc = smoothstep(1.0, 0.94, d) * (0.75 + 0.25 * fbm(p * 14.0));
    float halo = exp(-d * 1.2) * 0.55;
    room += moonColor * (disc * 0.9 + halo) * (1.0 - 0.45 * cloud);
    // Fog rolling along the floor.
    vec2 fp = vec2(p.x * 2.2 + time * fogSpeed, p.y * 5.0 - time * 0.01);
    float fog = fbm(fp) * smoothstep(fogHeight, 0.0, vUv.y);
    room = mix(room, fogColor, clamp(fog * 1.7 - 0.15, 0.0, 0.9));

    // You: as the camera saw you, warmed from below.
    vec3 you = cam * personExposure;
    you += cam * glowColor * glow * smoothstep(0.55, 0.0, vUv.y) * 2.0;

    // Lightning: the room lit up cold white, you caught in it too.
    room = mix(room, cam * 1.6 + vec3(0.25, 0.3, 0.45), flash);
    you += vec3(0.55, 0.6, 0.8) * flash * 0.45;

    float m = person(vUv);
    vec3 c = mix(room, you, m);
    // Fog drifts in front of your legs too, thinner.
    c = mix(c, fogColor, clamp(fog * 0.6, 0.0, 0.5) * m);

    // Vignette: corners fall to a deep purple-black.
    vec2 v = (vUv - 0.5) * vec2(1.0, 0.85);
    float keep = mix(vignette, 1.0, smoothstep(0.75, 0.2, length(v)));
    c = mix(vignetteColor * 0.4, c, keep);
    gl_FragColor = vec4(c, 1.0);
  }
`;

export const Grade = () => {
  const cameraTexture = useXRCameraTexture();
  const { texture: maskTexture } = usePersonMaskTexture();
  const uniforms = useMemo(
    () => ({
      cameraTexture: { value: null as unknown },
      maskTexture: { value: null as unknown },
      hasMask: { value: 0 },
      texel: { value: [1 / 256, 1 / 256] },
      aspect: { value: 9 / 16 },
      time: { value: 0 },
      roomSaturation: { value: NIGHT.roomSaturation },
      roomExposure: { value: NIGHT.roomExposure },
      roomTint: { value: [...NIGHT.roomTint] },
      moon: { value: [...NIGHT.moon] },
      moonRadius: { value: NIGHT.moonRadius },
      moonColor: { value: [...NIGHT.moonColor] },
      fogColor: { value: [...NIGHT.fogColor] },
      fogHeight: { value: NIGHT.fogHeight },
      fogSpeed: { value: NIGHT.fogSpeed },
      personExposure: { value: NIGHT.personExposure },
      glowColor: { value: [...NIGHT.glowColor] },
      glow: { value: NIGHT.glow },
      vignette: { value: NIGHT.vignette },
      vignetteColor: { value: [...NIGHT.vignetteColor] },
      flash: { value: 0 },
    }),
    [],
  );
  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime;
    uniforms.flash.value = live.lastChange
      ? lightning(performance.now() / 1000 - live.lastChange)
      : 0;
    personMask.mask.value = (maskTexture as Texture | null) ?? null;
    state.gl.getDrawingBufferSize(personMask.size.value);
    uniforms.aspect.value = state.size.width / Math.max(1, state.size.height);
    const img = (maskTexture as { image?: { width?: number; height?: number } })
      ?.image;
    if (img?.width && img.height)
      uniforms.texel.value = [1 / img.width, 1 / img.height];
  });
  if (!cameraTexture) return null; // tracker / media startup and source swaps
  uniforms.cameraTexture.value = cameraTexture;
  uniforms.maskTexture.value = maskTexture ?? null;
  uniforms.hasMask.value = maskTexture ? 1 : 0;
  return (
    <mesh renderOrder={-998} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};
