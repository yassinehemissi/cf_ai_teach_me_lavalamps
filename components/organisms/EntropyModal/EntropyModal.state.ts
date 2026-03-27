"use client";

import { useMemo, useState } from "react";

import type { EntropyModalSummary } from "@/components/templates/Simulation/SimulationEntropy.types";

export function useEntropyModalState(
  isOpen: boolean,
  summary: EntropyModalSummary | null,
) {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(
    null,
  );

  const selectedFrame = useMemo(() => {
    if (!isOpen || selectedFrameIndex === null || !summary) {
      return null;
    }

    return summary.frames[selectedFrameIndex] ?? null;
  }, [isOpen, selectedFrameIndex, summary]);

  return {
    closeFrameDetails: () => setSelectedFrameIndex(null),
    openFrameDetails: (frameIndex: number) => setSelectedFrameIndex(frameIndex),
    selectedFrame,
    selectedFrameIndex,
  };
}
