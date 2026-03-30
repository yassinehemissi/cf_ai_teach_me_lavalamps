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
  // Provides the default model path used by renderer snapshots.
  static readonly DEFAULT_MODEL_ASSET_PATH = "assets/lava_lamp.glb";

  // Defines the mesh names expected in the lamp GLB.
  static readonly DEFAULT_MESH_NAMES: LavaLampModelMeshNames = {
    body: "Lamp Body_Material.001_0",
    glass: "Glass_Material.002_0",
    lava: "Lava_Material.003_0",
  };

  // Stores the fallback lamp interior used before mesh-derived constraints exist.
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

  // Builds a renderer facade around the physics simulator and model metadata.
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

  // Resets the underlying simulator to its initial state.
  reset(): void {
    this.physicsSimulator.reset();
  }

  // Advances the underlying simulator by one external step request.
  step(input: SimulationStepInput): void {
    this.physicsSimulator.step(input);
  }

  // Applies a guarded runtime parameter update to the underlying simulator.
  setParameter(update: SimulationParameterUpdate): void {
    this.physicsSimulator.setParameter(update);
  }

  // Returns a defensive copy of the configured mesh names.
  getMeshNames(): LavaLampModelMeshNames {
    return { ...this.meshNames };
  }

  // Returns a defensive copy of the renderer constraint metadata.
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

  // Packages the current simulation state into a render-facing snapshot.
  getRenderSnapshot(): LavaLampRenderSnapshot {
    return {
      placement: { ...this.placement },
      modelAssetPath: this.modelAssetPath,
      meshNames: this.getMeshNames(),
      field: this.physicsSimulator.getFieldSnapshot(),
      dynamics: this.physicsSimulator.getDynamicsSnapshot(),
      constraint: this.getConstraintDescriptor(),
    };
  }

  getFieldSnapshot() {
    return this.physicsSimulator.getFieldSnapshot();
  }

  getDynamicsSnapshot() {
    return this.physicsSimulator.getDynamicsSnapshot();
  }
}
