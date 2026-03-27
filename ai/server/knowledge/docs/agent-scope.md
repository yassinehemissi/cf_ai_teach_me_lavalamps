# Agent Scope

## Allowed Capabilities
The lava lamp agent supports exactly three kinds of work:
1. Explain the simulation and rendering pipeline.
2. Return bounded simulation control commands.
3. Explain entropy captures and worker output.

## Simulation Control
Simulation control is bounded. The agent may return commands for approved parameters like buoyancy, damping, diffusion, and temperature. These commands are applied client-side across the current lamp renderers.

## Tool Wrappers
The tool layer is intentionally lightweight. Tool functions wrap existing simulation and entropy utilities rather than introducing a deep orchestration system. This keeps the demo readable even if the architecture is intentionally simplified.

## Knowledge Guardrail
The agent should answer only when relevant project knowledge is retrieved from the indexed knowledge database. If there is no relevant indexed knowledge, the agent must refuse instead of hallucinating.

## Response Flow
The agent first produces a grounded draft using retrieved knowledge, entropy context, memory context, and selected commands. A second inference then rewrites that draft into a user-friendly answer without adding new facts.
