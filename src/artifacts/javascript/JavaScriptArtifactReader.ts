/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:06:39.922Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { AsarArtifactReader } from "../AsarArtifactReader.js";
import type { ArtifactReader } from "../ArtifactReader.js";
import { DirectoryArtifactReader } from "../DirectoryArtifactReader.js";

/** Create the reader for an admitted JavaScript artifact format. */
export const createJavaScriptArtifactReader = (
  path: string,
  format: "asar" | "directory",
): ArtifactReader =>
  format === "asar"
    ? new AsarArtifactReader(path)
    : new DirectoryArtifactReader(path);
