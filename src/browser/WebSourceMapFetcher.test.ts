/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:13:10.807Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { expect, it } from "vitest";

import { fetchWebSourceMaps } from "./WebSourceMapFetcher.js";
import { analyzeWebBundleInputSchema } from "../domain/webBundleAnalysis.js";

const input = analyzeWebBundleInputSchema.parse({
  cdp_endpoint: "http://127.0.0.1:9222",
  allowed_origins: ["http://127.0.0.1:9222"],
  target_id: "page-1",
  fetch_source_maps: true,
});

it("reports an empty selected request set without starting fetch work", async () => {
  const result = await fetchWebSourceMaps([], input, undefined, {
    fetch: async () => {
      throw new Error("No source-map request should be made");
    },
  });

  expect(result).toEqual({
    status: "not_requested",
    requested: 0,
    processed: 0,
    items: [],
  });
});

it("honors cancellation before returning an empty request set", async () => {
  const controller = new AbortController();
  const reason = new Error("cancelled before fetching");
  controller.abort(reason);

  await expect(fetchWebSourceMaps([], input, controller.signal)).rejects.toBe(
    reason,
  );
});
