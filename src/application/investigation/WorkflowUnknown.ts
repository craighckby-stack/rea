/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:56:10.078Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import {
  recordUnknownInputSchema,
  type RecordUnknownInput,
} from "../../domain/residualUnknown.js";
import { err, ok, type Result } from "../../domain/result.js";
import { UnknownRegistryError } from "../../domain/unknownRegistryError.js";

/** Scope an automatic question to its immutable result before registry mutation. */
export const workflowUnknownInput = (
  evidenceId: string,
  input: Omit<
    RecordUnknownInput,
    "supporting_evidence_ids" | "contradicting_evidence_ids"
  >,
): Result<RecordUnknownInput, UnknownRegistryError> => {
  const question = recordUnknownInputSchema.shape.question.safeParse(
    input.question,
  );
  if (!question.success)
    return err(
      new UnknownRegistryError("invalid-transition", { cause: question.error }),
    );
  return ok({
    ...input,
    question: `${question.data} (Evidence ${evidenceId})`,
    supporting_evidence_ids: [evidenceId],
    contradicting_evidence_ids: [],
  });
};
