/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:44:26.022Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

/** Deep-analysis providers whose readiness can be selected explicitly by doctor. */
export const DOCTOR_PROVIDER_IDS = [
  "hopper",
  "ghidra",
  "ida",
  "jadx",
  "kuna",
] as const;
