/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:21:54.698Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { WebNetworkCaptureService } from "../application/WebNetworkCaptureService.js";
import { HistoricalCaptureDecoder } from "../browser/history/HistoricalCaptureDecoder.js";
import { NodeCaptureAdapter } from "../browser/history/NodeCaptureAdapter.js";
import { MitmproxyCaptureAdapter } from "../browser/history/MitmproxyCaptureAdapter.js";

/** Compose offline format adapters without import-time reads, installation or process startup. */
export const createWebNetworkCaptureService = (
  environment: Readonly<NodeJS.ProcessEnv> = process.env,
): WebNetworkCaptureService =>
  new WebNetworkCaptureService(
    new HistoricalCaptureDecoder(
      [
        new NodeCaptureAdapter("har"),
        new NodeCaptureAdapter("saz"),
        new NodeCaptureAdapter("qlog"),
        new MitmproxyCaptureAdapter(environment),
      ],
      environment,
    ),
  );
