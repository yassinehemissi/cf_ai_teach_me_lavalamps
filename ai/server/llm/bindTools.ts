import "server-only";

import { controlSimulationTool } from "../tools/controlSimulation.tool";
import { runEntropyCaptureTool } from "../tools/runEntropyCapture.tool";
import { createCloudflareWorkersAI } from "./cloudflareWorkersAi";

export function createBoundChatModel() {
  const model = createCloudflareWorkersAI();

  if (!model.bindTools) {
    throw new Error("The configured Cloudflare chat model does not support tool binding.");
  }

  return model.bindTools([
    controlSimulationTool,
    runEntropyCaptureTool,
  ]);
}
