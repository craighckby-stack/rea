/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:21:40.180Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { SignalRecordingService } from "../application/signals/SignalRecordingService.js";
import { SigrokRecordingProvider } from "../signals/SigrokRecordingProvider.js";
export const createSignalRecordingService = (
  environment: Readonly<NodeJS.ProcessEnv> = process.env,
): SignalRecordingService =>
  new SignalRecordingService(new SigrokRecordingProvider(environment));
