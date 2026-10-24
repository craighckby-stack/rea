/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:55:25.021Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { AnalysisInputError } from "../../domain/analysisErrorCore.js";

/** A session ID that names no open Frida session owned by this process. */
export const unknownFridaSession = (
  operation: string,
  sessionId: string,
): AnalysisInputError =>
  new AnalysisInputError(operation, undefined, [
    {
      path: ["session_id"],
      reason: "invalid_value",
      message: `No open Frida session ${sessionId}; start one with start_frida_session.`,
    },
  ]);

/** A script ID that names no loaded script in the selected session. */
export const unknownFridaScript = (
  operation: string,
  scriptId: string,
): AnalysisInputError =>
  new AnalysisInputError(operation, undefined, [
    {
      path: ["script_id"],
      reason: "invalid_value",
      message: `No loaded Frida script ${scriptId} in this session.`,
    },
  ]);
