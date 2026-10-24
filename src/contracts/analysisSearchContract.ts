/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:22:47.700Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { z } from "zod";

/** Shared provider search input fields. */
export const analysisSearchInput = {
  pattern: z
    .string()
    .min(1)
    .describe("The literal text or regex pattern to search for"),
  mode: z.enum(["literal", "regex"]).default("literal"),
  case_sensitive: z.boolean().default(false).describe("Whether to match case"),
  document: z.string().optional().describe("The document name"),
};
