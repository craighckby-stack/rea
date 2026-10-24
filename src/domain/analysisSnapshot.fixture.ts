/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:27:23.225Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { createAnalysisProfile } from "./analysisProfile.js";
import type { BinaryTarget } from "./binaryTargetTypes.js";

/** Immutable target shared by analysis-snapshot contract tests. */
export const ANALYSIS_SNAPSHOT_TARGET: BinaryTarget = {
  path: "/tmp/app",
  sha256: "a".repeat(64),
  kind: "executable",
  format: "mach-o",
  architecture: "arm64",
  availableArchitectures: ["arm64"],
};

/** Provider identity shared by analysis-snapshot contract tests. */
export const ANALYSIS_SNAPSHOT_PROVIDER = {
  id: "fixture",
  name: "Fixture",
  version: "1",
} as const;

/** Exact analysis profile shared by analysis-snapshot contract tests. */
export const ANALYSIS_SNAPSHOT_PROFILE = createAnalysisProfile(
  ANALYSIS_SNAPSHOT_PROVIDER,
  { loader: "mach-o-arm64" },
);
