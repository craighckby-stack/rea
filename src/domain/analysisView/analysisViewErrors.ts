/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:28:01.672Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import {
  AnalysisInputError,
  type AnalysisInputIssue,
} from "../analysisErrorCore.js";

export const INSPECT_ANALYSIS_VIEW_OPERATION = "inspect_analysis_view" as const;

/** Construct a typed input failure for one selected-view constraint. */
export const analysisViewInputError = (
  issues: readonly AnalysisInputIssue[],
): AnalysisInputError =>
  new AnalysisInputError(INSPECT_ANALYSIS_VIEW_OPERATION, undefined, issues);
