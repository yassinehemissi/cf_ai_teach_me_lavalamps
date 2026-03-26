import type {
  SimulationParameterUpdate,
  SimulationStepInput,
} from "../contracts/simulation.types";
import { PhysicsSimulator } from "./PhysicsSimulator";
import type { SimulationBounds } from "./PhysicsSimulator.types";
import {
  LavaLampSimulation,
  type LavaLampPlacement,
} from "./LavaLampSimulation";
import type {
  LavaLampConstraintDescriptor,
  LavaLampModelMeshNames,
  LavaLampRenderSnapshot,
  LavaLampRendererConfig,
} from "./LavaLampRenderer.types";

export class LavaLampRenderer extends LavaLampSimulation {
  static readonly DEFAULT_MODEL_ASSET_PATH = "assets/lava_lamp.glb";

  static readonly DEFAULT_MESH_NAMES: LavaLampModelMeshNames = {
    body: "Lamp Body_Material.001_0",
    glass: "Glass_Material.002_0",
    lava: "Lava_Material.003_0",
  };

  static readonly DEFAULT_INTERIOR_BOUNDS_HINT: SimulationBounds = {
    min: {
      x: -0.8894967436790466,
      y: -0.9492283463478088,
      z: -2.412358522415161,
    },
    max: {
      x: 0.64317786693573,
      y: 0.45257076621055603,
      z: 0.4475235044956207,
    },
  };

  private readonly modelAssetPath: string;
  private readonly meshNames: LavaLampModelMeshNames;
  private readonly physicsSimulator: PhysicsSimulator;
  private readonly constraintDescriptor: LavaLampConstraintDescriptor;

  constructor(placement: LavaLampPlacement, config: LavaLampRendererConfig) {
    super(placement);

    this.modelAssetPath =
      config.modelAssetPath ?? LavaLampRenderer.DEFAULT_MODEL_ASSET_PATH;
    this.meshNames = {
      ...LavaLampRenderer.DEFAULT_MESH_NAMES,
      ...config.meshNames,
    };
    this.constraintDescriptor = {
      feasible: true,
      strategy: config.constraintStrategy ?? "lava-mesh-occupancy-mask",
      interiorBoundsHint:
        config.interiorBoundsHint ??
        LavaLampRenderer.DEFAULT_INTERIOR_BOUNDS_HINT,
      notes: [
        "The GLB exposes separate body, glass, and lava meshes.",
        "The lava mesh can seed the interior liquid mask instead of approximating the whole lamp from scratch.",
        "Use the embedded lava mesh for occupancy sampling and keep the bounds hint as the fallback clip volume.",
      ],
    };
    this.physicsSimulator = new PhysicsSimulator(
      placement,
      config.simulatorConfig,
    );
  }

  reset(): void {
    this.physicsSimulator.reset();
  }

  step(input: SimulationStepInput): void {
    this.physicsSimulator.step(input);
  }

  setParameter(update: SimulationParameterUpdate): void {
    this.physicsSimulator.setParameter(update);
  }

  getPhysicsSimulator(): PhysicsSimulator {
    return this.physicsSimulator;
  }

  getModelAssetPath(): string {
    return this.modelAssetPath;
  }

  getMeshNames(): LavaLampModelMeshNames {
    return { ...this.meshNames };
  }

  getConstraintDescriptor(): LavaLampConstraintDescriptor {
    return {
      ...this.constraintDescriptor,
      interiorBoundsHint: {
        min: { ...this.constraintDescriptor.interiorBoundsHint.min },
        max: { ...this.constraintDescriptor.interiorBoundsHint.max },
      },
      notes: [...this.constraintDescriptor.notes],
    };
  }

  getRenderSnapshot(): LavaLampRenderSnapshot {
    return {
      placement: { ...this.placement },
      modelAssetPath: this.modelAssetPath,
      meshNames: this.getMeshNames(),
      blobs: this.physicsSimulator.getBlobStates(),
      field: this.physicsSimulator.getFieldSnapshot(),
      constraint: this.getConstraintDescriptor(),
    };
  }
}
