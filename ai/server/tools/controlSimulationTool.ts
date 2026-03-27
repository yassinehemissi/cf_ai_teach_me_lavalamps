import "server-only";

import type { SimulationCommand } from "@/ai/types/command.types";
import type { SimulationParameterKey } from "@/simulation/contracts/simulation.types";

const PARAMETER_MATCHERS: Array<{
  key: SimulationParameterKey;
  patterns: RegExp[];
}> = [
  {
    key: "buoyancy",
    patterns: [/\bbuoyancy\b/i, /\bfloat(?:ing)?\b/i],
  },
  {
    key: "diffusion",
    patterns: [/\bdiffusion\b/i, /\bspread\b/i],
  },
  {
    key: "damping",
    patterns: [/\bdamping\b/i, /\bdrag\b/i],
  },
  {
    key: "temperature",
    patterns: [/\btemperature\b/i, /\bheat(?:ing)?\b/i],
  },
];

export function buildSimulationCommand(input: string): SimulationCommand | null {
  if (!hasExplicitSimulationExecutionIntent(input)) {
    return null;
  }

  const key = inferParameterKey(input);

  if (!key) {
    return null;
  }

  const absoluteMatch = input.match(
    /\b(?:set|change)\b[\s\S]*?\b(?:to)\s+(-?\d+(?:\.\d+)?)/i,
  );

  if (absoluteMatch) {
    return {
      kind: "set-simulation-parameter",
      mode: "absolute",
      key,
      value: Number(absoluteMatch[1]),
    };
  }

  const relativeMatch = input.match(
    /\b(?:increase|decrease|raise|lower)\b[\s\S]*?\b(?:by)\s+(-?\d+(?:\.\d+)?)(%)?/i,
  );

  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const isPercent = Boolean(relativeMatch[2]);
    const sign = /\b(?:decrease|lower)\b/i.test(input) ? -1 : 1;
    const delta = isPercent ? (amount / 100) * sign : amount * sign;

    return {
      kind: "set-simulation-parameter",
      mode: "relative",
      key,
      delta,
    };
  }

  return null;
}

function inferParameterKey(input: string) {
  for (const matcher of PARAMETER_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(input))) {
      return matcher.key;
    }
  }

  return null;
}

function hasExplicitSimulationExecutionIntent(input: string) {
  if (isHypotheticalOrAnalyticalRequest(input)) {
    return false;
  }

  return /\b(set|change|increase|decrease|raise|lower|update|apply|run)\b/i.test(
    input,
  );
}

function isHypotheticalOrAnalyticalRequest(input: string) {
  return /\b(?:what if|if i|if we|would|could|should|why|how|explain|describe|tell me|analyze|analyse)\b/i.test(
    input,
  );
}
