/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:47:50.121Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { UninstallResult } from "./Uninstall.js";

/** Whether any requested REA-owned uninstall action failed. */
export const isUninstallFailure = (result: UninstallResult): boolean => {
  const status = result.status;
  switch (status) {
    case "complete":
      return false;
    case "failed":
      return true;
    default: {
      const exhaustive: never = status;
      throw new TypeError(
        `Unhandled uninstall result status: ${String(exhaustive)}`,
      );
    }
  }
};
