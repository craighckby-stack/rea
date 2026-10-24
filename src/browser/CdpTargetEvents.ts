/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:08:59.832Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { CdpEvent } from "./CdpConnection.js";
import { cdpStringValue, recordValue } from "./CdpCaptureValues.js";

/** Match ordinary session envelopes and root detachment's parameter-scoped session identity. */
export const cdpTargetEventMatches = (
  event: CdpEvent,
  sessionId: string | undefined,
): boolean => {
  if (event.method !== "Target.detachedFromTarget")
    return event.sessionId === sessionId;
  return (
    sessionId !== undefined &&
    cdpStringValue(recordValue(event.params)?.sessionId) === sessionId
  );
};
