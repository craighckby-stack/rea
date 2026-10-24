/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:23:42.721Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

/** Canonical Evidence selection contracts are owned by the domain. */
export {
  evidenceInputSchema,
  type EvidenceInput,
} from "../domain/evidenceReference.js";
