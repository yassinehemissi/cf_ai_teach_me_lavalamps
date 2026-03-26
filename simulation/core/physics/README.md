# Physics Engine

This module contains the core lava-lamp simulation logic.

It is intentionally scoped to simulation only:

- no React code
- no Three.js scene wiring
- no Marching Cubes integration
- no GLB masking pipeline yet

The current engine updates a set of thermally-driven blobs over time and rebuilds a scalar field suitable for later surface extraction.

## Purpose

The engine exists to simulate a simplified lava-lamp behavior for an interactive demo.

The model is not intended for research-grade fluid simulation. It uses a blob-based approximation with:

- temperature evolution
- buoyancy
- gravity
- drag
- soft boundary response
- fixed-step integration
- inverse-square scalar field blending

This keeps the system stable, cheap to compute, and easy to expose through higher-level agent controls later.

## Module Layout

- `PhysicsSimulator.ts`
  Main orchestrator class. Owns config, blob state, timestep accumulation, and field snapshots.
- `PhysicsSimulator.types.ts`
  Public and internal types for blobs, config, bounds, field resolution, and snapshots.
- `utils/physicsSimulatorConfig.ts`
  Config validation, guardrail construction, bounds cloning, and field sizing helpers.
- `utils/physicsSimulatorState.ts`
  Conversion between plain serializable blob state and internal `Vector3`-based state.
- `utils/physicsSimulatorTimeStep.ts`
  One fixed simulation step: temperature update, force accumulation, integration, and boundary projection.
- `utils/physicsSimulatorField.ts`
  Scalar field rebuild over a grid for later Marching Cubes extraction.

## Core Model

Each blob represents a local mass of lava-like material.

Each blob stores:

- `position`
- `velocity`
- `temperature`
- `influenceRadius`
- `strength`
- `mass`

The engine advances all blobs with a fixed timestep and then rebuilds the scalar field from the new blob positions.

## Time Integration

The simulator uses a fixed timestep by default:

- `dt = 1000 / 120 ms`
- equivalent to `1 / 120 s`

Why fixed-step:

- more stable than variable-frame integration
- predictable across different machines
- easier to reason about when exposed to agent tools

The simulator accumulates incoming real frame time and runs up to a bounded number of substeps each update:

- default `maxSubsteps = 8`

This avoids runaway catch-up work on slow frames.

## Simulation Pipeline

Each fixed step follows this order:

1. Compute the average blob temperature.
2. Update each blob temperature.
3. Compute total force on each blob.
4. Convert force to acceleration with Newton's law.
5. Update velocity.
6. Update position.
7. Project blobs back inside the allowed boundary if necessary.
8. After all fixed steps, rebuild the scalar field.

This keeps the pipeline deterministic and easy to split into later render adapters.

## Temperature Evolution

Temperature uses a simplified differential form:

`dT/dt = H_global - k_cool * (T - T_ambient) - k_diff * (T - T_avg)`

Where:

- `H_global`
  Constant global heating term for the current simplified model.
- `k_cool`
  Cooling rate toward ambient temperature.
- `T_ambient`
  Ambient temperature baseline.
- `k_diff`
  Cheap diffusion term toward the average blob temperature.
- `T_avg`
  Average temperature of all blobs.

This is not a full heat equation. It is a low-cost approximation chosen for visual control and stable demo behavior.

## Forces

### Buoyancy

Buoyancy is modeled from the blob temperature difference against ambient:

`F_buoyancy = m * beta * (T - T_ambient) * g * yHat`

Meaning:

- hotter blobs rise
- cooler blobs lose upward lift
- `beta` is the buoyancy sensitivity

### Gravity

Gravity is the standard downward force:

`F_gravity = -m * g * yHat`

### Drag

Linear drag is used to reduce chaotic motion:

`F_drag = -c_drag * v`

Linear drag was chosen over quadratic drag for stability and simplicity in the first implementation.

### Boundary Force

The boundary force is a soft inward correction near the simulation volume walls.

For each axis:

- no force when the blob is safely inside the volume
- spring-like inward push when the blob gets too close to a wall
- damping against outward velocity near that wall

Conceptually:

`F_boundary = spring_term + damping_term`

