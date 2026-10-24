/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:43:24.551Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { CallRelationshipDirection } from "../contracts/enhancedInputs.js";
import type { AnalysisOperation } from "./AnalysisProvider.js";

/** The provider read and response relation for each supported traversal direction. */
export const CALL_RELATIONSHIP_TRAVERSALS = {
  forward: { operation: "procedure_callees", relation: "callees" },
  backward: { operation: "procedure_callers", relation: "callers" },
} as const satisfies Readonly<
  Record<
    CallRelationshipDirection,
    {
      readonly operation: AnalysisOperation;
      readonly relation: "callees" | "callers";
    }
  >
>;
