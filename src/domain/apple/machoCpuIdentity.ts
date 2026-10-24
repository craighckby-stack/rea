/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:33:51.426Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

/** CPU subtype bits reserved for ABI/capability flags, not the base subtype. */
const CPU_SUBTYPE_CAPABILITY_MASK = 0xff000000;

/** Return the CPU subtype identity shared across capability-flag variations. */
export const machoCpuSubtypeBase = (cpuSubtype: number): number =>
  cpuSubtype & ~CPU_SUBTYPE_CAPABILITY_MASK;
