/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:42:46.765Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { expect, it } from "vitest";

import { createAnalysisExecution } from "./AnalysisProvider.js";

const PROVIDER = { id: "fixture", name: "Fixture", version: "1" };

it("records no raw result unless the provider supplies a distinct one", () => {
  const result = { entries: [{ value: "normalized" }] };

  expect(createAnalysisExecution(result, PROVIDER)).toMatchObject({
    result,
    rawResult: null,
  });
  expect(
    createAnalysisExecution(result, PROVIDER, {
      rawResult: { stdout: "raw" },
    }).rawResult,
  ).toEqual({ stdout: "raw" });
  expect(
    createAnalysisExecution(result, PROVIDER, { rawResult: null }).rawResult,
  ).toBeNull();
});
