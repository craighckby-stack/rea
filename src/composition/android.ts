/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:08.009Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { AndroidAnalysisPort } from "../application/android/AndroidAnalysisPort.js";
import type { JadxLauncher } from "../android/JadxMcpTransport.js";
import { JadxProvider } from "../android/JadxProvider.js";

/** Construct one APK provider with its own queue and cleanup-failure state. */
export const createAndroidAnalysisProvider = (
  environment: Readonly<Record<string, string | undefined>> = process.env,
  launcher?: JadxLauncher,
): AndroidAnalysisPort => new JadxProvider(environment, launcher);
