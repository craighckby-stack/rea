/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:47.861Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { FlutterBuildAnalysisPort } from "../application/flutter/FlutterBuildAnalysisPort.js";
import { FlutterBuildProvider } from "../flutter/FlutterBuildProvider.js";

/** Construct one Flutter provider; it needs no external tools. */
export const createFlutterBuildAnalysisProvider =
  (): FlutterBuildAnalysisPort => new FlutterBuildProvider();
