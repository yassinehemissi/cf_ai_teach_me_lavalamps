export async function buildDemoExternalEntropyBytes(frameIndex: number) {
  const randomSamples = Array.from({ length: 16 }, () => Math.random());
  const now = Date.now();
  const perfNow = performance.now();
  const buffer = new ArrayBuffer((randomSamples.length + 3) * Float64Array.BYTES_PER_ELEMENT);
  const view = new DataView(buffer);

  randomSamples.forEach((sample, index) => {
    view.setFloat64(index * Float64Array.BYTES_PER_ELEMENT, sample, true);
  });

  view.setFloat64(randomSamples.length * Float64Array.BYTES_PER_ELEMENT, now, true);
  view.setFloat64((randomSamples.length + 1) * Float64Array.BYTES_PER_ELEMENT, perfNow, true);
  view.setFloat64((randomSamples.length + 2) * Float64Array.BYTES_PER_ELEMENT, frameIndex, true);

  return buffer;
}

export function concatArrayBuffers(buffers: ArrayBuffer[]) {
  const totalLength = buffers.reduce(
    (length, buffer) => length + buffer.byteLength,
    0,
  );
  const output = new Uint8Array(totalLength);

  let offset = 0;

  buffers.forEach((buffer) => {
    const bytes = new Uint8Array(buffer);
    output.set(bytes, offset);
    offset += bytes.byteLength;
  });

  return output;
}

export async function hashArrayBuffer(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return {
    byteLength: digest.byteLength,
    buffer: digest,
    hex: Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join(""),
  };
}

export async function waitForNextFrame() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}
