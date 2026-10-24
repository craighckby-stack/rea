/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:23:10.641Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { BROWSER_SCENARIO_TOOL_CONTRACTS } from "./browserScenarioToolContracts.js";
import { BROWSER_TOOL_CONTRACTS } from "./browserToolContracts.js";

/** Complete ordered browser-provider contract inventory. */
export const BROWSER_PROVIDER_TOOL_CONTRACTS = [
  ...BROWSER_TOOL_CONTRACTS,
  ...BROWSER_SCENARIO_TOOL_CONTRACTS,
] as const;
