# Lava Lamp Simulation

## Overview
The lava lamp demo uses a simplified blob-based fluid model rather than research-grade fluid dynamics. The goal is a stable, controllable visual simulation for demonstration, not a physically exact Navier-Stokes solver.

## Blob State
Each blob carries position, velocity, temperature, influence radius, strength, and mass. These blobs contribute to a scalar field that is later rendered as liquid.

## Temperature Evolution
Temperature evolves through a global heating term, cooling toward ambient temperature, and stochastic thermal forcing. Bottom heating and top cooling bias are used to create a buoyant rise-and-fall effect instead of a uniform upward drift.

## Force Model
The simulation combines buoyancy, gravity, drag, and a soft boundary force.

The temperature update follows:
$$
\frac{dT}{dt} = H - k_{cool}(T - T_{ambient}) + \text{stochastic forcing}
$$

The force model follows:
$$
F = F_{buoyancy} + F_{gravity} + F_{drag} + F_{boundary}
$$

Buoyancy is driven by the difference between blob temperature and ambient temperature. Gravity pulls downward. Drag damps motion. The boundary force softly pushes blobs away from invalid lamp limits.

## Integration
The simulator uses a fixed timestep and semi-implicit Euler integration. It updates temperature first, then computes forces, then integrates velocity and position. This keeps the motion stable enough for a multi-lamp demo.

## Scalar Field
The liquid field is generated from blobs using a smooth falloff:
$$
\phi(p) = \sum_i \frac{\text{strength}_i}{\|p - x_i\|^2 + \epsilon}
$$

This gives soft blending between blob influences and avoids division by zero.

## Rendering Relationship
The physics core runs independently from rendering. The renderer consumes snapshots from the simulator and projects them into lamp-local space when needed. Marching Cubes then extracts a liquid surface from the scalar field.

## Guardrails
Agent controls may tune bounded parameters such as diffusion, buoyancy, damping, and temperature. The agent may not change the solver structure itself.
