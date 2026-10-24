/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:05.405Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { AdbDeviceAnalysisPort } from "../application/adb/AdbDeviceAnalysisPort.js";
import { AdbProvider } from "../adb/AdbProvider.js";

/** Construct one ADB provider bound to the caller-selected binary. */
export const createAdbDeviceAnalysisProvider = (
  environment: Readonly<Record<string, string | undefined>> = process.env,
): AdbDeviceAnalysisPort => new AdbProvider({ environment });
