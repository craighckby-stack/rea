/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:39:22.901Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

/** An Android checkpoint observed interruption; the caller's reason stays opaque. */
export class JadxInterruption extends Error {
  constructor(readonly reason: unknown) {
    super("Android operation interrupted", { cause: reason });
    this.name = "AbortError";
  }
}

export const throwIfJadxInterrupted = (signal?: AbortSignal): void => {
  if (signal?.aborted === true) throw new JadxInterruption(signal.reason);
};
