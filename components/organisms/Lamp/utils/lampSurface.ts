import {
  Color,
  DoubleSide,
  Matrix4,
  MeshPhysicalMaterial,
  type Material,
} from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";

import type { ScalarFieldSnapshot } from "@/simulation/core/PhysicsSimulator.types";
import type { CoordinateFrame } from "@/simulation/core/projections/Projection.types";
import {
  projectPointToLampLocal,
  projectVectorToLampLocal,
} from "@/simulation/core/projections/projection";

import type {
  LavaColorGradient,
  LavaSurfaceProps,
  LavaSurfaceShader,
} from "../Lamp.types";

const SURFACE_BLUR_INTENSITY = 0.035;
const SURFACE_MAX_POLY_COUNT = 9000;
const SURFACE_FIELD_GAIN = 1.35;

export const DEFAULT_LAVA_COLOR_GRADIENT: LavaColorGradient = {
  cool: "#f25d1c",
  warm: "#ff8f2f",
  hot: "#ffd36a",
};

export const SURFACE_UPDATE_INTERVAL_SECONDS = 1 / 20;

export function createMarchingCubes(
  resolution: number,
  colorGradient: LavaColorGradient,
) {
  const material = createLavaSurfaceMaterial(colorGradient);
  const effect = new MarchingCubes(
    resolution,
    material,
    false,
    false,
    SURFACE_MAX_POLY_COUNT,
  );

  effect.castShadow = true;
  effect.receiveShadow = true;
  effect.frustumCulled = false;
  effect.isolation = 80;

  return effect;
}

export function disposeMarchingCubes(marchingCubes: MarchingCubes): void {
  marchingCubes.geometry.dispose();
  (marchingCubes.material as Material).dispose();
}

export function updateMarchingCubesSurface(
  marchingCubes: MarchingCubes,
  field: LavaSurfaceProps["snapshotRef"]["current"]["field"],
  dynamics: LavaSurfaceProps["snapshotRef"]["current"]["dynamics"],
): void {
  const flowStrength = clamp(dynamics.averageForceMagnitude / 2.75, 0, 1.2);
  const heatGap = clamp(dynamics.temperatureSpread / 0.42, 0, 1.2);
  const stats = getActiveFieldStats(field.values);
  const activeSpan = Math.max(stats.max - stats.min, 0.0001);

  marchingCubes.reset();

  for (let index = 0; index < field.values.length; index += 1) {
    const sourceValue = field.values[index];

    if (sourceValue <= 0 || stats.activeCount === 0) {
      marchingCubes.field[index] = 0;
      continue;
    }

    const normalizedValue = ((sourceValue - stats.min) / activeSpan) * 100;
    const stochasticLift =
      1 +
      Math.sin(index * 0.173 + heatGap * 2.1) * 0.015 +
      flowStrength * 0.025;

    marchingCubes.field[index] = Math.max(
      0,
      normalizedValue * SURFACE_FIELD_GAIN * stochasticLift,
    );
  }

  marchingCubes.isolation = 46 - flowStrength * 3 - heatGap * 2;
  marchingCubes.blur(SURFACE_BLUR_INTENSITY);
  marchingCubes.update();
}

export function updateLavaSurfaceShader(
  material: MeshPhysicalMaterial,
  dynamics: LavaSurfaceProps["snapshotRef"]["current"]["dynamics"],
  elapsedTimeSeconds: number,
  colorGradient: LavaColorGradient,
): void {
  const shader = material.userData.shader as LavaSurfaceShader | undefined;

  if (!shader) {
    return;
  }

  shader.uniforms.uTime.value = elapsedTimeSeconds;
  shader.uniforms.uFlowStrength.value = clamp(
    dynamics.averageForceMagnitude / 2.75,
    0,
    1.2,
  );
  shader.uniforms.uHeatGap.value = clamp(
    dynamics.temperatureSpread / 0.42 +
      Math.abs(dynamics.averageVerticalVelocity) * 0.2,
    0,
    1.25,
  );
  shader.uniforms.uCoolTint.value.set(colorGradient.cool);
  shader.uniforms.uWarmTint.value.set(colorGradient.warm);
  shader.uniforms.uHotTint.value.set(colorGradient.hot);
  material.color.set(colorGradient.warm);
  material.emissive.set(colorGradient.hot);
  material.opacity = 0.72 + shader.uniforms.uHeatGap.value * 0.1;
  material.emissiveIntensity = 2.1 + shader.uniforms.uFlowStrength.value * 0.7;
}

