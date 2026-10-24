/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:22.658Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { BrowserObservationPort } from "../application/BrowserObservationPort.js";
import { CdpBrowserProvider } from "../browser/CdpBrowserProvider.js";

/** Construct a fresh provider without opening a target or acquiring an engine. */
export const createBrowserObservationProvider = (): BrowserObservationPort =>
  new CdpBrowserProvider();
