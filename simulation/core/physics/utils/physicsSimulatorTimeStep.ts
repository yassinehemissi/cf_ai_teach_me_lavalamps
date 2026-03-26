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
};

export function advanceBlobs({
  blobs,
  boundaryConfig,
  forceConfig,
  temperatureConfig,
  deltaTimeSeconds,
}: AdvanceBlobsArgs): void {
  const averageTemperature = computeAverageTemperature(
    blobs,
    temperatureConfig.ambientTemperature,
  );

  for (const blob of blobs) {
    updateBlobTemperature(
      blob,
      averageTemperature,
      temperatureConfig,
      deltaTimeSeconds,
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

function updateBlobTemperature(
  blob: InternalBlobState,
  averageTemperature: number,
  temperatureConfig: PhysicsTemperatureConfig,
  deltaTimeSeconds: number,
): void {
  const heatInput = temperatureConfig.globalHeating;
  const cooling =
    temperatureConfig.coolingRate *
    (blob.temperature - temperatureConfig.ambientTemperature);
  const diffusion =
    temperatureConfig.diffusionRate * (blob.temperature - averageTemperature);

  blob.temperature += (heatInput - cooling - diffusion) * deltaTimeSeconds;
}

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

function computeGravityForce(
  blob: InternalBlobState,
  gravity: number,
): Vector3 {
  return new Vector3(0, -blob.mass * gravity, 0);
}

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

function computeAverageTemperature(
  blobs: InternalBlobState[],
  ambientTemperature: number,
): number {
  if (blobs.length === 0) {
    return ambientTemperature;
  }

  const totalTemperature = blobs.reduce(
    (sum, blob) => sum + blob.temperature,
    0,
  );

  return totalTemperature / blobs.length;
}