export function applySurfaceTransform(
  marchingCubes: MarchingCubes,
  field: ScalarFieldSnapshot,
  coordinateFrame: CoordinateFrame,
): void {
  const halfSpan = {
    x: (field.bounds.max.x - field.bounds.min.x) * 0.5,
    y: (field.bounds.max.y - field.bounds.min.y) * 0.5,
    z: (field.bounds.max.z - field.bounds.min.z) * 0.5,
  };
  const center = {
    x: (field.bounds.min.x + field.bounds.max.x) * 0.5,
    y: (field.bounds.min.y + field.bounds.max.y) * 0.5,
    z: (field.bounds.min.z + field.bounds.max.z) * 0.5,
  };
  const basisX = projectVectorToLampLocal(
    { x: halfSpan.x, y: 0, z: 0 },
    coordinateFrame,
  );
  const basisY = projectVectorToLampLocal(
    { x: 0, y: halfSpan.y, z: 0 },
    coordinateFrame,
  );
  const basisZ = projectVectorToLampLocal(
    { x: 0, y: 0, z: halfSpan.z },
    coordinateFrame,
  );
  const translation = projectPointToLampLocal(center, coordinateFrame);

  marchingCubes.matrixAutoUpdate = false;
  marchingCubes.matrix.copy(
    new Matrix4().set(
      basisX.x,
      basisY.x,
      basisZ.x,
      translation.x,
      basisX.y,
      basisY.y,
      basisZ.y,
      translation.y,
      basisX.z,
      basisY.z,
      basisZ.z,
      translation.z,
      0,
      0,
      0,
      1,
    ),
  );
  marchingCubes.matrixWorldNeedsUpdate = true;
}

function createLavaSurfaceMaterial(colorGradient: LavaColorGradient) {
  const material = new MeshPhysicalMaterial({
    color: colorGradient.warm,
    emissive: colorGradient.hot,
    emissiveIntensity: 2.2,
    roughness: 0.12,
    metalness: 0.02,
    transmission: 0.22,
    thickness: 0.34,
    transparent: true,
    opacity: 0.78,
    clearcoat: 0.38,
    depthWrite: false,
    side: DoubleSide,
  });

  material.userData.shader = undefined as LavaSurfaceShader | undefined;
  material.customProgramCacheKey = () => "lamp-liquid-surface-v1";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uFlowStrength = { value: 0 };
    shader.uniforms.uHeatGap = { value: 0 };
    shader.uniforms.uCoolTint = { value: new Color(colorGradient.cool) };
    shader.uniforms.uWarmTint = { value: new Color(colorGradient.warm) };
    shader.uniforms.uHotTint = { value: new Color(colorGradient.hot) };
    material.userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSurfacePosition;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSurfacePosition = transformed;",
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "uniform float uTime;",
          "uniform float uFlowStrength;",
          "uniform float uHeatGap;",
          "uniform vec3 uCoolTint;",
          "uniform vec3 uWarmTint;",
          "uniform vec3 uHotTint;",
          "varying vec3 vSurfacePosition;",
        ].join("\n"),
      )
      .replace(
        "#include <color_fragment>",
        [
          "#include <color_fragment>",
          "float bandA = sin(vSurfacePosition.y * 11.0 + uTime * (0.45 + uFlowStrength * 1.2) + vSurfacePosition.x * 4.4);",
          "float bandB = sin((vSurfacePosition.x + vSurfacePosition.z) * 8.6 - uTime * (0.28 + uHeatGap * 0.9));",
          "float swirl = sin(length(vSurfacePosition.xz) * 12.0 - uTime * (0.52 + uFlowStrength * 0.7));",
          "float textureMix = 0.5 + bandA * 0.24 + bandB * 0.16 + swirl * 0.1;",
          "textureMix = smoothstep(0.14, 0.9, textureMix);",
          "vec3 gradientTint = mix(uCoolTint, uWarmTint, smoothstep(0.0, 0.55, textureMix));",
          "gradientTint = mix(gradientTint, uHotTint, smoothstep(0.58, 1.0, textureMix));",
          "diffuseColor.rgb = gradientTint;",
        ].join("\n"),
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "float emissiveFlow = textureMix * (0.28 + uFlowStrength * 0.32 + uHeatGap * 0.14);",
          "totalEmissiveRadiance += mix(uWarmTint, uHotTint, textureMix) * emissiveFlow;",
        ].join("\n"),
      );
  };

  return material;
}

function getActiveFieldStats(values: Float32Array) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let activeCount = 0;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value <= 0) {
      continue;
    }

    min = Math.min(min, value);
    max = Math.max(max, value);
    activeCount += 1;
  }

  if (activeCount === 0) {
    return {
      min: 0,
      max: 0,
      activeCount: 0,
    };
  }

  return {
    min,
    max,
    activeCount,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
