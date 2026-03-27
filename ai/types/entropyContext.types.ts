export type ChatEntropyFrameContext = {
  digestHex: string;
  frameIndex: number;
  height: number;
  rgbaByteLength: number;
  sourceHeight: number;
  sourceWidth: number;
  timingNoiseByteLength: number;
  totalTimingMs: number;
  width: number;
};

export type ChatEntropyContext = {
  aggregate: {
    finalDigestByteLength: number;
    finalDigestHex: string;
    finalPoolByteLength: number;
    frameCount: number;
    totalExternalEntropyBytesLength: number;
    totalLavaBytesLength: number;
  };
  frames: ChatEntropyFrameContext[];
};
