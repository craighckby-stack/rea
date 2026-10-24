/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:43:20.312Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { digestCanonicalValue } from "../domain/canonicalDigest.js";
import type { ProviderIdentity } from "./AnalysisProvider.js";
import type { BrowserScenario } from "../domain/browserScenario.js";
import type { BrowserScenarioCapture } from "../domain/browserScenarioCapture.js";
import {
  createEvidence,
  type Evidence,
  type EvidenceObservation,
} from "../domain/evidence.js";
import { jsonObjectSchema, jsonValueSchema } from "../domain/jsonValue.js";

const browserScenarioParameters = (
  scenario: BrowserScenario,
): EvidenceObservation["parameters"] => ({
  ...jsonObjectSchema.parse(scenario),
  scenario_sha256: digestCanonicalValue(scenario, "Browser scenario"),
});

/** Create Evidence without retaining resolved scenario secret values. */
export const createBrowserScenarioEvidence = (
  scenario: BrowserScenario,
  capture: BrowserScenarioCapture,
  provider: ProviderIdentity,
): Evidence =>
  createEvidence(undefined, provider, {
    predicateType: "rea.browser-scenario-capture",
    operation: "capture_browser_scenario",
    parameters: browserScenarioParameters(scenario),
    result: jsonValueSchema.parse(capture),
    confidence: "observed",
    authority: "controlled-replay",
    environment: {
      id: `${capture.browser.product}@${capture.browser.version}`,
      platform: "unknown",
      architecture: "unknown",
      isolation:
        capture.browser.process_ownership === "provider-owned"
          ? "process"
          : "none",
    },
    limitations: [
      ...capture.limitations,
      "Browser host platform and architecture were not observed.",
    ],
  });
