/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:45:59.952Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { AnalysisOperation } from "./AnalysisProvider.js";
import { AnalysisOutputError } from "../domain/analysisErrorCore.js";
import type { AnalysisError } from "../domain/analysisErrorBase.js";
import type { JsonValue } from "../domain/jsonValue.js";
import { err, ok, type Result } from "../domain/result.js";

type AnalysisCall = (
  operation: AnalysisOperation,
  parameters: Readonly<Record<string, JsonValue>>,
  signal?: AbortSignal,
) => Promise<Result<JsonValue, AnalysisError>>;

/** Resolve a caller selector to an observed provider procedure identity. */
export const resolveProcedureAddress = async (
  call: AnalysisCall,
  procedure: string,
  signal?: AbortSignal,
): Promise<Result<string, AnalysisError>> => {
  const result = await call("procedure_address", { procedure }, signal);
  if (!result.ok) return result;
  return typeof result.value === "string" && result.value.length > 0
    ? ok(result.value)
    : err(
        new AnalysisOutputError(
          "procedure_address",
          "provider returned no canonical procedure address",
        ),
      );
};
