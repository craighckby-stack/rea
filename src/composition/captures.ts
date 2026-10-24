/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:27.787Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { PacketCaptureService } from "../application/captures/PacketCaptureService.js";
import { TsharkCaptureProvider } from "../captures/TsharkCaptureProvider.js";
export const createPacketCaptureService = (
  environment: Readonly<NodeJS.ProcessEnv> = process.env,
): PacketCaptureService =>
  new PacketCaptureService(new TsharkCaptureProvider(environment));
