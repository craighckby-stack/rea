/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:57:59.243Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { compareUnicodeCodePoints } from "../../domain/unicodeCodePointOrder.js";
import type { JavaScriptJsonModuleObservation } from "./JavaScriptArtifactAnalysisTypes.js";
import type { JavaScriptArtifactFile } from "../../domain/javascript/javascriptArtifactFiles.js";

/** Parse one approved JSON module without evaluating JavaScript or resolving imports. */
export const analyzeJavaScriptJsonModule = (
  file: JavaScriptArtifactFile,
): JavaScriptJsonModuleObservation => {
  if (!file.text.included)
    return {
      path: file.path,
      sha256: file.sha256,
      status: "unavailable",
      top_level_keys: [],
      omitted_top_level_keys: null,
      limitation: `JSON module text was unavailable: ${file.text.reason}.`,
    };
  let value: unknown;
  try {
    value = JSON.parse(file.text.value);
  } catch (cause: unknown) {
    void cause;
    return {
      path: file.path,
      sha256: file.sha256,
      status: "invalid",
      top_level_keys: [],
      omitted_top_level_keys: 0,
      limitation: "JSON module is not valid JSON.",
    };
  }
  const keys =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? Object.keys(value).sort(compareUnicodeCodePoints)
      : [];
  const retained = keys;
  return {
    path: file.path,
    sha256: file.sha256,
    status: "included",
    top_level_keys: retained,
    omitted_top_level_keys: 0,
    limitation: null,
  };
};
