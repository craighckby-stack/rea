/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:58.351Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { JavaScriptRecoveryPort } from "../application/javascript/JavaScriptRecoveryPort.js";
import { WakaruProvider } from "../javascript/recovery/WakaruProvider.js";
import type { WakaruLauncher } from "../javascript/recovery/WakaruCommand.js";

/** Construct optional recovery without acquiring tools, processes or workspaces. */
export const createJavaScriptRecoveryProvider = (
  environment: Readonly<Record<string, string | undefined>> = process.env,
  launcher?: WakaruLauncher,
): JavaScriptRecoveryPort => new WakaruProvider(environment, launcher);
