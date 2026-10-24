/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:30.347Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { DesktopApplicationService } from "../application/artifacts/DesktopApplicationService.js";
import { DesktopApplicationReader } from "../artifacts/DesktopApplicationReader.js";

/** Use the existing artifact reader and Evidence identity without a deep provider. */
export const createDesktopApplicationService = (): DesktopApplicationService =>
  new DesktopApplicationService(new DesktopApplicationReader());
