import type { EntropyCapturePhase, EntropyModalSummary } from "@/components/templates/Simulation/SimulationEntropy.types";

export type EntropyModalProps = {
  error: string | null;
  isOpen: boolean;
  onClose: () => void;
  phase: EntropyCapturePhase;
  summary: EntropyModalSummary | null;
};

