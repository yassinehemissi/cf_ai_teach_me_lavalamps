export type SimulationToolName =
  | "setSimulationParameter"
  | "resetSimulation";

export type SceneToolName = "focusLamp" | "orbitCamera" | "resetCamera";

export type AgentToolName = SimulationToolName | SceneToolName;

export type AgentToolCall = {
  name: AgentToolName;
  input: Record<string, unknown>;
};
