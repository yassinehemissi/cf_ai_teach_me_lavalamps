"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

import { SimulationLoading } from "@/components/templates/Simulation/components/SimulationLoading/SimulationLoading";

const DynamicSimulation = dynamic(
  () =>
    import("@/components/templates/Simulation/Simulation").then(
      (module) => module.Simulation,
    ),
  {
    loading: () => <SimulationLoading />,
    ssr: false,
  },
);

export default function SimulationPageClient() {
  return (
    <Suspense fallback={<SimulationLoading />}>
      <DynamicSimulation />
    </Suspense>
  );
}
