/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:37.282Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { ElectronObservationPort } from "../application/javascript/ElectronObservationPort.js";
import { CdpElectronProvider } from "../browser/CdpElectronProvider.js";

/** Construct a fresh provider without opening a target or acquiring an engine. */
export const createElectronObservationProvider = (): ElectronObservationPort =>
  new CdpElectronProvider();
