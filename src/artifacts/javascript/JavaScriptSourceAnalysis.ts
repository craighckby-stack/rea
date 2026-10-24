/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:06:42.627Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type {
  JavaScriptSourceAnalysisLimits,
  JavaScriptSourceAnalysisPort,
} from "../../domain/javascript/javascriptSourceAnalysis.js";
import { JavaScriptAnalysisWorker } from "../../javascript/analysis/JavaScriptAnalysisWorker.js";

/** Construct the inert artifact analyzer; resources are acquired on the first source. */
export const createJavaScriptSourceAnalysis = (
  limits: JavaScriptSourceAnalysisLimits,
  sourceCount: number,
): JavaScriptSourceAnalysisPort =>
  new JavaScriptAnalysisWorker(limits, undefined, sourceCount);
