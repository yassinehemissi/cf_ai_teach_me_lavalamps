# Plan

## Phase 1: Foundations

- Establish repository rules, agent instructions, and prompt logging.
- Define the domain split between simulation, scene control, chat shell, and agent tools.
- Add the initial folder scaffold for atomic UI, contexts, simulation domain, and tool contracts.

## Phase 2: Simulation Core

- Implement a simplified lava-lamp simulation core with high-level OOP classes.
- Model bounded parameter controls for diffusion, buoyancy, damping, temperature, and injection behavior.
- Expose a stable controller API that updates the simulation without allowing runtime structural changes.

## Phase 3: Scene Integration

- Connect the simulation output to the Three.js and React Three Fiber scene.
- Build camera and environment utilities that can be driven by user input and approved agent tools.
- Keep rendering utilities separate from simulation math and controller contracts.

## Phase 4: Agent Control Layer

- Wrap approved simulation and scene controls as agent-callable tools.
- Clamp and validate all tool inputs before execution.
- Keep the command layer simple and stateless beyond what React context coordination requires.

## Phase 5: Chat Experience

- Add a fixed-position chat popup or modal above the scene with clear z-index ownership.
- Route user requests into the Cloudflare Agents wrapper and surface responses without blocking the scene.
- Keep chat UI isolated from simulation internals and call only approved tool contracts.

## Phase 6: Hardening

- Add tests around parameter guardrails, controller behavior, and tool validation.
- Verify stable behavior under repeated parameter changes and camera interactions.
- Refine presets and defaults so the demo remains legible and resilient.
