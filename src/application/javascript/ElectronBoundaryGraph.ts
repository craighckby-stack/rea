/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:56:21.595Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { JavaScriptArtifactGraphContext } from "./JavaScriptArtifactGraphContext.js";
import { addElectronIpcBoundaries } from "./ElectronBoundaryGraphIpc.js";
import { addElectronNativeBoundaries } from "./ElectronBoundaryGraphNative.js";
import { addElectronWindowBoundaries } from "./ElectronBoundaryGraphWindows.js";
import { addElectronCallPaths } from "./ElectronBoundaryGraphCallPaths.js";

/** Add every static Electron process and security-boundary fact to the JAG. */
export const addElectronBoundaries = (
  context: JavaScriptArtifactGraphContext,
): void => {
  addElectronWindowBoundaries(context);
  addElectronIpcBoundaries(context);
  addElectronNativeBoundaries(context);
  addElectronCallPaths(context);
};
