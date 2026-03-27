import "server-only";

import type { AgentToolDescriptor } from "../types/agent.types";

export const AGENT_TOOL_CATALOG: AgentToolDescriptor[] = [
  {
    toolName: "explainSimulation",
    title: "Explain Simulation",
    description:
      "Explains the lava lamp physics, bounded parameters, and entropy workflow in readable language.",
    usage:
      "Use when the user asks what the simulation is doing, why a parameter matters, or how entropy extraction works.",
  },
  {
    toolName: "controlSimulation",
    title: "Control Simulation",
    description:
      "Returns bounded simulation parameter commands for diffusion, buoyancy, damping, or temperature.",
    usage:
      "Use when the user asks to change the simulation behavior without changing the solver structure.",
  },
  {
    toolName: "analyzeEntropyResult",
    title: "Analyze Entropy Result",
    description:
      "Explains screenshot entropy extraction, per-frame worker output, aggregate digests, and demo limitations.",
    usage:
      "Use when the user asks to run or interpret entropy-worker results, including frame-by-frame explanations.",
  },
];

