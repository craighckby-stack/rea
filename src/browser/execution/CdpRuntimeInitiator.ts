/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:13:52.946Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { WebExecution } from "../../domain/webExecution.js";
import { sanitizeBrowserUrl } from "../../domain/browserObservation.js";
import type { CdpRuntimeSources } from "./CdpRuntimeSources.js";

type Initiator = WebExecution["requests"][number]["reported_initiator"];
const isObject = (value: Initiator[string] | undefined): value is Initiator =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Sanitize known transport fields while retaining declarations and every unknown producer field. */
export const sanitizeRuntimeInitiator = (
  initiator: Initiator,
  sources: CdpRuntimeSources,
): Initiator => {
  if (typeof initiator.url === "string")
    initiator.url = sanitizeBrowserUrl(initiator.url).url;
  let stack = initiator.stack;
  while (isObject(stack)) {
    if (Array.isArray(stack.callFrames))
      for (const frame of stack.callFrames)
        if (
          isObject(frame) &&
          typeof frame.url === "string" &&
          typeof frame.scriptId === "string"
        )
          frame.url = sources.sourceUrl(frame.scriptId, frame.url);
    stack = stack.parent;
  }
  return initiator;
};
