/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:58:11.300Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { ProviderIdentity } from "../AnalysisProvider.js";
import {
  createEvidence,
  type Evidence,
  type EvidenceObservation,
} from "../../domain/evidence.js";
import type {
  JavaScriptRuntimeObservation,
  JavaScriptRuntimeTargetList,
  ListJavaScriptRuntimeTargetsInput,
  ObserveJavaScriptRuntimeInput,
} from "../../domain/javascript/javascriptRuntimeObservation.js";

type RuntimeObservationOperation =
  | "list_javascript_runtime_targets"
  | "observe_javascript_runtime";

/** Create deterministic Evidence for one passive Inspector operation. */
export const createJavaScriptRuntimeObservationEvidence = (
  operation: RuntimeObservationOperation,
  input: ListJavaScriptRuntimeTargetsInput | ObserveJavaScriptRuntimeInput,
  result: JavaScriptRuntimeTargetList | JavaScriptRuntimeObservation,
  provider: ProviderIdentity,
): Evidence =>
  createEvidence(undefined, provider, {
    predicateType:
      operation === "list_javascript_runtime_targets"
        ? "rea.javascript-runtime-target-list"
        : "rea.javascript-runtime-observation",
    operation,
    parameters: parameters(input),
    result,
    rawResult: null,
    confidence: "observed",
    authority: "external-service",
    environment: {
      id: `${result.runtime.product}@${result.runtime.protocol_version}`,
      platform: "unknown",
      architecture: "unknown",
      isolation: "none",
    },
    limitations: [
      ...result.limitations,
      "Runtime host platform and architecture were not observed.",
    ],
  });

const parameters = (
  input: ListJavaScriptRuntimeTargetsInput | ObserveJavaScriptRuntimeInput,
): EvidenceObservation["parameters"] => ({
  inspector_endpoint: input.inspector_endpoint,
  ...("target_id" in input
    ? {
        target_id: input.target_id,
        ...(input.runtime_kind === undefined
          ? {}
          : { runtime_kind: input.runtime_kind }),
        observation_ms: input.observation_ms,
      }
    : {}),
});
