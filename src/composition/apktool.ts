/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:11.115Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { ApktoolResourceAnalysisPort } from "../application/apktool/ApktoolResourceAnalysisPort.js";
import { ApktoolProvider } from "../apktool/ApktoolProvider.js";

/** Construct one Apktool provider bound to the caller-selected launcher. */
export const createApktoolResourceAnalysisProvider = (
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ApktoolResourceAnalysisPort => new ApktoolProvider({ environment });
