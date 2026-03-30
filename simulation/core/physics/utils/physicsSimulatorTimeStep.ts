import { Vector3 } from "three";

import type {
  InternalBlobState,
  PhysicsBoundaryConfig,
  PhysicsForceConfig,
  PhysicsTemperatureConfig,
  Vector3Like,
} from "../PhysicsSimulator.types";

type AdvanceBlobsArgs = {
  blobs: InternalBlobState[];
  boundaryConfig: PhysicsBoundaryConfig;
  forceConfig: PhysicsForceConfig;
  temperatureConfig: PhysicsTemperatureConfig;
  deltaTimeSeconds: number;
  simulationTimeSeconds: number;
};

// Advances every blob by one fixed simulation timestep.
export function advanceBlobs({
  blobs,
  boundaryConfig,
  forceConfig,
  temperatureConfig,
  deltaTimeSeconds,
  simulationTimeSeconds,
}: AdvanceBlobsArgs): void {
  const averageTemperature = computeAverageTemperature(
    blobs,
    temperatureConfig.ambientTemperature,
  );

  for (const blob of blobs) {
    if (blob.motion.kind === "anchored") {
      advanceAnchoredBlob(
        blob,
        boundaryConfig,
        deltaTimeSeconds,
        simulationTimeSeconds,
      );
      continue;
    }

    updateBlobTemperature(
      blob,
      averageTemperature,
      boundaryConfig,
      temperatureConfig,
      deltaTimeSeconds,
      simulationTimeSeconds,
    );

    const force = computeTotalForce(
      blob,
      boundaryConfig,
      forceConfig,
      temperatureConfig,
    );
    const acceleration = force.divideScalar(blob.mass);

    blob.velocity.addScaledVector(acceleration, deltaTimeSeconds);
    blob.position.addScaledVector(blob.velocity, deltaTimeSeconds);

    projectBlobInsideBoundary(blob, boundaryConfig);
  }
}

// Exposes the instantaneous total force for one blob without mutating state.
export function computeBlobForceSnapshot(
  blob: InternalBlobState,
  boundaryConfig: PhysicsBoundaryConfig,
  forceConfig: PhysicsForceConfig,
  temperatureConfig: PhysicsTemperatureConfig,
): Vector3 {
  if (blob.motion.kind === "anchored") {
    return new Vector3();
  }

  return computeTotalForce(
    blob,
    boundaryConfig,
    forceConfig,
    temperatureConfig,
  );
}

// Evolves one blob temperature using global heating, vertical bias, and cooling.
function updateBlobTemperature(
  blob: InternalBlobState,
  averageTemperature: number,
  boundaryConfig: PhysicsBoundaryConfig,
  temperatureConfig: PhysicsTemperatureConfig,
  deltaTimeSeconds: number,
  simulationTimeSeconds: number,
): void {
  const normalizedHeight = getNormalizedHeight(blob, boundaryConfig);
  const bottomHeat = (1 - normalizedHeight) * temperatureConfig.bottomHeatingBias;
  const topCooling =
    Math.max(
      normalizedHeight - temperatureConfig.topCoolingThreshold,
      0,
    ) * temperatureConfig.topCoolingBias;
  const stochasticHeat =
    computeStochasticThermalTerm(blob.id, simulationTimeSeconds, temperatureConfig) *
    temperatureConfig.stochasticAmplitude;
  const heatInput =
    temperatureConfig.globalHeating + bottomHeat + stochasticHeat;
  const cooling =
    (temperatureConfig.coolingRate + topCooling) *
    (blob.temperature - temperatureConfig.ambientTemperature);
  const diffusion =
    temperatureConfig.diffusionRate * (blob.temperature - averageTemperature);

  blob.temperature += (heatInput - cooling - diffusion) * deltaTimeSeconds;
}

// Sums buoyancy, gravity, drag, and boundary forces for one blob.
function computeTotalForce(
  blob: InternalBlobState,
  boundaryConfig: PhysicsBoundaryConfig,
  forceConfig: PhysicsForceConfig,
  temperatureConfig: PhysicsTemperatureConfig,
): Vector3 {
  const buoyancyForce = computeBuoyancyForce(
    blob,
    forceConfig,
    temperatureConfig.ambientTemperature,
  );
  const gravityForce = computeGravityForce(blob, forceConfig.gravity);
  const dragForce = blob.velocity
    .clone()
    .multiplyScalar(-forceConfig.dragCoefficient);
  const boundaryForce = computeBoundaryForce(blob, boundaryConfig);

  return buoyancyForce.add(gravityForce).add(dragForce).add(boundaryForce);
}

// Computes the buoyancy force from temperature delta relative to ambient.
function computeBuoyancyForce(
  blob: InternalBlobState,
  forceConfig: PhysicsForceConfig,
  ambientTemperature: number,
): Vector3 {
  const temperatureDelta = blob.temperature - ambientTemperature;
  const yForce =
    blob.mass *
    forceConfig.buoyancyBeta *
    temperatureDelta *
    forceConfig.gravity;

  return new Vector3(0, yForce, 0);
}

// Computes the downward gravity force for one blob.
function computeGravityForce(
  blob: InternalBlobState,
  gravity: number,
): Vector3 {
  return new Vector3(0, -blob.mass * gravity, 0);
}