This avoids abrupt hard bounces while still keeping the motion contained.

## Position and Velocity Update

The engine uses semi-implicit Euler integration:

`a = F / m`

`v_next = v + a * dt`

`x_next = x + v_next * dt`

This is more stable than explicit Euler for this kind of lightweight physically-inspired system.

## Hard Boundary Safety Projection

After integration, the engine performs a hard safety clamp:

- positions are clamped back into the boundary volume
- outward velocity on a clamped axis is zeroed

Why this exists:

- the soft boundary force improves motion quality
- the hard projection guarantees blobs cannot drift permanently outside bounds

This is especially useful before the future lamp-mask step exists.

## Scalar Field Construction

After the blob update, the engine rebuilds a scalar field over a 3D grid.

Each blob contributes:

`phi_i(p) = strength_i / (||p - x_i||^2 + epsilon)`

With:

- `p`
  current grid point
- `x_i`
  blob center
- `strength_i`
  blob field contribution strength
- `epsilon`
  small stabilization constant to avoid division by zero and create soft blending

The total scalar field is:

`phi(p) = sum_i phi_i(p)`

The current implementation also applies an influence-radius cutoff:

- if a point lies outside the blob influence radius, that blob contributes `0`

This keeps field generation cheaper and more locally controllable.

## Field Mask Hook

The field config supports an optional mask callback:

- if the mask rejects a grid point, that field cell is set to `0`

This is the extension point for the future lamp interior mask generated from the GLB geometry.

At the moment:

- the hook exists
- the mesh-derived mask pipeline is not implemented yet

## Public API

### `constructor(placement, config)`

Creates a simulator instance at a given world placement and initializes blob state and the scalar field.

### `reset()`

Restores the initial blob state and rebuilds the field.

### `step(input)`

Consumes frame delta time, accumulates it, runs fixed substeps, and rebuilds the field if at least one substep ran.

### `setParameter(update)`

Updates a small approved parameter surface with guardrail clamping.

Currently supported keys:

- `diffusion`
- `buoyancy`
- `damping`
- `temperature`

### `getBlobStates()`

Returns plain serializable blob snapshots.

### `getFieldSnapshot()`

Returns the current scalar field values, bounds, and resolution.

### `getFixedDeltaTimeMs()`

Returns the configured fixed timestep in milliseconds.

## Config Overview

### `initialBlobs`

The initial blob definitions used for reset and startup.

### `field`

Defines:

- simulation field bounds
- grid resolution
- epsilon
- optional mask callback

### `boundary`

Defines:

- min and max bounds
- soft boundary margin
- soft boundary stiffness
- soft boundary damping

### `temperature`

Defines:

- ambient temperature
- global heating
- cooling rate
- diffusion rate

### `forces`

Defines:

- gravity
- buoyancy beta
- drag coefficient

### `time`

Optional overrides for:

- fixed delta time
- maximum substeps

### `guardrails`

Optional clamping ranges for the agent-exposed parameter controls.

## Current Assumptions

- global heating is uniform
- mass is uniform by default unless specified per blob
- boundaries are axis-aligned
- scalar field resolution is regular on each axis
- the lamp mesh mask is not yet active
- there is no blob-to-blob collision handling
- there is no viscosity or pressure solve

These assumptions are deliberate to keep the first implementation cheap and legible.

## Known Limitations

- The simulation volume is still an axis-aligned box, not the true lamp interior.
- Temperature diffusion is a simple average-based approximation.
- No direct coupling exists yet between the lamp GLB and the boundary force.
- No rendering adapter exists yet for Marching Cubes or scene updates.
- No presets or test suite exist yet for tuning behavior.

## Planned Next Steps

- connect the scalar field to a rendering adapter
- introduce lamp-mesh-based masking
- optionally derive boundary behavior from the lamp geometry
- tune blob presets for visually convincing lava motion
- expose approved simulator controls through the agent tool layer

## Notes For Rendering Integration

When this engine is plugged into rendering, the recommended separation is:

- the physics engine owns blob state and scalar field values
- a render adapter converts the scalar field into a visual surface
- scene code owns materials, transforms, camera, and asset loading

That boundary matters because the same simulator should be reusable across multiple lamps without embedding renderer concerns inside the physics core.
