import type { z } from "zod";

import {
  controlSimulationToolSchema,
  runEntropyCaptureToolSchema,
} from "./tool.schema";

export type ControlSimulationToolInput = z.infer<
  typeof controlSimulationToolSchema
>;

export type RunEntropyCaptureToolInput = z.infer<
  typeof runEntropyCaptureToolSchema
>;