// Pushes blobs back inside the current boundary margin with damping.
function computeBoundaryForce(
  blob: InternalBlobState,
  boundaryConfig: PhysicsBoundaryConfig,
): Vector3 {
  const force = new Vector3();
  const { min, max } = boundaryConfig.bounds;
  const axes: Array<keyof Vector3Like> = ["x", "y", "z"];

  for (const axis of axes) {
    const positionComponent = blob.position[axis];
    const velocityComponent = blob.velocity[axis];

    const distanceToMin = positionComponent - min[axis];

    if (distanceToMin < boundaryConfig.margin) {
      const penetration = boundaryConfig.margin - distanceToMin;
      let componentForce = boundaryConfig.stiffness * penetration;

      if (velocityComponent < 0) {
        componentForce += -boundaryConfig.damping * velocityComponent;
      }

      force[axis] += componentForce;
    }

    const distanceToMax = max[axis] - positionComponent;

    if (distanceToMax < boundaryConfig.margin) {
      const penetration = boundaryConfig.margin - distanceToMax;
      let componentForce = -boundaryConfig.stiffness * penetration;

      if (velocityComponent > 0) {
        componentForce += -boundaryConfig.damping * velocityComponent;
      }

      force[axis] += componentForce;
    }
  }

  return force;
}

// Projects blobs back inside hard bounds after integration drift.
function projectBlobInsideBoundary(
  blob: InternalBlobState,
  boundaryConfig: PhysicsBoundaryConfig,
): void {
  const { min, max } = boundaryConfig.bounds;
  const axes: Array<keyof Vector3Like> = ["x", "y", "z"];

  for (const axis of axes) {
    if (blob.position[axis] < min[axis]) {
      blob.position[axis] = min[axis];

      if (blob.velocity[axis] < 0) {
        blob.velocity[axis] = 0;
      }
    }

    if (blob.position[axis] > max[axis]) {
      blob.position[axis] = max[axis];

      if (blob.velocity[axis] > 0) {
        blob.velocity[axis] = 0;
      }
    }
  }
}

// Computes the mean blob temperature used for cheap diffusion behavior.
function computeAverageTemperature(
  blobs: InternalBlobState[],
  ambientTemperature: number,
): number {
  const dynamicBlobs = blobs.filter((blob) => blob.motion.kind === "dynamic");

  if (dynamicBlobs.length === 0) {
    return ambientTemperature;
  }

  const totalTemperature = dynamicBlobs.reduce(
    (sum, blob) => sum + blob.temperature,
    0,
  );

  return totalTemperature / dynamicBlobs.length;
}

// Computes normalized simulation-space height for thermal bias calculations.
function getNormalizedHeight(
  blob: InternalBlobState,
  boundaryConfig: PhysicsBoundaryConfig,
): number {
  const span = boundaryConfig.bounds.max.y - boundaryConfig.bounds.min.y;

  if (span <= 0) {
    return 0.5;
  }

  return Math.min(
    Math.max((blob.position.y - boundaryConfig.bounds.min.y) / span, 0),
    1,
  );
}

// Generates a deterministic low-frequency thermal variation per blob id.
function computeStochasticThermalTerm(
  blobId: string,
  simulationTimeSeconds: number,
  temperatureConfig: PhysicsTemperatureConfig,
): number {
  const phase = hashBlobId(blobId) * Math.PI * 2;
  const time = simulationTimeSeconds * temperatureConfig.stochasticFrequency;
  const primaryWave = Math.sin(time + phase);
  const plateauWave =
    Math.sign(primaryWave) * Math.pow(Math.abs(primaryWave), 0.42);
  const secondaryWave = Math.sin(time * 0.21 + phase * 0.63);
  const surgeWave = Math.sin(time * 0.47 - phase * 0.31);
  const torsionWave = Math.sin(time * 1.16 + phase * 1.37);

  return (
    plateauWave * 0.88 +
    secondaryWave * 0.24 +
    surgeWave * 0.17 +
    torsionWave * 0.08
  );
}

// Hashes a blob id into a stable [0, 1] phase seed.
function hashBlobId(blobId: string): number {
  let hash = 2166136261;

  for (let index = 0; index < blobId.length; index += 1) {
    hash ^= blobId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function advanceAnchoredBlob(
  blob: InternalBlobState,
  boundaryConfig: PhysicsBoundaryConfig,
  deltaTimeSeconds: number,
  simulationTimeSeconds: number,
): void {
  const nextPosition = computeAnchoredBlobPosition(
    blob,
    simulationTimeSeconds + deltaTimeSeconds,
  );

  blob.velocity
    .copy(nextPosition)
    .sub(blob.position)
    .divideScalar(Math.max(deltaTimeSeconds, 0.0001));
  blob.position.copy(nextPosition);
  projectBlobInsideBoundary(blob, boundaryConfig);
}

function computeAnchoredBlobPosition(
  blob: InternalBlobState,
  simulationTimeSeconds: number,
): Vector3 {
  if (blob.motion.kind !== "anchored") {
    return blob.position.clone();
  }

  const phase = hashBlobId(blob.id) * Math.PI * 2;
  const frequency = blob.motion.wobbleFrequency ?? 0;
  const wobbleTime = simulationTimeSeconds * frequency * Math.PI * 2;
  const wobbleAmplitude =
    blob.motion.wobbleAmplitude ?? new Vector3(0, 0, 0);

  return blob.motion.anchorPosition.clone().add(
    new Vector3(
      Math.sin(wobbleTime + phase) * wobbleAmplitude.x,
      Math.sin(wobbleTime * 0.71 - phase * 0.43) * wobbleAmplitude.y,
      Math.cos(wobbleTime * 0.87 + phase * 0.58) * wobbleAmplitude.z,
    ),
  );
}
