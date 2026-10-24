/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:59:38.665Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { ProviderIdentity } from "../AnalysisProvider.js";
import type {
  ModelArtifact,
  ModelArtifactInput,
} from "../../domain/model/modelArtifact.js";
import { createEvidence, type Evidence } from "../../domain/evidence.js";

/** One Evidence interpretation for success and observations retained by file finalization failures. */
export const createModelArtifactEvidence = (
  report: ModelArtifact,
  provider: ProviderIdentity,
  parameters: ModelArtifactInput,
): Evidence => {
  const source = report.artifact;
  return createEvidence(
    source.sha256 === null
      ? undefined
      : { path: source.path, sha256: source.sha256, format: "file" },
    provider,
    {
      operation: "inspect_model_artifact",
      parameters: { path: parameters.path, hash: parameters.hash },
      result: report,
      confidence: "observed",
      subjectUnavailableReason:
        "Full-file identity is unknown in header-only mode; normalized_result.artifact records a scoped header SHA-256 and exact source path/extent.",
      locations: [
        { kind: "artifact-path", path: source.path },
        { kind: "file-offset-range", start: 0, end: source.header_length },
      ],
      limitations: report.limitations,
    },
  );
};
