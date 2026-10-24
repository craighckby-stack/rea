/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:14:15.347Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

/** Expected malformed, unsupported or oversized producer data at a historical decoder boundary. */
export class CaptureFormatError extends Error {
  constructor(
    readonly reason:
      | "format"
      | "unsupported"
      | "input-limit"
      | "expanded-limit"
      | "limit",
    message: string,
    readonly pointer = "",
    cause?: unknown,
  ) {
    super(message, cause === undefined ? undefined : { cause });
  }
}
