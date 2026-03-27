import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulation | AI Teach Me Lava Lamps",
  description:
    "Room-scale lava lamp simulation with reusable lamp instances, shared lighting, and agent-ready scene controls.",
};

export default function SimulationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
