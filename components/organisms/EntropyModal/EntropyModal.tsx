"use client";

import Image from "next/image";

import { MetricCard } from "./components/MetricCard/MetricCard";
import { StageCard } from "./components/StageCard/StageCard";
import { TimingPill } from "./components/TimingPill/TimingPill";
import type { EntropyModalProps } from "./EntropyModal.types";
import { useEntropyModalState } from "./EntropyModal.state";

export function EntropyModal({
  error,
  isOpen,
  onClose,
  phase,
  summary,
}: EntropyModalProps) {
  const {
    closeFrameDetails,
    openFrameDetails,
    selectedFrame,
  } = useEntropyModalState(isOpen, summary);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-6 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-700 bg-stone-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
              Entropy Extraction
            </p>
            <h2 className="mt-2 text-xl text-stone-100">
              Screenshot Pipeline Result
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              closeFrameDetails();
              onClose();
            }}
            className="rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-200 transition hover:border-stone-500"
          >
            Close
          </button>
        </div>
        <div className="max-h-[78vh] space-y-6 overflow-y-auto px-6 py-6">
          <section className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
              Status
            </p>
            <p className="mt-3 text-sm text-stone-200">
              {phase === "capturing" && "Capturing the current scene into a PNG data URI."}
              {phase === "processing" && "Running resize, RGBA extraction, timing-noise sampling, pool composition, and SHA-256 whitening."}
              {phase === "success" && "Entropy extraction completed successfully."}
              {phase === "error" && (error ?? "Entropy extraction failed.")}
              {phase === "idle" && "Waiting for entropy extraction to start."}
            </p>
          </section>

          {summary ? (
            <>
              <section className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                  Ranked Steps
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <StageCard
                    rank={1}
                    title="Frame Capture"
                    lines={[
                      `Frames processed: ${summary.aggregate.frameCount}`,
                      "Capture a PNG screenshot for each requested frame.",
                    ]}
                  />
                  <StageCard
                    rank={2}
                    title="Per-Frame Extraction"
                    lines={[
                      `Total external demo bytes: ${summary.aggregate.totalExternalEntropyBytesLength.toLocaleString()}`,
                      `Total lava bytes: ${summary.aggregate.totalLavaBytesLength.toLocaleString()}`,
                      "Each frame is resized, flattened to RGBA, and mixed with timing/demo entropy.",
                    ]}
                  />
                  <StageCard
                    rank={3}
                    title="Final Concatenation"
                    lines={[
                      `Final pool bytes: ${summary.aggregate.finalPoolByteLength.toLocaleString()}`,
                      `Final digest bytes: ${summary.aggregate.finalDigestByteLength}`,
                      "Concatenate all frame pools and hash them one final time.",
                    ]}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                  Final Result
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Final Pool Bytes"
                    value={summary.aggregate.finalPoolByteLength.toLocaleString()}
                  />
                  <MetricCard
                    label="Final Digest Bytes"
                    value={String(summary.aggregate.finalDigestByteLength)}
                  />
                  <MetricCard
                    label="Frames"
                    value={String(summary.aggregate.frameCount)}
                  />
                </div>
                <div className="mt-4 rounded-2xl border border-stone-800 bg-stone-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Final SHA-256
                  </p>
                  <p className="mt-3 break-all font-mono text-sm text-amber-200">
                    {summary.aggregate.finalDigestHex}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                      Captured Frames
                    </p>
                    <p className="mt-2 text-sm text-stone-300">
                      Click any frame to inspect its step details.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                  {summary.frames.map((frame) => (
                    <button
                      key={frame.capture.frameIndex}
                      type="button"
                      onClick={() => openFrameDetails(frame.capture.frameIndex)}
                      className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-950/80 text-left transition hover:border-amber-400"
                    >
                      <div className="relative aspect-video w-full">
                        <Image
                          src={frame.capture.screenshotDataUri}
                          alt={`Captured simulation screenshot frame ${frame.capture.frameIndex + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                            Frame {frame.capture.frameIndex + 1}
                          </p>
                          <p className="mt-1 text-sm text-stone-200">
                            Source {frame.resize.sourceWidth} x {frame.resize.sourceHeight} · Resized {frame.resize.width} x {frame.resize.height}
                          </p>
                        </div>
                        <div className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                          Open Details
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
      {selectedFrame ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-6 py-10">
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-stone-700 bg-stone-950 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-stone-800 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                  Frame Details
                </p>
                <h3 className="mt-2 text-xl text-stone-100">
                  Frame {selectedFrame.capture.frameIndex + 1} Worker Stages
                </h3>
              </div>
              <button
                type="button"
                onClick={closeFrameDetails}
                className="rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-200 transition hover:border-stone-500"
              >
                Close
              </button>
            </div>
            <div className="max-h-[78vh] space-y-6 overflow-y-auto px-6 py-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-stone-800 bg-stone-950/80">
                <Image
                  src={selectedFrame.capture.screenshotDataUri}
                  alt={`Captured simulation screenshot frame ${selectedFrame.capture.frameIndex + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <StageCard
                  rank={1}
                  title="Capture"
                  lines={[
                    `MIME type: ${selectedFrame.capture.mimeType}`,
                    `PNG data URI length: ${selectedFrame.capture.dataUriLength.toLocaleString()} chars`,
                  ]}
                />
                <StageCard
                  rank={2}
                  title="Resize"
                  lines={[
                    `Source: ${selectedFrame.resize.sourceWidth} x ${selectedFrame.resize.sourceHeight}`,
                    `Resized: ${selectedFrame.resize.width} x ${selectedFrame.resize.height}`,
                  ]}
                />
                <StageCard
                  rank={3}
                  title="RGBA Tensor"
                  lines={[
                    `Shape: [${selectedFrame.rgba.shape.join(", ")}]`,
                    `Flattened bytes: ${selectedFrame.rgba.byteLength.toLocaleString()}`,
                    `Preview: ${selectedFrame.rgba.previewHex}`,
                  ]}
                />
                <StageCard
                  rank={4}
                  title="Timing Noise"
                  lines={[
                    `Timing bytes: ${selectedFrame.timingNoise.byteLength.toLocaleString()}`,
                    `Preview: ${selectedFrame.timingNoise.previewHex}`,
                  ]}
                />
                <StageCard
                  rank={5}
                  title="Entropy Pool"
                  lines={[
                    `Combined bytes: ${selectedFrame.pool.byteLength.toLocaleString()}`,
                    `Lava bytes: ${selectedFrame.pool.lavaBytesLength.toLocaleString()}`,
                    `External bytes: ${selectedFrame.externalEntropy.byteLength.toLocaleString()}`,
                    `Preview: ${selectedFrame.pool.previewHex}`,
                  ]}
                />
                <StageCard
                  rank={6}
                  title="SHA-256"
                  lines={[
                    `Digest bytes: ${selectedFrame.digest.byteLength}`,
                    `Whitening: ${selectedFrame.digest.whiteningStrategy}`,
                    `Supplemental only: ${selectedFrame.digest.supplementalEntropyOnly ? "yes" : "no"}`,
                    `Hex: ${selectedFrame.digest.hex}`,
                  ]}
                />
              </section>
              <div className="grid gap-3 md:grid-cols-3">
                <TimingPill
                  label="Decode data URI"
                  value={selectedFrame.timingsMs.decodeDataUriMs}
                />
                <TimingPill
                  label="Create bitmap"
                  value={selectedFrame.timingsMs.createBitmapMs}
                />
                <TimingPill
                  label="Resize image"
                  value={selectedFrame.timingsMs.resizeImageMs}
                />
                <TimingPill
                  label="Extract RGBA"
                  value={selectedFrame.timingsMs.extractRgbaMs}
                />
                <TimingPill
                  label="Hash pool"
                  value={selectedFrame.timingsMs.hashPoolMs}
                />
                <TimingPill label="Total" value={selectedFrame.timingsMs.totalMs} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
