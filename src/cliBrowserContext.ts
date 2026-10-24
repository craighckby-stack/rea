/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:18:33.292Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { createBrowserObservationProvider } from "./composition/browserObservation.js";
import { projectAnalysisError } from "./domain/analysisErrorProjection.js";
import type { JsonValue } from "./domain/jsonValue.js";

/** Build the passive browser provider; scope is supplied on each request. */
export const browserContext = () => ({
  provider: createBrowserObservationProvider(),
});

/** Project a browser operation failure consistently across CLI command groups. */
export const browserCliError = (
  error: Parameters<typeof projectAnalysisError>[0],
): JsonValue => ({
  error: "Browser observation failed",
  ...projectAnalysisError(error),
});
