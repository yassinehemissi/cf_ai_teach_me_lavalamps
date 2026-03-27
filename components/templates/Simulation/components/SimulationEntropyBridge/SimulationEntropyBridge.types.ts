import type { EntropyCaptureAction } from "../../SimulationEntropy.types";

export type SimulationEntropyBridgeProps = {
  onCaptureActionReady: (action: EntropyCaptureAction | null) => void;
};

