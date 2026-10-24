/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:07:53.527Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { BrowserObservationError } from "../domain/browserObservationError.js";
import type { BrowserObservationOperation } from "../domain/browserObservationErrors.js";

/** Preserve a producer's command rejection independently from fatal transport parsing errors. */
export class CdpCommandRejection extends BrowserObservationError {
  constructor(
    operation: BrowserObservationOperation,
    readonly command: string,
    readonly code: number | null,
    readonly reportedMessage: string | null,
  ) {
    super(operation, "protocol_error", {
      detail:
        reportedMessage === null
          ? "CDP returned a malformed command error."
          : `CDP ${command} failed (${code === null ? "unknown code" : String(code)}): ${reportedMessage}`,
    });
  }
}
