/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:25:38.624Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { z } from "zod";
import { absoluteLocalPathStringSchema } from "../domain/localPath.js";

/** Optional expectations used to compare the live session with its caller. */
export const binarySessionInputSchema = z.strictObject({
  expected_package_version: z.string().min(1).optional(),
  expected_catalog_digest: z
    .string()
    .regex(/^[a-f0-9]{64}$/u)
    .optional(),
  expected_server_path: absoluteLocalPathStringSchema
    .describe(
      "Absolute local filesystem path expected for the running server; relative paths are rejected.",
    )
    .optional(),
});
