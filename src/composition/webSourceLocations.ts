/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:22:00.171Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { WebSourceLocationService } from "../application/WebSourceLocationService.js";
import { LocalWebSourceLocationArtifacts } from "../browser/assets/WebSourceLocationArtifacts.js";
import { SourceMapDecoder } from "../javascript/sourceMaps/SourceMapDecoder.js";

/** Compose local source/map analysis without import-time reads or process acquisition. */
export const createWebSourceLocationService = (
  environment: Readonly<NodeJS.ProcessEnv> = process.env,
): WebSourceLocationService =>
  new WebSourceLocationService(
    new LocalWebSourceLocationArtifacts(),
    new SourceMapDecoder({ environment }),
  );
