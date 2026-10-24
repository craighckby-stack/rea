/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:06:45.595Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { FileHandle } from "node:fs/promises";
import {
  readFileHandleChunks,
  type FileHandleChunkOptions,
} from "../filesystem/readFileHandleChunks.js";
import { ArtifactReaderFailure } from "./ArtifactReader.js";

/** Produce artifact cancellation facts at the actual descriptor read boundary. */
export const readArtifactFileChunks = (
  handle: Pick<FileHandle, "read">,
  options: Pick<FileHandleChunkOptions, "start" | "end" | "signal"> = {},
) =>
  readFileHandleChunks(handle, {
    ...options,
    cancellationFailure: (reason) =>
      new ArtifactReaderFailure("cancelled", "Artifact file read cancelled", {
        cause: reason,
      }),
  });
