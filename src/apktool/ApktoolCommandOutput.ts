/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:39:44.153Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { OwnedCommandFailure } from "../process/OwnedCommand.js";
import { DarwinProcessOwnershipInspectionError } from "../process/DarwinProcessRunTokenReader.js";
import type { AnalysisCapturedOutput } from "../domain/analysisErrorBase.js";
import type { ProviderProcessSnapshot } from "../process/ProviderProcess.js";

/** Project the command owner's bounded output without losing examined byte counts. */
const capturedApktoolCommandOutput = (
  output: ProviderProcessSnapshot,
): AnalysisCapturedOutput => ({
  stdout: output.stdout.text,
  stderr: output.stderr.text,
  truncated:
    output.diagnosticTruncated === true || output.outputIncomplete === true,
  stdout_bytes: output.stdout.observedBytes,
  stderr_bytes: output.stderr.observedBytes,
  exit_code: output.exitCode ?? null,
  signal: output.signal ?? null,
});

/** The command owner selects command output or preparation output, once. */
export const capturedApktoolFailureOutput = (
  cause: unknown,
): AnalysisCapturedOutput | undefined => {
  if (cause instanceof OwnedCommandFailure)
    return cause.snapshot === null
      ? cause.preparationFailure?.capturedOutput
      : capturedApktoolCommandOutput(cause.snapshot);
  return cause instanceof DarwinProcessOwnershipInspectionError
    ? cause.capturedOutput
    : undefined;
};
