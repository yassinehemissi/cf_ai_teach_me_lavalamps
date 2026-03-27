# Entropy Pipeline

## Overview
The entropy workflow is a demo pipeline that captures the current simulation scene, resizes the image, extracts RGBA bytes, mixes in timing noise and demo external entropy, and hashes the result with SHA-256.

## Screenshot Capture
The renderer uses `preserveDrawingBuffer` and a render-aware capture path. The current scene is forced through a fresh render before the PNG data URI is produced.

## Worker Processing
The entropy worker receives a PNG data URI and performs the following steps:
1. Decode the image.
2. Resize it to a smaller target resolution for cost control.
3. Extract a flattened `H x W x 4` RGBA byte tensor.
4. Collect timing noise around decode, draw, resize, readback, and hash steps.
5. Mix optional lava-derived bytes and demo external entropy.
6. Hash the combined pool with SHA-256.

## Output
Each frame returns:
- source dimensions
- resized dimensions
- RGBA byte length
- timing noise byte length
- entropy pool byte length
- SHA-256 digest bytes and hex

Across multiple frames, the system concatenates the per-frame pools and hashes the aggregate again to produce a final digest.

## Security Note
This is supplemental entropy extraction for demonstration. It is not a production cryptographic random source by itself. The workflow uses hashing as a whitening step, but it should not be presented as a standalone secure entropy generator.

## Agent Scope
The agent can trigger an entropy capture, explain the steps, and interpret the per-frame and aggregate outputs in demo terms.
