/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:03:40.329Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { Readable } from "node:stream";
import { expect, it } from "vitest";

import { hashReadable } from "./ArtifactHash.js";

it("preserves cancellation arriving with the final stream result", async () => {
  const controller = new AbortController();
  const reason = { stage: "source-eof" };
  const source = Readable.from(
    (async function* () {
      yield Buffer.from("complete bytes");
      controller.abort(reason);
    })(),
  );

  await expect(hashReadable(source, controller.signal)).rejects.toMatchObject({
    reason: "cancelled",
    cause: reason,
  });
});
