# Coding Rules

## Workflow

- Touch only `1-2` files per edit batch.
- Keep the architecture DRY and favor reusable domain contracts over duplicated helpers.
- Log every user prompt in `PROMPTS.MD` at the repository root and append a `3` line summary of the assistant response.

## Architecture

- Keep strict boundaries between the simulation core, the scene-control layer, and the agent tool layer.
- Runtime control may only happen through explicitly callable functions with validated inputs.
- The agent may tweak bounded simulation parameters, but it may not perform fundamental runtime changes to the simulation model.
- Do not add external state management. Use React contexts and a simple command layer only.

## Simulation

- The physics simulation must be modeled with high-level OOP structures.
- Use classes for clear simulation responsibilities such as engine, field, integrator, parameter guardrails, and injectors.
- Do not force low-level render primitives, cells, or every visual concern into classes when utilities already exist.
- Use Three.js and React Three Fiber utilities directly where they are the right tool. Do not reinvent existing scene or math utilities.
- Parameter changes exposed to UI or agent tools must be guarded by bounded fractional limits so the simulation remains stable.
- Agent-facing controls may adjust perspectives on the simulation such as diffusion speed, buoyancy strength, or damping within approved bounds.

## Frontend

- Functional components must be organized with atomic design under suitable directories.
- Component files should contain TSX only.
- Each TSX component file may define only one component. If a feature needs multiple components, nest them into a local component suite with one component per file.
- Move component-local state logic into sibling `.state.ts` files when state is nontrivial or reused.
- Move component-local types into sibling `.types.ts` files when types are nontrivial or reused.
- Keep visual components thin and move orchestration into contexts, controllers, and domain modules.

## Agent Layer

- The tool surface must stay simplistic and map to clear user-intent actions.
- Tool functions may operate only on approved high-level controls such as simulation parameters, lamp presets, and camera utilities.
- The command layer must validate and clamp tool inputs before passing them into the simulation or scene layers.
