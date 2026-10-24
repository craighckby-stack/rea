/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:25.148Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { BrowserScenarioCapturePort } from "../application/BrowserScenarioCapturePort.js";
import { PlaywrightBrowserScenarioProvider } from "../browser/PlaywrightBrowserScenarioProvider.js";
import { PlaywrightScenarioSession } from "../browser/PlaywrightScenarioSession.js";

/** Construct a fresh provider without opening a target or acquiring an engine. */
export const createBrowserScenarioProvider = (
  environment: Readonly<Record<string, string | undefined>>,
): BrowserScenarioCapturePort =>
  new PlaywrightBrowserScenarioProvider((scenario, options) =>
    PlaywrightScenarioSession.open(scenario, environment, options),
  );
