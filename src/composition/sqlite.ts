/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:21:43.353Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { SqliteDatabaseService } from "../application/sqlite/SqliteDatabaseService.js";
import { SqliteDatabaseProvider } from "../sqlite/SqliteDatabaseProvider.js";

/** Compose local snapshot inspection without opening a native analysis provider. */
export const createSqliteDatabaseService = (
  environment: Readonly<NodeJS.ProcessEnv> = process.env,
): SqliteDatabaseService =>
  new SqliteDatabaseService(new SqliteDatabaseProvider(environment));
