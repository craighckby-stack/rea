/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:55:57.142Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { EvidenceBundle } from "../../domain/evidenceBundle.js";
import { AnalysisInputError } from "../../domain/analysisErrorCore.js";
import { err, ok, type Result } from "../../domain/result.js";
import {
  summarizeEvidenceBundle,
  type EvidenceBundleSummary,
  type EvidenceRecordFilters,
} from "../../domain/evidenceRecordSummary.js";

/** Select complete bundle delivery or discovery metadata without analysis payloads. */
export const inspectEvidenceBundle = (
  bundle: EvidenceBundle,
  options: {
    readonly detail: "complete" | "summary";
    readonly filters?: EvidenceRecordFilters | undefined;
  },
): Result<EvidenceBundle | EvidenceBundleSummary, AnalysisInputError> => {
  if (options.detail === "complete" && options.filters !== undefined)
    return err(
      new AnalysisInputError("get_evidence_bundle", undefined, [
        {
          path: ["filters"],
          reason: "invalid_value",
          message:
            "Record filters require detail: summary; complete returns the canonical bundle.",
          expected: "detail: summary",
        },
      ]),
    );
  return ok(
    options.detail === "summary"
      ? summarizeEvidenceBundle(bundle, options.filters)
      : bundle,
  );
};
