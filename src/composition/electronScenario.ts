/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:39.834Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { ElectronActiveObservationPort } from "../application/javascript/ElectronActiveObservationPort.js";
import { PlaywrightElectronActiveProvider } from "../browser/PlaywrightElectronActiveProvider.js";

/** Construct a fresh provider without opening a target or acquiring an engine. */
export const createElectronScenarioProvider = (
  environment: Readonly<Record<string, string | undefined>>,
): ElectronActiveObservationPort =>
  new PlaywrightElectronActiveProvider(environment);
